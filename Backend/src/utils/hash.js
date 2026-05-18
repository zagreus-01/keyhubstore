const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

const hashPassword = (password) => {
    if (!password) throw new Error("Password is required");
    return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = (password, hash) => {
    return bcrypt.compare(password, hash);
};

module.exports = {
    hashPassword,
    comparePassword
};