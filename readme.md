# Express Auth for a Single Page Application

## Create an Express API

```js
const express = require("express");
const app = express();
const port = 8000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello My API!");
});

app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
});
```
This is the simplest express app you'll create. 
Next wed like to have the api interact with a http client. 
Let serve some data from the api


```js


const userDB = [{
        id: 1,
        name: "demo@nanosoft.co.za",
        password: "password",
    },
    {
        id: 2,
        name: "info@nanosoft.co.za",
        password: "password",
    },
];

app.get("/api/users", (req, res) => {
    res.json({ users: userDB.map((user) => ({ id: user.id, name: user.name })) }); 
});


```
Now with calling "http://localhost:8000/api/users" we get some user data

This means any and every client making this request will see the user data. We need to protect this route. 
We use a mechanism called middleware to selectively protect routes from being accessed without proper authenticated.

Let's add a "auth" middleware to the /api/users route:

```js
app.get("/api/users", auth, (req, res) => {
    res.json({ 
        users: userDB.map((user) => ({ id: user.id, name: user.name })) 
    });
});

```
 Now let's create the auth middleware:

 ```js

function auth(req, res, next) {
    const email = req.headers["email"]
    const password = req.headers["password"]
    const user = userDB.find((u) => u.name === email && u.password === password);
    if (user) {
        next();
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
 ```

Now only if the correct email and password is provided when making this request will it pass through the middleware onto the route.
Note: the auth middleware function needs to be declared before using it.

This middleware is bad and shouldn't be used. It performs authentication from scratch on every request.

The correct way of doing this is using JWT-based authentication. 

## Definition

Token-based authentication is a mechanism where, after a user successfully authenticates (usually via username + password), the server issues a token — a piece of data that represents the user’s identity and, optionally, permissions.

The client then includes this token with every subsequent request, either:

* in an HTTP header (commonly Authorization: Bearer <token>), or

* in a cookie (often a secure, HttpOnly session cookie).

The server verifies the token on each request and, if valid, grants access to protected resources. This pattern is stateless on the server side if the server doesn’t maintain session state, but can also be combined with sessions for additional security.


## Login Route

```js

app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = userDB.find((u) => u.name === email && u.password === password);
    if (user) {
        return res.json({ token: "demo-token-12345" });
    } else {
        return res.status(401).json({ error: "Invalid credentials" });
    }
});
```

This route will return a token to the client which the client will now need to include with all subsequent requests. Let's now change the auth middleware not in verify email and password but to verify token

## Updated Auth Middleware
```js
function auth(req, res, next) {
    const token = req.headers["token"]
    if (token === "demo-token-12345") {
        next();
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
```
This is an improvement as we're not asking the client to provide user credentials on each request but it's a very naive generation and verification of a token

## Better way of generating token
JWT tokens allows the server to create tokens that contain a payload and is signed with a secret key. This way allows use only to have the server generate tokens and the server verify tokens.
Ok so let us update the login route to generate JWT instead of a standard text based token that is consistent and can be easily verified.

```js
const jwt = require("jsonwebtoken");

app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = userDB.find((u) => u.name === email && u.password === password);
    if (user) {
        const token = jwt.sign({ email: user.name }, process.env.JWT_SECRET, { expiresIn: '30s' });
        return res.json({ token })
    } else {
        return res.status(401).json({ error: "Invalid credentials" });
    }
});
```

Here we see that the login route is generating a typical JWT which is signed with a JWT_SECRET(note signed and not encrypted). The token is then returned to the client on successful login.

## Update the Auth middleware
We now have to udpate the auth midddleware as we need to verify the token differently

```js

function auth(req, res, next) {
    try {
        const token = req.headers["Authorization"]?.split(" ")[1];
        var decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)
        next();

    } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
    }


}

```
We are asking the client application to send the token in an Authorization header with the "Bearer" prefix. This is the OAuth standard and is the preferred way of attaching the token. We do this as this is the OAuth standard and is compatible with OAuth tools and proxies.Therefore unless you have a very specific technical reason not to please use the Authorization Bearer header.

```
Authorization: Bearer <token>
```

Ok so let's look at our login code from our react application


Before we go to the client which we'll be running possibly from another domain or server or port, we need to configure the express server for CORS. CORS is a security mechanism to prevent js calls from another domain to the API server. To enable this cross domain calls we need to enable cors with restrictions on our express API.

```js

```

```jsx
 async function handleLogin() {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "demo@nanosoft.co.za",
        password: "password",
      }),
    })

    const data = await response.json()
    if (data.token) {
      setToken(data.token)
    } else {
      setToken(null)
    }

  }

```

Once we've saved our token somewhere on our client (in this case memory), we can make subsequent calls with the token attached

```js
 async function getAccountInfo() {
    const response = await fetch('http://localhost:8000/api/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()
    setUsers(data.users)
  }
```
As you can see we add the token to a specific Authorization header with the "Bearer" prefix. We do this as this is the OAuth standard and is compatible with OAuth tools and proxies.Therefore unless you have a very specific technical reason not to please use the Authorization Bearer header.
```
Authorization: Bearer <token>
```

## Client side code
Now lets focus on the client side code. Where in the react application would we store the token. The above example stores it in memory. This is great but not good enough as we'll have to re-auth everytime we refresh the page. We need another solution.


### 
Let's store it in local storage. 














