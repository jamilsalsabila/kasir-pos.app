const { body } = require("express-validator");


const validateTransaction = [
    // customer id (optional)
    body('customer_id')
        .trim()
        .optional()
        .isNumeric().withMessage('bukan bilangan'),

    // change
    body('change')
        .trim()
        .notEmpty().withMessage('field \'change\' dibutuhkan')
        .isNumeric({ no_symbols: false }).withMessage('bukan bilangan'),

    // discount (optional)
    body('discount')
        .trim()
        .optional()
        .isNumeric({ no_symbols: false }).withMessage('bukan bilangan'),

    // cash
    body('cash')
        .trim()
        .notEmpty().withMessage("field \'cash\' dibutuhkan")
        .isNumeric({ no_symbols: false }).withMessage('bukan bilangan'),

    // grand_total
    body('grand_total')
        .trim()
        .notEmpty().withMessage("field \'grand_total\' dibutuhkan")
        .isNumeric({ no_symbols: false }).withMessage('bukan bilangan.'),
];

module.exports = validateTransaction;