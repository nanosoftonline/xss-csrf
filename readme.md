# Express JWT Auth for a Single Page Application

## Create an Express API
We need to setup the express server with the following specs
1. Enable json body input (enable body parser through express)
1. Enable cors for cross domain comms (install and enable cors)
1. Enable the express server to set and get cookies (install and use cookie parser)

```js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const port = 8000;

// enable json body input
app.use(express.json()); 

// enable cors for cross domain comms and enable cookies
app.use(cors({ 
    origin: 'http://localhost:5173', 
    credentials: true 
})); 

// enable cookie parser
app.use(cookieParser());

// enable urlencoded body input for forms
app.use(express.urlencoded({ extended: true })); 

app.get("/", (req, res) => {
    res.send("Hello My API!");
});

app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
});
```
As can be seen we've enable cors, but for only a specific orgin, in this case our dev application running on localhost:5173.
We've also switched on credentials, as this is need for cookie transfer from client to server.

## Our session database

```js

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



```

For now we'll use a userdb object to emulate a database. 

## 🔐 Understanding the Auth Middleware
### Purpose

The auth middleware acts as a security checkpoint for protected routes in your Express API.
Its job is to:

* Verify that the request contains a valid **JWT access token.**

* Decode the token to extract the user’s information (e.g., email or user ID).

* Allow or deny access based on the token’s validity.

Without this middleware, any client could freely access protected API endpoints like /api/me.

---

### **How It Fits In**

In your route definition:

```js
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
```

The route `/api/me` is **protected** by the `auth` middleware.
When a request hits this endpoint:

1. Express runs the `auth` middleware **first**.
2. If the middleware verifies the token successfully, it attaches the decoded payload to `req.decoded` and calls `next()` to continue.
3. If verification fails, it immediately returns a `401 Unauthorized` response.

---

### **Code Breakdown**

```js
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
```

---

### **Step-by-Step Explanation**

#### 1️⃣ Extract the Token

The token is expected in the request header as:

```
Authorization: Bearer <access_token>
```

The code:

```js
const token = req.headers["authorization"]?.split(" ")[1];
```

splits the header string at the space (`"Bearer "`), taking the second part — the actual token.

---

#### 2️⃣ Verify the Token

```js
jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
```

* Uses the **JWT secret key** (stored securely in your environment variables).
* Ensures the token:

  * Has not expired.
  * Has not been tampered with.
  * Was signed with your secret.

If verification fails (e.g., expired, invalid signature, or missing token), an error is thrown and caught in the `catch` block.

---

#### 3️⃣ Attach Decoded Data

If verification succeeds, `jwt.verify` returns the decoded payload (e.g. `{ email, id, iat, exp }`).

The line:

```js
req.decoded = decoded;
```

stores that data in the request object so that downstream routes (like `/api/me`) can use it to identify the user.

---

#### 4️⃣ Pass Control to the Next Handler

When everything checks out:

```js
next();
```

moves the request along to the actual route handler.

---

#### 5️⃣ Handle Unauthorized Access

If any error occurs (missing or invalid token):

```js
return res.status(401).json({ error: "Unauthorized" });
```

stops the request and sends a **401 Unauthorized** response to the client.

---

### **In Summary**

| Step | Operation                      | Purpose                               |
| ---- | ------------------------------ | ------------------------------------- |
| 1    | Extract `Authorization` header | Get the JWT from the request          |
| 2    | Verify JWT                     | Ensure token is valid and not expired |
| 3    | Attach decoded payload         | Make user data available to the route |
| 4    | Call `next()`                  | Continue to protected route           |
| 5    | Catch errors                   | Reject unauthorized requests          |

---

### **Why It’s Needed in a SPA**

In a Single Page Application:

* The frontend (e.g. React app) stores and sends the **access token** in each request header.
* The Express backend verifies that token using this middleware before serving protected data.
* This ensures only logged-in users (with valid tokens) can access sensitive endpoints like `/api/me`.

---

## 🔄 **What if the Access Token is Invalid or Expired?**

In a JWT-based authentication flow, **access tokens** have a **short lifespan** — usually a few minutes — to reduce the risk of unauthorized access if the token is ever stolen.

When the access token expires, the user should **not** be forced to log in again.
Instead, we use a **refresh token** to obtain a new valid access token.

---

### **The Refresh Token**

The **refresh token**:

* Has a much **longer expiration time** (often days or weeks).
* Is **stored securely in an HTTP-only cookie** so it can’t be accessed by JavaScript.
* Is used only to request a **new access token** when the old one expires.

---

### **Refresh Token Endpoint**

Here’s how it’s implemented in your API:

```js
app.get("/api/auth/refresh", (req, res) => {
    const refresh_token = req.cookies.refresh_token;

    try {
        const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        if (payload.email && userDB[payload.email].refresh_token === refresh_token) {
            const access_token = jwt.sign(
                { email: payload.email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15s' } // very short for testing
            );
            return res.json({ access_token });
        } else {
            return res.status(401).json({ message: "Unauthorized" });
        }
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
    }
});
```

---

### **Step-by-Step Explanation**

#### 1️⃣ Retrieve the Refresh Token

```js
const refresh_token = req.cookies.refresh_token;
```

The refresh token is sent automatically by the browser via cookies (since it’s `HttpOnly` and `SameSite=None`).
If it’s missing, the user likely hasn’t logged in or their session has expired completely.

---

#### 2️⃣ Verify the Refresh Token

