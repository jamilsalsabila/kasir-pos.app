const { MulterError } = require('multer');
const prisma = require('../prisma/client');
const fs = require('fs');


const findCategories = async (req, resp) => {

    try {
        // paginasi
        // contoh: http://localhost:3000/?page=1&limit=5&search=air
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        // ambil kata kunci search
        const search = req.query.search || '';

        // lompati hasil pencarian sebanyak {skip} untuk 
        // ditampilkan pada halaman paginasi selanjutnya
        // contoh: page = 2
        // skip = (2-1) * 5 = 5
        // data ke-5 sampai 10 akan ditampilkan pada 
        // halaman paginasi ke 2
        const skip = (page - 1) * limit;


        // ambil semuai category sesuai katakunci secara paginasi
        const result = await prisma.category.findMany({
            where: {
                name: {
                    contains: search, // mencari data berdasarkan katakunci
                },
            },
            select: {
                id: true,
                name: true,
                image: true,
                description: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,  // hati-hati: take, not limit

        });


        // ambil semua category sesuai katakunci
        const allResultCount = await prisma.category.count({
            where: {
                name: {
                    contains: search,
                },
            },
        });

        // hitung berapa jumlah halaman yang diperlukan
        // untuk menampilkan semua category sesuai katakunci
        const totalPages = Math.ceil(allResultCount / limit);

        // kirim response
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan kategori sesuai katakunci',
            },
            data: result,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: allResultCount,
            },
        });

    } catch (error) {
        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server',
            },
            errors: error,
        });
    }

};

const createCategory = async (req, resp) => {
    try {
        const data = {
            name: req.body.name,
            image: req.file.path,
            description: req.body.description,
        };

        const result = await prisma.category.create({
            data: data,
        });

        resp.status(201).json({
            meta: {
                success: true,
                message: 'category berhasil ditambahkan',
            },
            data: result,
        });

    } catch (error) {
        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan di sisi server.',
            },
            errors: error,
        });
    }
}

const findCategoryById = async (req, resp) => {
    try {
        // http://localhost:3000/api/categories/:id
        // id=1
        const { id } = req.params;

        // ambil category berdasarkan id
        const data = await prisma.category.findUniqueOrThrow({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                name: true,
                image: true,
                description: true,
                updated_at: true,
                created_at: true,
            },
        });

        resp.status(200).json({
            meta: {
                success: true,
                message: `category dengan id ${id} terdaftar di db.`,
            },
            data,
        });

    } catch (error) {
        if (error.code) {
            return resp.status(404).json({
                error,
            });
        }
        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi error di sisi server.',
            },
            errors: error,
            filename: __filename.split('/').pop(),
        });
    } finally {

        await prisma.$disconnect();
    }

}

const updateCategoryById = async (req, resp) => {
    try {
        // ambil id 
        // http://localhost:3000/api/categories/:id
        // id = 1
        const { id } = req.params;

        const data = {
            name: req.body.name,
            description: req.body.description,
        };

        // jika user mengganti gambar
        if (req.file) {

            data.image = req.file.path;

            // butuh path image lama
            // untuk menghapus
            const category = await prisma.category.findUniqueOrThrow({
                where: {
                    id: Number(id),
                },
                select: {
                    image: true,
                },
            });

            if (category.image)
                fs.unlinkSync(category.image);

        }

        // update category
        const result = await prisma.category.update({
            where: {
                id: Number(id),
            },
            data: data,
        });

        resp.status(200).json({
            meta: {
                success: true,
                message: 'data berhasil di update',
            },
            data: result,
        });

    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            errors: error,
        });
    }
}

const deleteCategoryById = async (req, resp) => {

    try {
        // ambil nilai id
        // contoh: http://localhost:3000/api/categories/:id
        const id = Number(req.params.id);

        // hapus record image
        // pertama harus tau dulu nama file gambar
        // yang mau dihapus
        const category = await prisma.category.findUniqueOrThrow({
            where: {
                id: id,
            },
            select: {
                image: true,
            },
        });

        // jika field image memiliki nilai
        if (category.image && fs.existsSync(category.image)) {
            fs.unlinkSync(category.image);
        }

        // hapus recordnya
        const { id: deletedId } = await prisma.category.delete({
            where: {
                id: id,
            },
            select: {
                id: true,
            },
        });

        resp.status(200).json({
            meta: {
                success: true,
                message: `record berhasil dihapus`,
            },
            id: deletedId,
        });

    } catch (err) {
        if (err.code) {
            return resp.status(404).json({
                err
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server',
                file: __filename.split("/").pop(),
            },
            errors: err,
        });
    } finally {

        await prisma.$disconnect();
    }
}

const allCategories = async (req, resp) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                id: "desc",
            },
        });

        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan semua kategori'
            },
            data: categories,

        });

    } catch (err) {

        resp.status(500).json({
            meta: {
                success: false,
                message: `terjadi kesalahan pada server`,
            },
            filename: __filename.split('/').pop(),
            errors: err,
        });

    } finally {

        await prisma.$disconnect();
    }

}

module.exports = {
    findCategories,
    createCategory,
    findCategoryById,
    updateCategoryById,
    deleteCategoryById,
    allCategories,
};