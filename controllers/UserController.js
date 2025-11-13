//const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');

const findUsers = async (req, resp) => {
    try {

        // contoh: http://localhost:3000/?search=sie&limit=5&page=1

        // ?limit=5
        const limit = parseInt(req.query.limit) || 5;
        // &page=1
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // &search=sie
        const search = req.query.search || '';

        // ambil dari db nama user yang mengandung 'sie'
        const users = await prisma.user.findMany({
            where: {
                name: {
                    contains: search,
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                id: "desc",
            },
            take: limit,
            skip: skip,
        });


        // menghitung jumlah user yang namanya mengandung 'sie'
        const totalUser = await prisma.user.count({
            where: {
                name: {
                    contains: search,
                },
            },
        });

        // menghitung jumlah halaman yang diperlukan buat pagination
        const totalPages = Math.ceil(totalUser / limit);

        // kembalikan data
        resp.status(200).json({
            meta: {
                success: true,
                message: "berhasil mengambil semua user.",
            },
            data: users,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                total: totalUser,
            },
        });
    } catch (error) {
        resp.status(500).json({
            meta: {
                success: false,
                message: `terjadi kesalahan di server`,
            },
            errors: error,
        });
    } finally {


        await prisma.$disconnect();
    }
};

const createUser = async (req, resp) => {
    try {
        // get input: name, email, password
        const { name, email, password } = req.body;

        // hashed password
        const hashedPassword = await bcrypt.hash(password, 10);

        // send to db
        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword,
            },
        });

        // return response
        resp.status(201).json({
            meta: {
                success: true,
                message: "user baru berhasil dibuat",
            },
            data: newUser,
        });
    } catch (error) {
        resp.status(500).json({
            meta: {
                success: false,
                message: "terjadi kesalahan pada server.",
            },
            errors: error,
        });
    } finally {


        await prisma.$disconnect();
    }
};

const findUserById = async (req, resp) => {
    // ambil nilai dari parameter id
    // contoh: http://localhost:3000/api/users/2
    const { id } = req.params;

    try {

        // cari di db data user dengan id=2
        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(id),
            },
            select: {
                id: true,
                email: true,
                name: true,
            }
        });

        if (!user)
            return resp.status(404).json({ success: false, message: 'user tidak ditemukan.' });

        resp.status(200).json({
            meta: {
                success: true,
                message: 'user ditemukan.',
            },
            data: user,
        });

    } catch (error) {
        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi masalah di server.',
            },
            errors: error,
        });
    } finally {

        await prisma.$disconnect();
    }

};

const updateUser = async (req, resp) => {
    // ambil id melalui parameter URL
    // contoh: http://localhost:3000/api/users/:id
    // id = 2
    const { id } = req.params; // jangan lupa mengubahnya dari string menjadi tipe data integer,

    // ambil nilai {name, email} dari req.body
    const userData = {
        name: req.body.name,
        email: req.body.email,
    }


    try {

        // jika passwordnya diperbarui, maka hash ulang.
        // ini selaras dengan skema validasi password yang jika
        // req.method === PUT, maka pengecekannya bersifat optional
        // karna bersifat optional, maka jika user mengubah passwordnya
        // maka kita harus melakukan pengecekan terhadap field password
        // di frontendya seperti dibawah ini, apakah memiliki nilai atau tidak
        if (req.body.password !== '') {
            const { password } = req.body;

            const newPassword = await bcrypt.hash(password, 10);

            userData.password = newPassword;
        }

        // update data user
        const result = await prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: userData,
        });

        resp.status(204).json({
            meta: {
                success: true,
                message: 'data berhasil di update.',
            },
            data: result,
        });

    } catch (error) {
        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            errors: error,
        });
    } finally {

        await prisma.$disconnect();
    }
};

const deleteUser = async (req, resp) => {

    try {

        // ambil nilai id dari parameter URL
        // cth: http://localhost:3000/api/users/:id
        // id = 2
        const id = parseInt(req.params.id);


        console.log(req.userId);
        console.log(id);

        // cari user menggunakan id kemudian menghapushnya
        const user = await prisma.user.delete({
            where: {
                id: id,
                NOT: { id: parseInt(req.userId) },
            },
        });




        resp.status(204).json({
            meta: {
                success: true,
                message: 'berhasil menghapus user.',
            },
            data: user,
        });




    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            resp.status(404).json({
                meta: {
                    success: false,
                    message: 'user not found',
                },
                errors: error,
            });
        }
        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi masalah di server',
            },
            errors: error,
        });
    } finally {


        await prisma.$disconnect();
    }
};

module.exports = {
    findUsers,
    createUser,
    findUserById,
    updateUser,
    deleteUser,
};
