const assert = require('assert');
const prisma = require('../prisma/client');
const generateRandomInvoice = require('../utils/generateRandomInvoice');


const createTransaction = async (req, resp) => {

    try {

        /**
         * buat invoice
         */
        const invoice = generateRandomInvoice();


        /**
         * ambil data berikut dari req.body:
         * 1. customer_id (optional: boleh null)
         * 2. change
         * 3. discount (optional: boleh null)
         * 4. cash
         * 5. grand_total
         * 
         * jangan lupa sesuaikan tipe datanya dengan di schema
         */
        const customerId = parseInt(req.body.customer_id) || null;
        const change = parseFloat(req.body.change);
        const discount = parseFloat(req.body.discount) || 0.0;
        const cash = parseFloat(req.body.cash);
        const grandTotal = parseFloat(req.body.grand_total);


        /**
         * ambil nilai 'cashier_id' dari req.userId
         */
        const cashierId = parseInt(req.userId);


        /**
         * pastikan terdapat data 'cart' milik 'cashier'
         */
        const cartsByCashierId = await prisma.cart.findMany({
            where: {
                cashier_id: cashierId,
            },
            include: {
                product: true,
            },
        });

        assert(cartsByCashierId.length !== 0, new Error('cart kosong.'));


        /**
         * pastikan semua memiliki tipe data INT.
         */
        assert(!isNaN(customerId), new Error('nilai \'customer_id\' tidak diperbolehkan.'));
        assert(!isNaN(change), new Error('nilai \'change\' tidak diperbolehkan.'));
        assert(!isNaN(discount), new Error('nilai \'discount\' tidak diperbolehkan.'));
        assert(!isNaN(cash), new Error('nilai \'cash\' tidak diperbolehkan.'));
        assert(!isNaN(grandTotal), new Error('nilai \'grand_total\' tidak diperbolehkan.'));
        assert(!isNaN(cashierId), new Error('nilai \'cashier_id\' tidak diperbolehkan.'));


        /**
         * masukkan data transaksi ke dalam db.
         */
        const data = {
            cashier_id: cashierId,
            customer_id: customerId,
            invoice: invoice,
            cash: cash,
            change: change,
            discount: discount,
            grand_total: grandTotal,
        };

        const transaction = await prisma.transaction.create({
            data: data,
        });


        /**
         * pindahkan data dari tabel 'cart' milik 'cashier' ke dalam tabel 'transaction_details'. 
         */

        /**
         * lakukan perulangan 
         */
        for (const cart of cartsByCashierId) {

            /**
             * pastikan tipe data 'cart.price' sama dengan 'float', sesuaikan dengan tipe data yang sudah didefinisikan di 'schema'.
             */
            const price = parseFloat(cart.price);

            /**
             * tambahkan data ke tabel 'transaction_details'
             */
            const data_td = {
                transaction_id: transaction.id,
                product_id: cart.product_id,
                qty: cart.qty,
                price: price,
            };

            await prisma.transactionDetail.create({
                data: data_td,
            });

            /**
             * hitung total 'profit'
             */
            const buy = cart.qty * cart.product.buy_price;
            const sell = cart.qty * cart.product.sell_price;
            const total = sell - buy;

            /**
             * tambahkan data ke tabel 'profits'
             */
            await prisma.profit.create({
                data: {
                    transaction_id: transaction.id,
                    total: total,
                },
            });

            /**
             * memperbarui 'stock' product
             */
            await prisma.product.update({
                where: {
                    id: cart.product_id,
                },
                data: {
                    stock: {
                        decrement: cart.qty,
                    },
                },
            });
        }


        /**
         * terakhir, menghapus semua 'cart' milik 'cashier'
         */
        await prisma.cart.deleteMany({
            where: {
                cashier_id: cashierId,
            },
        });


        /**
         * kirim respon ke pengguna
         */
        resp.status(201).json({
            meta: {
                success: true,
                message: 'berhasil memasukkan transaksi.',
            },
            data: {
                transaction,
            },
        });

    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal menambahkan transaksi.',
                },
                file: __filename.split('/').pop(),
                func: createTransaction.name,
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: error.message || 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            func: createTransaction.name,
            error,

        });
    }
}

const findTransactionByInvoice = async (req, resp) => {

    try {
        /**
         * ambil nilai 'invoice' dari URL query
         * contoh: http://localhost:3000/api/transaction?invoice=INV-131314141-1331
         */
        const { invoice } = req.query;


        /**
         * cari data transaksi di db berdasarkan nilai 'invoice'
         */
        const transaction = await prisma.transaction.findFirstOrThrow({
            where: {
                invoice: invoice,
            },
            include: {
                customer: {
                    select: {
                        name: true,
                    },
                },
                cashier: {
                    select: {
                        name: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
                transaction_details: {
                    select: {
                        id: true,
                        product_id: true,
                        qty: true,
                        price: true,
                        product: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
            },
        });


        /**
         * kirim respon ke pengguna.
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan transaksi.',
            },
            data: {
                transaction,
            },
        });


    } catch (error) {
        if (error.code) {
            resp.status(400).json({
                meta: {
                    success: false,
                    message: error.message || 'gagal mendapatkan transaksi.',
                },
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: error.message || 'kegagalan pada server.',
            },
            error,
        });
    }
}


module.exports = {
    createTransaction,
    findTransactionByInvoice,
}