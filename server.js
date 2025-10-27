require("dotenv").config();
const express = require("express");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = 9000;


let userDB = {
    "demo@nanosoft.co.za": {
        id: 1,
        name: "demo@nanosoft.co.za",
        password: "password",
    },
    "info@nanosoft.co.za": {
        id: 2,
        name: "info@nanosoft.co.za",
        password: "password",
    },
};



app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.get("/", (req, res) => {
    res.send("Hello API!");
});

// Login Route for Login Page on Client
app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = userDB[email]
    if (user && user.password === password) {
        const access_token = jwt.sign({ email: user.name }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
        const refresh_token = jwt.sign({ email: user.name }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30s' });
        userDB[email].refresh_token = refresh_token;
        res.cookie('refresh_token', refresh_token, {
            secure: true,
            httpOnly: true,
            sameSite: "lax"
        });

        return res.json({ access_token })
    } else {
        return res.status(401).json({ error: "Invalid credentials" });
    }
});


// Create a new access token
app.get("/api/auth/refresh", (req, res) => {
    const refresh_token = req.cookies.refresh_token;

    try {
        const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        if (payload.email && userDB[payload.email].refresh_token === refresh_token) {
            const access_token = jwt.sign({ email: "demo@nanosoft.co.za" }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
            return res.json({ access_token })
        } else {
            return res.status(401).json({ "message": "Unauthorized" })
        }
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
    }


});

// Auth Middleware
function auth(req, res, next) {
    try {
        const token = req.headers["authorization"]?.split(" ")[1];
        var decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.decoded = decoded;
        next();

    } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
    }


}

// light weight protected call
app.get("/api/me", auth, (req, res) => {
    const { email } = req.decoded || {};
    const user = userDB[email];
    res.json({
        user: {
            email: user.name,
            id: user.id
        }
    });
});

//protected data
app.get("/api/data", auth, (req, res) => {
    const someProtectedData = {
        name: "Sample Name"
    }
    res.json(someProtectedData);
});


app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
});