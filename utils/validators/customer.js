const { body } = require("express-validator");


const validateCustomer = [
    // name
    body('name')
        .notEmpty().withMessage("name dibutuhkan"),
    // no_telp
    body('no_telp')
        .notEmpty().withMessage("no_telp dibutuhkan"),
    // address
    body('address')
        .notEmpty().withMessage("address dibutuhkan"),
];

module.exports = validateCustomer;