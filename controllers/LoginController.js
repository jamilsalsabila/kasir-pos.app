const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const login = async (req, resp) => {

    try {
        // cek keberadaan user berdasarkan email (unique)
        const user = await prisma.user.findFirst({
            where: {
                email: req.body.email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
            }
        });

        if (!user)
            return resp.status(404).json({
                success: false,
                message: "user tidak ditemukan.",
            });


        // cek kebenaran password
        const equal = await bcrypt.compare(req.body.password, user.password);

        if (!equal)
            return resp.status(401).json({
                success: false,
                message: "password salah.",
            });


        // buatkan user token untuk mengakses halaman setelah login,
        // yaitu JWT
        const token = jwt.sign({ id: user.id, }, process.env.JWT_SECRET, { expiresIn: "1h", })


        // kirim JWT ke user
        const { password, ...userWithoutPassword } = user;

        resp.status(200).json({
            meta: {
                success: true,
                message: 'user teridentifikasi.',
            },
            data: {
                user: userWithoutPassword,
                token: token,
            },
        });

    } catch (error) {

        resp.status(500).json({
            meta: {
                success: false,
                message: "terjadi kesalahan di server.",
            },
            errors: error,
        });
    }

};

module.exports = login;