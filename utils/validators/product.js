const { body, check } = require("express-validator");
const prisma = require("../../prisma/client");

const validateProduct = [
    body('barcode')
        .trim()
        .notEmpty().withMessage("barcode dibutuhkan")
        .custom(async (val, { req }) => {

            const result = await prisma.product.findFirst({
                where: {
                    barcode: val,
                }
            });

            if (result && (!req.params.id || parseInt(req.params.id) !== result.id))
                throw new Error("barcode sudah digunakan");

            return true;
        }),
    check('image')
        .optional()
        .custom((val, { req }) => {

            const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/jpg'];

            if (!allowedMimeTypes.includes(req.file.mimetype))
                throw new Error("ini bukan file gambar");

            return true;
        }),
    body('category_id')
        .trim()
        .notEmpty().withMessage("category dibutuhkan")
        .custom(async (value, { req }) => {

            const result = await prisma.category.findFirst({
                where: {
                    id: parseInt(value),
                },
            });

            if (!result)
                throw new Error('category tidak ditemukan');

            return true;
        }),
    body('title')
        .trim()
        .notEmpty().withMessage("title dibutuhkan"),
    body('description')
        .trim()
        .notEmpty().withMessage("description dibutuhkan"),
    body('buy_price')
        .trim()
        .notEmpty().withMessage("buy_price dibutuhkan")
        .isNumeric({ no_symbols: false }).withMessage("bukan bilangan."),
    body('sell_price')
        .trim()
        .notEmpty().withMessage("sell_price dibutuhkan")
        .isNumeric({ no_symbols: false }).withMessage("bukan bilangan."),
    body('stock')
        .trim()
        .notEmpty().withMessage("stock dibutuhkan")
        .isNumeric({ no_symbols: true }).withMessage("bukan bilangan."),
];

module.exports = validateProduct;