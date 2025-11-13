const { body } = require("express-validator");
const prisma = require("../../prisma/client");


const validateUser = [
    body('name').notEmpty().withMessage('name dibutuhkan'),
    body('email')
        .notEmpty().withMessage('email dibutuhkan')
        .isEmail().withMessage('email tidak benar')
        .custom(async (value, { req }) => {
            if (!value) throw new Error('email dibutuhkan');

            const user = await prisma.user.findFirst({
                where: {
                    email: value,
                    NOT: {
                        id: Number(req.params.id) || undefined,
                    }
                }
            });

            if (user) throw new Error("email sudah dipakai");

            return true;
        }),
    body('password').if((value, { req }) => req.method == "POST")
        .notEmpty().withMessage("password dibutuhkan")
        .isLength({ min: 6 }).withMessage("panjang password minimal 6 character")
        .matches(/[A-Z]/).withMessage("isi password minimal ada satu huruf kapital")
        .matches(/[a-z]/).withMessage("isi password minimal ada satu huruf kecil")
        .matches(/[0-9]/).withMessage("isi password minimal ada satu angka")
        .matches(/[^A-Za-z0-9]/).withMessage("isi password minimal ada satu simbol"),
    body('password').if((value, { req }) => req.method == "PUT")
        .optional(),
];

module.exports = validateUser;