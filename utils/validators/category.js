const { body, check } = require("express-validator");


const validateCategory = [
    body('name')
        .notEmpty().withMessage("nama dibutuhkan"),

    check('image')
        .optional()
        .custom((val, { req }) => {

            if (req.method === "POST" && !req.file)
                throw new Error("gambar diperlukan");

            return true;
        }),

    body('description')
        .notEmpty().withMessage("deskripsi dibutuhkan"),
];

module.exports = validateCategory;