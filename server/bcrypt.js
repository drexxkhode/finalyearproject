const bcrypt = require("bcryptjs");

const password = "1234";

const hashPassword = async () => {
  try {
    const hashed = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashed);
  } catch (err) {
    console.error(err);
  }
};

hashPassword();