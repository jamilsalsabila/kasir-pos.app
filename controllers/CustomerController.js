const prisma = require('../prisma/client');


const findCustomers = async (req, resp) => {

    try {
        /**
         * ambil nilai search, limit, dan page dari URL
         * contoh: http://localhost:3000/api/customers/?search=de&page=1&limit=5
         * 
         * search = de, default ''
         * page = 1, default 1
         * limit = 5, default 5
         */
        const search = req.query.search || '';
        const limit = parseInt(req.query.limit) || 5;
        const page = parseInt(req.query.page) || 1;


        /**
         * tambahkan variabel 'skip' buat halaman paginasi
         * rumus: (halaman - 1) x jumlah item per halaman
         */
        const skip = (page - 1) * limit


        /**
         * cari record di db dimana field 'name' mengandung nilai 'search'
         */
        const customers = await prisma.customer.findMany({
            where: {
                name: {
                    contains: search,
                },
            },
            orderBy: {
                id: "desc",
            },
            take: limit,
            skip: skip,
        });


        /**
         * hitung total record 
         */
        const totalCustomers = await prisma.customer.count({
            where: {
                name: {
                    contains: search,
                },
            },
        });



        /**
         * hitung jumlah page yang dibutuhkan buat paginasi
         */
        const totalPages = Math.ceil(totalCustomers / limit);



        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan record',
            },
            data: {
                customers,
            },
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                itemPerPage: limit,
                totalCustomers: totalCustomers,
            },
        });

    } catch (error) {

        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal mendapatkan record',
                },
                file: __filename.split('/').pop(),
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

const createCustomer = async (req, resp) => {

    try {
        /**
         * 
         * ambil nilai dari request body:
         * 1. name
         * 2. no_telp
         * 3. address 
         * 
         */
        const { name, no_telp, address } = req.body;


        /**
         * 
         * masukkan ke db, return id 
         * 
         */
        const { id } = await prisma.customer.create({
            data: {
                name, no_telp, address,
            },
            select: {
                id: true,
            }
        });


        /**
         * kirim respon ke pengguna
         */
        resp.status(201).json({
            meta: {
                success: true,
                message: 'berhasil menambahkan customer.',
            },
            data: {
                id,
            }
        });

    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal menambahkan customer.'
                },
                file: __filename.split('/').pop(),
                error,
            });
        }


        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.'
            },
            file: __filename.split('/').pop(),
            error,
        });
    }


};

const findCustomerById = async (req, resp) => {

    try {
        /**
         * ambil nilai parameter 'id' dari URL
         * contoh: http://localhost:3000/api/customers/:id
         * id = 3
         */
        const id = parseInt(req.params.id);


        /**
         * cari record berdasarkan 'id'
         * ada kemungkinan 'id' tidak ditemukan
         */
        const customer = await prisma.customer.findFirstOrThrow({
            where: {
                id: id,
            },
        });


        /**
         * kirim respon ke pengguna 
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan customer.',
            },
            data: {
                customer,
            },
        });


    } catch (error) {

        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal mendapatkan customer',
                },
                file: __filename.split('/').pop(),
                function: 'findCustomerById',
                error,
            })
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            function: 'findCustomerById',
            error,
        });

    };

};

const updateCustomerById = async (req, resp) => {

    try {
        /**
         * ambil nilai 'id' dari URL
         * contoh: http://localhost:3000/api/customers/:id
         * id = 2;
         * type data = int 
         */
        const id = parseInt(req.params.id);


        /**
         * ambil nilai dari field berikut dari req.body:
         * 1. name
         * 2. no_telp
         * 3. address
         * kumpulkan dalam variabel 'data' bertipe data object
         */
        const data = {
            name: req.body.name,
            no_telp: req.body.no_telp,
            address: req.body.address,
        };


        /**
         * masukkan ke dalam db.
         */
        const result = await prisma.customer.update({
            where: {
                id: id,
            },
            data: data,
        });


        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil memperbarui customer.',
            },
            data: result,
        });

    } catch (error) {

        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal memperbarui customer.'
                },
                file: __filename.split('/').pop(),
                func: 'updateCustomerById',
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.'
            },
            file: __filename.split('/').pop(),
            func: 'updateCustomerById',
            error,
        });
    };
};

const deleteCustomerById = async (req, resp) => {

    try {
        /**
         * ambil nilai 'id' dari URL
         * contoh: http://localhost:3000/api/customers/:id
         * id = 2
         * tipe data = string -> int
         */
        const id = parseInt(req.params.id);


        /**
         * hapus customer
         */
        const { id: deletedId } = await prisma.customer.delete({
            where: {
                id: id,
            },
            select: {
                id: true,
            },
        });


        /**
         * kirim respons ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'customer berhasil dihapus.',
            },
            data: {
                deletedId,
            },
        });

    } catch (error) {

        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: 'false',
                    message: 'gagal menghapus customer.',
                },
                file: __filename.split('/').pop(),
                func: 'deleteCustomerById',
                error,
            })
        }

        resp.status(500).json({
            meta: {
                success: 'false',
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            func: deleteCustomerById.name,
            error,
        });
    }
};

const findAllCustomers = async (req, resp) => {

    try {
        /**
         * ambil semua customers
         */
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                id: "desc",
            }
        });


        /**
         * ubah format untuk kebutuhan frontend
         */
        const formatted = customers.map(customer => ({
            value: customer.id,
            label: customer.name,
        }));


        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan semua customer.',
            },
            data: {
                customers: formatted,
            },
        });

    } catch (error) {

        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal mendapatkan semua customer.',
                },
                file: __filename.split('/').pop(),
                func: findAllCustomers.name,
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: 'terjadi kesalahan pada server.',
            },
            file: __filename.split('/').pop(),
            func: findAllCustomers.name,
            error,
        });
    }
};

module.exports = {
    findCustomers,
    createCustomer,
    findCustomerById,
    updateCustomerById,
    deleteCustomerById,
    findAllCustomers,
}