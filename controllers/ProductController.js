const prisma = require('../prisma/client');
const fs = require('fs').promises;

const findProducts = async (req, resp) => {
    try {
        // pertama, ambil nilai search, limit, dan page dari URL
        // contoh: http://localhost:3000/?page=2&limit=5&search=aa
        // page = 1 
        // limit = 5 
        // search = aa
        const page = Number(req.query.page) || 1;
        // jika page == null, maka di isi nilai 1
        const limit = Number(req.query.limit) || 5;
        // jika limit == null, maka di isi nilai 5
        const search = req.query.search || '';
        // jika search == null, maka di isi string kosong
        const skip = (page - 1) * limit;
        // ambil data pada posisi tertentu di db sesuai nila 'page'

        // kedua, buatkan data paginasi
        const totalProducts = await prisma.product.count({
            where: {
                title: {
                    contains: search,
                },
            },
        });

        const totalPages = Math.ceil(totalProducts / limit);
        // jumlah halaman yang diperlukan
        const pagination = {
            currentPage: page,
            totalPages: totalPages,
            perPage: limit,
            totalProducts: totalProducts,
        };

        // ketiga, ambil data product sesuai katakunci
        const products = await prisma.product.findMany({
            where: {
                title: {
                    contains: search,
                }
            },
            select: {
                id: true,
                barcode: true,
                title: true,
                image: true,
                description: true,
                buy_price: true,
                sell_price: true,
                stock: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        // keempat, buatkan response
        resp.status(200).json({
            meta: {
                success: true,
                message: 'data berhasil didapatkan',
            },
            data: products,
            pagination: pagination,
        });

    } catch (err) {

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            filename: __filename.split('/').pop(),
            error: err,

        });

    } finally {

        await prisma.$disconnect();
    }
};

const createProduct = async (req, resp) => {

    try {
        // ambil data berikut dari request objek:
        // 1. title
        const title = req.body.title;
        // 2. category_id
        const category_id = parseInt(req.body.category_id);
        // 3. image
        const image = req.file.path;
        // 4. barcode
        const barcode = req.body.barcode;
        // 5. description
        const description = req.body.description;
        // 6. buy_price
        const buy_price = parseFloat(req.body.buy_price);
        // 7. sell_price
        const sell_price = parseFloat(req.body.sell_price);
        // 8. stock
        const stock = parseInt(req.body.stock);


        // masukkan ke variable data
        const data = {
            title,
            category_id,
            image,
            barcode,
            description,
            buy_price,
            sell_price,
            stock,
        };


        // masukkan data ke db
        const result = await prisma.product.create({
            data: data,
            include: {
                category: true,
            }
        });


        // kirim response ke pengguna
        resp.status(201).json({
            meta: {
                success: true,
                message: 'data berhasil dimasukkan ke db.',
            },
            file: __filename.split('/').pop(),
            data: result,
        });

    } catch (err) {
        if (err.code) {
            return resp.status(400).json({
                err,
            })
        }
        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            errors: err,
        });
    }


};

const findProductById = async (req, resp) => {
    try {
        // ambil nilai parameter id
        // contoh: http://localhost:3000/api/products/:id
        // id = 2
        const id = parseInt(req.params.id);


        // setelah mendapatkan nilai id, maka selanjutnya 
        // cari datanya di db 
        const result = await prisma.product.findUniqueOrThrow({
            where: {
                id: id,
            },
            select: {
                category: {
                    select: {
                        name: true,
                        description: true,
                        image: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
                updated_at: true,
                created_at: true,
                category_id: true,
                image: true,
                stock: true,
                sell_price: true,
                buy_price: true,
                description: true,
                title: true,
                barcode: true,
                id: true,
            },
        });

        resp.status(200).json({
            meta: {
                success: true,
                message: 'data berhasil didapatkan.',
            },
            data: result,
        });

    } catch (error) {
        if (error.code) {
            return resp.status(404).json({
                meta: {
                    success: false,
                    message: 'gagal mendapatkan data.'
                },
                error,
            });
        }
        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            error,
        });
    }
};

