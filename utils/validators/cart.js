const { body } = require("express-validator");


const validateCart = [
    // product_id
    body('product_id')
        .notEmpty().withMessage("product_id dibutuhkan"),
    // qty
    body('qty')
        .notEmpty().withMessage("qty dibutuhkan"),
];

module.exports = validateCart;