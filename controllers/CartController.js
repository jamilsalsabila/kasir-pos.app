const prisma = require('../prisma/client');


const findCartsByUserId = async (req, resp) => {

    try {
        /**
         * ambil nilai 'userId' dari 'req.userId'
         * nilai 'userId' berasal dari nilai 'id' yang 
         * didapat setelah login, yaitu
         * setelah JWT Token di-decode.
         */
        const userId = parseInt(req.userId);


        /**
         * ambil record cart dari db berdasarkan user 'id'
         */
        const carts = await prisma.cart.findMany({
            where: {
                cashier: {
                    id: userId,
                },
            },
            orderBy: {
                id: "desc" // urutkan berdasarkan data terbaru
            },
            select: {
                id: true,
                cashier_id: true,
                product_id: true,
                qty: true,
                price: true,
                created_at: true,
                updated_at: true,
                cashier: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        title: true,
                        sell_price: true,
                        buy_price: true,
                        image: true,
                    },
                },
            },

        });


        /**
         * hitung harga total
         */
        const totalPrice = carts.reduce((sum, cart) => sum + cart.price, 0);


        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan cart',
            },
            data: {
                carts,
            },
            totalPrice,
        });

    } catch (error) {

        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal mendapatkan cart.',
                },
                file: __filename.split('/').pop(),
                func: findCartsByUserId.name,
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            func: findCartsByUserId.name,
            error,
        });
    }
};

const createCart = async (req, resp) => {

    try {
        /**
         * 1. ambil nilai:
         *    - ['product_id' , 'qty' ] --> req.body
         *    - ['cashier_id'         ] --> req.userId
         */
        const product_id = parseInt(req.body.product_id);
        const qty = parseInt(req.body.qty);
        const cashier_id = parseInt(req.userId);


        /**
         * 2. cek apakah 'product_id' sudah terdaftar pada tabel 'products'
         */
        const product = await prisma.product.findFirstOrThrow({
            where: {
                id: product_id,
            },
        });


        /**
         * 3. cek apakah 'cart' sudah ada. Jika belum, maka dibuat baru. Jika sudah ada, maka hanya nilai 'qty' dan 'price' yang di modifikasi.
         * pengecekan apakah 'cart' sudah ada atau belum berdasarkan nilai 'product_id' dan 'cashier_id'
         */
        const existingCart = await prisma.cart.findFirst({
            where: {
                product_id: product_id,
                cashier_id: cashier_id,
            },
        });

        // hanya update nilai 'qty' dan 'price'
        if (existingCart) {

            const updatedCart = await prisma.cart.update({
                where: {
                    id: existingCart.id,
                },
                data: {
                    qty: existingCart.qty + qty,
                    price: product.sell_price * (existingCart.qty + qty),
                },
                include: {
                    product: true,
                    cashier: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            /**
             * 4.1. kirim respon ke user jika 'cart' sudah ada
             */
            resp.status(201).json({
                meta: {
                    success: true,
                    message: 'berhasil memperbarui cart.',
                },
                data: {
                    cart: updatedCart,
                },
            });
        }
        // buat cart baru
        else {
            const cart = await prisma.cart.create({
                data: {
                    cashier_id: cashier_id,
                    product_id: product_id,
                    qty: qty,
                    price: product.sell_price * qty,
                },
                include: {
                    product: true,
                    cashier: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            /**
             * 4.2. kirim respon ke user jika 'cart' belum ada
             */
            resp.status(201).json({
                meta: {
                    success: true,
                    message: 'berhasil menambah cart.',
                },
                data: {
                    cart,
                },
            });
        }

    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal menambah cart.',
                },
                file: __filename.split('/').pop(),
                func: createCart.name,
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            func: createCart.name,
            error,
        });
    }
};

const deleteCartById = async (req, resp) => {

    try {
        /**
         * ambil nilai 'id' dari URL
         * contoh: http://localhost:3000/api/carts/2
         * id = 2
         */
        const id = parseInt(req.params.id);


        /**
         * ambil nilai 'cashier_id' dari req.
         * cashier_id = req.userId
         */
        const cashier_id = parseInt(req.userId);


        /**
         * hapus cart 
         */
        const { id: deletedId } = await prisma.cart.delete({
            where: {
                id: id,
                cashier_id: cashier_id,
            },
            select: {
                id: true,
            }
        });


        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'cart berhasil dihapus.',
            },
            data: {
                deletedId,
            },
        });

    } catch (error) {

        if (error.code) {

            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'cart gagal dihapus.',
                },
                file: __filename.split('/').pop(),
                func: deleteCartById.name,
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            func: deleteCartById.name,
            error,
        });
    }
};


module.exports = {
    findCartsByUserId,
    createCart,
    deleteCartById,
}