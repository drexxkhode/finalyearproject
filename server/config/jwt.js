const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
       id: user.id,
      role: user.role,
      turf_id: user.turf_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );
};

module.exports = generateToken;