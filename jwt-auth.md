### **Protecting API Data in a Single Page Application**

Single Page Applications (SPAs) like React apps frequently communicate with APIs to fetch or update data. To keep this data secure, the API must verify that each request comes from an authenticated user — typically using JWT (JSON Web Token) authentication.

In this article, we’ll walk through how JWT authentication works between a client-side SPA and an API, including how tokens are issued, stored, and validated to maintain a secure and seamless user experience.

---

### **The Authentication Process (Using JWT)**

1. **User visits the client app**
   The user opens the client app by entering its URL in their browser.

2. **Client checks authentication status**
   On page load, the client app checks whether the user is already authenticated (we’ll cover how this check works shortly).

3. **Display login page (if unauthenticated)**
   If the user is not authenticated, the client app displays a login page.

4. **User provides credentials**
   The user enters their credentials to verify their identity.

5. **Credentials sent to API**
   Upon form submission, the credentials are sent to the API for verification.

6. **API verification**
   If the credentials are valid, the API responds with an **access token** and a **refresh token**.

7. **Store the tokens**
   The client app securely stores the access and refresh tokens for future API requests.

8. **Token verification on protected routes**
   When the API receives a request on a protected route, it verifies the access token.
   If valid, it allows the request to proceed and returns the requested data.

9. **Invalid or missing token**
   If the access token is missing or invalid, the API responds with an appropriate HTTP status (e.g., **401 Unauthorized**) and an error message.

10. **Access token renewal (using refresh token)**
    In practice, SPAs use the refresh token to obtain a new access token without requiring the user to log in again. This is explained in the next section.

---

### **JWTAuth Flow Diagram**

![JWTAuth Flow](/mnt/data/JWTAuth.png)

---

You are correct. Since the image provides the detailed visual flow, a concise explanation is often better for a blog post.

Here is a shorter, high-level explanation of the JWT Authentication Flow:

---

## The Authentication Process (Using JWT)

The accompanying diagram illustrates the complete flow for robust JWT authentication, utilizing both short-lived **Access Tokens** and long-lived **Refresh Tokens**.

### Key Phases:

1.  **Initial Access Check:**
    * When the client starts, it uses its stored **Access Token** to call a protected endpoint (e.g., `/api/me`).
    * If the token is **Valid**, the server returns data, and the client sets its status to "logged in," allowing subsequent protected calls.
    * If the token is **Invalid** (usually expired), the server returns a **401 Unauthorized** error.

2.  **Token Refresh:**
    * Upon a 401 error, the client automatically attempts to renew the token by calling `/api/auth/refresh` using the **Refresh Token**.
    * If the Refresh Token is **Valid**, the server issues a new Access Token (and often a new Refresh Token), and the client **retries the original API call**.
    * If the Refresh Token is **Invalid** (expired or revoked), the user is forced to the **Login Screen**.

3.  **User Login:**
    * If no valid tokens exist, the user must log in. The server verifies credentials and issues a **new pair** of Access and Refresh Tokens, which the client securely stores.

This dual-token system ensures that user sessions remain seamless while limiting the time an easily intercepted Access Token remains active, significantly improving security.


Sequence Diagrams

## Page Load
```
title Page Load
Browser [icon: browser, color: gray]
API [icon: server, color: blue]

Browser -> Browser: Refresh
Browser -> API: GET /api/me (+access token)
do [label: "/api/me"]{
  API -> API: verify access token
}
alt [label: Valid, color: green]{
  API -> Browser: User Data [color:green]
  Browser -> Browser : Update auth status
}
alt [label: Invalid]{
  API -> Browser: 401 [color:red]
  Browser -> API: GET /api/auth/refresh (+ refresh token)
  do [label: /api/auth/refresh] {
    API->API: Verify Refresh Token
  }
  alt [label: Valid refresh token, color: green]{
    API -> Browser: new access token [color:green]
    Browser -> API: Retry GET /api/me (+acces token)
  }
  alt [label: InValid refresh token]{
    API -> Browser: 401 [color:red]
    Browser -> Browser: Show Login Page
  }
}
```

## User Login
```
Browser [icon: browser, color: gray]
API [icon: server, color: blue]

Browser -> Browser: Show Login Page
Browser -> API: POST credentials /api/auth/login
do [label: "/api/auth/login"]{
  API -> API: Verify Credetials
}
alt [label: Valid Credentials, color: green]{
  API -> Browser: access and refresh tokens [color:green]
  Browser -> Browser : store tokens
  Browser -> API : GET /api/me (+access token)
}
alt [label: Invalid Credentials]{
  API -> Browser: 401 [color:red]
  Browser -> Browser: Show Login Screen  
}
```


### **Conclusion**

This flow provides a secure and user-friendly way for SPAs to maintain authentication without constant logins.
In the next post, we’ll demonstrate how to implement this process in code — including token storage, automatic refresh, and error handling patterns in a React app.

