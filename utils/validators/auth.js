const { body } = require("express-validator");
// const prisma = require("../../prisma/client");

const validateLogin = [
    body('email').notEmpty().withMessage('email diperlukan'),
    body('password').notEmpty().withMessage('password dibutuhkan'),
];

module.exports = validateLogin;