const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secret123");
    // req.user = decoded; // Attach decoded user information to the request object
    next();
  } catch (error) {
    res.status(403).json({ message: "Forbidden" });
  }
};

const generateJWT = (payload) => {
  const options = {
    // expiresIn,
  };
  // if (expiresIn !== null) {
  //   options.expiresIn = expiresIn;
  // }
  const secretKey = "secret123"; // Assuming you have loaded the secret key from an environment variable
  return jwt.sign(payload, secretKey, options);
};

module.exports = { verifyJWT, generateJWT };
