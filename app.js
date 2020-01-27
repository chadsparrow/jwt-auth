require("dotenv").config({ path: "./config/config.env" });
const path = require("path");
const express = require("express");
require("express-async-errors"); // handle all async promise rejections/uncaught exceptions without try catch blocks
const jwt = require("jsonwebtoken");
require("colors");

const app = express();

// Setup security and sanitization
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
// const cors = require("cors"); // un-comment if cors is necessary

app.use(helmet());
app.use(xss());
app.use(hpp());
// app.use(cors()); // un-comment if cors is necessary

// rate limiting 250 requests in 1 min
const limiter = rateLimit({
  windowsMs: 60 * 1000, // 1 minutes
  max: 250 // max requests
});
app.use(limiter);

// set up body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// setup static folder to be served by node
app.use(express.static(path.join(__dirname, "static")));

// allow responses to be served if behind a proxy
app.enable("trust proxy");

// handle all uncaught exceptions
process.on("uncaughtException", ex => {
  console.error(ex.message.red);
  process.exit(1);
});

// throw exception to uncaught exception handler if unhandled promise rejection
process.on("unhandledRejection", ex => {
  throw ex;
});

// shut down
process.on("SIGINT", () => {
  console.log("Shut down Node/Express Server".red.bold);
  process.exit();
});

// Check if JWT_PRIVATE_KEY env variable is set - set to any string you want
if (
  typeof process.env.JWT_PRIVATE_KEY === undefined ||
  !process.env.JWT_PRIVATE_KEY
) {
  console.error("FATAL ERROR: JWT_PRIVATE_KEY is not defined".red.bold.inverse);
  process.exit(1);
}

// fake user for demo purposes - replace with your own database to call from
const tempUser = {
  email: "test@test.com",
  password: "testpassword"
};

// verify JWT Middleware
const verifyJWT = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(400).send({ success: false, msg: "Token not provided" });
  }
  const token = req.headers["authorization"].split(" ")[1];

  jwt.verify(token, process.env.JWT_PRIVATE_KEY, (err, decoded) => {
    if (err)
      return res.status(400).send({ success: false, msg: "Invalid Token" });

    if (decoded.exp > Date.now())
      return res
        .status(400)
        .send({ success: false, msg: "Token expired, please login again" });

    req.user = decoded.user;
    delete req.user.password;
    req.exp = decoded.exp;
    next();
  });
};

// endpoint to login and obtain json web token
app.post("/login", (req, res) => {
  // check if email & password are in req.body
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({
      success: false,
      msg: "Please send a valid email - password combo"
    });
  }

  const { email, password } = req.body;

  if (email !== tempUser.email || password !== tempUser.password) {
    return res
      .status(401)
      .send({ success: false, msg: "Email or Password is invalid" });
  }

  // JWT Signed async with user data and expires in 1 hour, callback passes token in response
  jwt.sign(
    {
      user: {
        email: tempUser.email
      }
    },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: "1h" },
    (err, token) => {
      if (err) {
        return res.status(500).send({
          success: false,
          msg: "Server Error, please try again later"
        });
      }

      return res
        .status(200)
        .send({ success: true, msg: "Login Succeeded", token });
    }
  );
});

// protected endpoint that verifies token before sending response
app.get("/protected", verifyJWT, (req, res) => {
  return res.status(200).send({
    success: true,
    msg: "Welcome to the protected endpoint",
    user: req.user,
    exp: req.exp
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `App listening on port ${PORT}, ENV: ${process.env.NODE_ENV}`.green
      .underline.bold
  );
});
