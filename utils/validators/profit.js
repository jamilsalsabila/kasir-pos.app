
const { query } = require("express-validator");


const validateProfit = [
    // start_date
    query('start_date')
        .notEmpty().withMessage("start_date dibutuhkan")
        .isISO8601().withMessage("nilai start_date tidak valid"),


    // end_date
    query('end_date')
        .notEmpty().withMessage("end_date dibutuhkan")
        .isISO8601().withMessage("nilai end_date tidak valid"),

];

module.exports = validateProfit;