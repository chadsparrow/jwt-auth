# jwt-auth

A small demo to show how to set up JSON Web Token Signing and Verification on Node.js / Express backend

This demo backend uses:

- Express for routing
- input sanitization and security using:
  - helmet
  - cross-site scripting security
  - rate-limiter for brute force attacks

## INITIAL SETUP

1. Duplicate the config.env.example file in the config folder and set up the environment variables inside to your liking

1. Edit the `app.js` file

- on `line 66` and setup the tempUser to your liking or incorporate your own database setup and calls to retrieve/verify username/password combos
- Edit the rate limiter to your liking starting on `line 23`
- Enabled CORS if you are making requests from a different domain than the Node Backend (`uncomment line 15 & 20`)
- Set expiration amount for JSON Web Token `line 115`

#### BASE URL : http://localhost:[PORT]

### Endpoints

- `POST /login`

  - REQUEST: must provide an valid email and password in json or form-urlencoded format (ie. email: test@test.com, password: testpassword)

  - successful response:

  ```
    {
      "success": true,
      "msg": "Login Succeeded",
      "token": <token>
    }
  ```

* `GET /protected`

  - Secured endpoint example
  - Middleware set to verify JSON Web Token before serving endpoint
  - Must provide valid **JSON WEB TOKEN** in 'Authorization' Header with "Bearer" (ie. Authorization: Bearer [token])

  - successful response:

  ```
  {
    "success": true,
    "msg": "Welcome to the protected endpoint",
    "user": {
        "email": "test@test.com",
        "password": "testpassword"
    },
    "exp": 1580157118
  }
  ```