const updateProductById = async (req, resp) => {

    try {
        // ambil nilai parameter id
        const id = parseInt(req.params.id);


        // konstruksi data yang ingin di upload
        const data = {
            title: req.body.title,
            description: req.body.description,
            barcode: req.body.barcode,
            category_id: parseInt(req.body.category_id),
            sell_price: parseInt(req.body.sell_price),
            buy_price: parseInt(req.body.buy_price),
            stock: parseInt(req.body.stock),
        };


        // jika pengguna mengubah gambar
        if (req.file) {

            data.image = req.file.path;


            // cek apakah field image bernilai null
            const category = await prisma.product.findFirstOrThrow({
                where: {
                    id: id,
                },
                select: {
                    image: true,
                },
            });


            // jika tidak null, maka hapus gambar lama
            if (category.image) {

                await fs.unlink(category.image);
            }
        }


        // masukkan ke db
        const result = await prisma.product.update({
            where: {
                id: id,
            },
            data: data,
            include: {
                category: true,
            }
        });


        // kembalikan respon ke pengguna
        resp.status(200).json({
            meta: {
                success: true,
                message: 'data berhasil di update.',
            },
            data: result,
        });

    } catch (error) {

        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal mengubah data.',
                },
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server',
            },
            error,
        });
    }

};

const deleteProductById = async (req, resp) => {

    try {
        /*
         ambil nilai id dari URL
         contoh: http://localhost:3000/api/products/:id
         id = 2
         */
        const id = parseInt(req.params.id)


        /*
        ambil nilai field image dari db
         */
        const product = await prisma.product.findFirstOrThrow({
            where: {
                id: id,
            },
            select: {
                image: true,
            }
        });


        /*
        hapus image 
         */
        if (product.image) { // jika product memiliki gambar 

            await fs.access(product.image, fs.constants.F_OK);

            await fs.unlink(product.image);
        }


        /*
         hapus recored
         */
        const { id: deletedRecordId } = await prisma.product.delete({
            where: {
                id: id,
            },
            select: {
                id: true,
            },
        });

        /*
         kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'record berhasil dihapus',
            },
            data: {
                id: deletedRecordId,
            }
        });

    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'record gagal dihapus.',
                },
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server',
            },
            file: __filename.split('/').pop(),
            error,
        });
    }
};

const findProductByCategoryId = async (req, resp) => {

    try {

        /**
         * ambil nilai parameter id 
         * contoh: http://localhost:3000/api/products-by-category/:id
         * id = 4
         */
        const id = parseInt(req.params.id);


        /**
         * ekstrak nilai limit dan page, buat pagination
         * contoh: http://localhost:3000/api/products-by-category/:id?limit=5&page=2
         * id = 4 
         * limit = 5, default = 5
         * page = 2, default = 1
         */
        const limit = parseInt(req.query.limit) || 5;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;


        /**
         * ambil record yang sesuai dengan category
         */
        const products = await prisma.product.findMany({
            where: {
                category: {
                    id: id,
                }
            },
            include: {
                category: true,
            },
            skip: skip,
            take: limit,
        });


        /**
         * hitung total record, berdasarkan category id 
         */
        const totalProducts = await prisma.product.count({
            where: {
                category_id: id,
            }
        });


        /**
         * hitung total page, buat pagination
         * contoh: [1][2][3]...
         */
        const totalPages = Math.ceil(totalProducts / limit);


        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'record berhasil didaparkan',
            },
            data: {
                products,
            },
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                limitPerPage: limit,
                totalProducts: totalProducts,
            }
        });

    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal mendapatkan record.',
                },
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            error,
        });
    }
};

const findProductByBarcode = async (req, resp) => {

    try {
        /**
         * ambil nilai barcode dari request body
         */
        const barcode = req.body.barcode;


        /**
         * ambil data di db, yang sesuai dengan nilai barcode
         */
        const product = await prisma.product.findFirstOrThrow({
            where: {
                barcode: barcode,
            },
            include: {
                category: true,
            },
        });



        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan record.',
            },
            data: {
                product,
            },
        });


    } catch (error) {

        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal mendapatkan record.',
                },
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            function: 'findProductByBarcode',
            error,

        });
    }
};


module.exports = {
    findProducts,
    createProduct,
    findProductById,
    updateProductById,
    deleteProductById,
    findProductByCategoryId,
    findProductByBarcode,
};