```js
const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
```

This ensures:

* The token was created by your server (not forged).
* It hasn’t expired yet.
* It hasn’t been tampered with.

---

#### 3️⃣ Cross-Check Stored Token

```js
userDB[payload.email].refresh_token === refresh_token
```

The app checks the stored token in the “database” (here simulated by `userDB`) to ensure it matches.
This prevents reuse of **stolen or old refresh tokens**.

If the check passes, we know the request is legitimate.

---

#### 4️⃣ Issue a New Access Token

```js
const access_token = jwt.sign(
    { email: payload.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15s' }
);
```

A new short-lived access token is created.
In a real application, you’d typically set the expiry to something like **15 minutes** rather than 15 seconds.

The new token is sent back to the client:

```js
res.json({ access_token });
```

The client then stores this token (in memory, not localStorage) and uses it for future API calls.

---

#### 5️⃣ Handle Invalid or Expired Refresh Tokens

If verification fails — for example, if the refresh token:

* has expired,
* is missing, or
* doesn’t match the stored one —

then the API returns:

```js
res.status(401).json({ error: "Unauthorized" });
```

At this point, the client must **redirect the user to log in again**, because both the access and refresh tokens are no longer valid.

---

### **Putting It All Together**

Here’s what happens in sequence:

| Scenario                           | API Route           | Description                                        |
| ---------------------------------- | ------------------- | -------------------------------------------------- |
| ✅ Valid access token               | `/api/me`           | `auth` middleware passes → return user info        |
| ⚠️ Expired or invalid access token | `/api/auth/refresh` | Validate refresh token → issue new access token    |
| ❌ Expired or invalid refresh token | `/api/auth/refresh` | Return `401 Unauthorized` → user must log in again |

---

### **Summary of Token Roles**

| Token Type        | Lifetime            | Stored In        | Purpose                                     |
| ----------------- | ------------------- | ---------------- | ------------------------------------------- |
| **Access Token**  | Short (e.g. 15 min) | Memory (client)  | Authorize API requests                      |
| **Refresh Token** | Long (e.g. 7 days)  | HTTP-only Cookie | Issue new access token when old one expires |

---

## ⚙️ Automatically Refreshing the Access Token on the Client (SPA Side)

When the access token expires, any protected API call (like /api/me) will fail with a 401 Unauthorized error.
Instead of logging the user out immediately, the client app should attempt to refresh the access token using the refresh token (stored in the secure cookie).

Typical Flow

Here’s what happens in sequence:

1. The SPA calls a protected endpoint (e.g. /api/me) using the current access token.

1. If the token is still valid → request succeeds.

1. If the token has expired → the server responds with 401 Unauthorized.

1. The SPA automatically calls /api/auth/refresh to get a new access token.

1. If refresh succeeds → retry the original request with the new access token.

1. If refresh fails → log the user out and redirect them to the login screen.




Excellent — here’s the **next section** that ties the flow together from the client’s perspective.
This section explains how your **Single Page Application (SPA)** should handle an **expired access token** and use the `/api/auth/refresh` endpoint to stay authenticated seamlessly.

---

## ⚙️ **Automatically Refreshing the Access Token on the Client (SPA Side)**

When the access token expires, any protected API call (like `/api/me`) will fail with a **401 Unauthorized** error.
Instead of logging the user out immediately, the client app should attempt to **refresh the access token** using the refresh token (stored in the secure cookie).

---

### **Typical Flow**

Here’s what happens in sequence:

1. The SPA calls a protected endpoint (e.g. `/api/me`) using the current access token.
2. If the token is still valid → request succeeds.
3. If the token has expired → the server responds with `401 Unauthorized`.
4. The SPA automatically calls `/api/auth/refresh` to get a new access token.
5. If refresh succeeds → retry the original request with the new access token.
6. If refresh fails → log the user out and redirect them to the login screen.

---

### **Why Store Tokens This Way**

| Token             | Where It’s Stored                      | Why                                              |
| ----------------- | -------------------------------------- | ------------------------------------------------ |
| **Access Token**  | `sessionStorage` or in-memory variable | Prevents persistent XSS theft; short-lived       |
| **Refresh Token** | Secure, HTTP-only cookie               | Cannot be accessed by JS; reduces attack surface |

This separation keeps your app **secure** and **user-friendly**, allowing silent reauthentication in the background without exposing sensitive data.

---

### **End-to-End Request Lifecycle**

Here’s the full cycle at a glance:

| Step | Request                      | Description                                               |
| ---- | ---------------------------- | --------------------------------------------------------- |
| 1️⃣  | `/api/me`                    | SPA calls API with `Authorization: Bearer <access_token>` |
| 2️⃣  | ✅ 200 OK                     | Access token is valid → return user data                  |
| 3️⃣  | ❌ 401 Unauthorized           | Access token expired                                      |
| 4️⃣  | `/api/auth/refresh`          | Browser sends refresh cookie → new access token issued    |
| 5️⃣  | Retry `/api/me`              | Now succeeds with new token                               |
| 6️⃣  | ❌ 401 again (refresh failed) | Both tokens invalid → force re-login                      |

---

### **Summary**

The client’s job is to:

* Always attach the current **access token** in requests.
* Catch **401 Unauthorized** responses.
* Use the **refresh token endpoint** to renew the session automatically.
* Log the user out if the refresh fails.

This ensures a smooth, secure experience for the user while keeping authentication state under tight control.

