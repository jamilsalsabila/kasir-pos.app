
const prisma = require('../prisma/client');
const { subDays, format } = require('date-fns');


const getDashboardData = async (req, resp) => {

    try {
        /**
         * DATA PENJUALAN DALAM SEMINGGU INI
         */
        // hari ini
        const today = new Date();

        // 7 hari kebelakang
        const weekAgo = subDays(today, 7);

        // 1. ambil semua record 'transaction' 7 hari kebelakang
        // 2. kelompokkan berdasarkan tanggal pembuatan
        // 3. jumlahkan total pendapatan tiap kelompok
        /*
        const sevenDaysOldSales = await prisma.transaction.groupBy({
            where: {
                created_at: {
                    gte: weekAgo,
                },
            },
            by: ['created_at'],
            _sum: {
                grand_total: true,
            },
        });
        */

        const sevenDaysOldSales2 = await prisma.$queryRaw`SELECT EXTRACT(YEAR FROM \`created_at\`) AS YEAR, EXTRACT(MONTH FROM \`created_at\`) AS MONTH, EXTRACT(DAY FROM \`created_at\`) AS DAY, SUM(\`grand_total\`) AS TOTAL FROM \`transactions\` GROUP BY YEAR, MONTH, DAY ; `;

        // pisahkan data 'tanggal' dan 'penjualan'
        // hitung pendapatan keseluruhan
        // 
        // 1. buat array penampung 'sevenDaysOldSalesDate' & 'sevenDaysOldSalesTotal'
        // 2. buat variabel penampung 'sevenDaysOldSalesSum'
        const sevenDaysOldSalesDate = [];
        const sevenDaysOldSalesTotal = [];
        let sevenDaysOldSalesSum = 0;

        if (sevenDaysOldSales2.length > 0) {
            sevenDaysOldSales2.forEach((val, idx) => {

                //console.log(format(val.created_at, 'yyyy-MM-dd'));
                //console.log(val.created_at.toISOString());

                // date
                sevenDaysOldSalesDate.push(`${val.YEAR}-${val.MONTH}-${val.DAY}`);
                // total
                const total = parseFloat(val.TOTAL || 0);
                sevenDaysOldSalesTotal.push(total);
                // sum
                sevenDaysOldSalesSum += total;
            });

        } else {
            sevenDaysOldSalesDate.push('');
            sevenDaysOldSalesSum.push(0);
        }


        /**
         * DATA PROFIT DALAM SEMINGGU INI
         */

        // 1. ambil semua record 'profit' 7 hari kebelakang
        // 2. kelompokkan berdasarkan tanggal pembuatan
        // 3. jumlahkan total profit tiap kelompok
        /*
        const profitAWeekAgo = await prisma.profit.groupBy({
            where: {
                created_at: {
                    gte: weekAgo,
                },
            },
            by: ['created_at'],
            _sum: {
                total: true,
            },
        });
        */

        const profitAWeekAgo2 = await prisma.$queryRaw`SELECT EXTRACT(YEAR FROM \`created_at\`) AS YEAR, EXTRACT(MONTH FROM \`created_at\`) AS MONTH, EXTRACT(DAY FROM \`created_at\`) AS DAY, SUM(\`total\`) AS TOTAL FROM \`profits\` GROUP BY YEAR, MONTH, DAY ; `;
        //console.log(profitAWeekAgo2);


        // pisahkan data 'tanggal' dan 'profit'
        // hitung profit secara keseluruhan
        // 
        // 1. buat array penampung 'profitAWeekAgo_DATE' & 'profitAWeekAgo_TOTAL'
        // 2. buat variabel penampung 'profitAWeekAgo_SUM'
        const profitAWeekAgo_DATE = [];
        const profitAWeekAgo_TOTAL = [];
        let profitAWeekAgo_SUM = 0;


        // cek apakah ada 'profit' dalam seminggu ini?
        if (profitAWeekAgo2.length > 0) {

            profitAWeekAgo2.forEach((val, idx) => {
                profitAWeekAgo_DATE.push(`${val.YEAR}-${val.MONTH}-${val.DAY}`);
                const total = parseFloat(val.TOTAL || 0);
                profitAWeekAgo_TOTAL.push(total);
                profitAWeekAgo_SUM += total;
            });

        } else {

            profitAWeekAgo_DATE.push('');
            profitAWeekAgo_TOTAL.push(0);
        }


        /**
         * JUMLAH TRANSAKSI HARI INI
         * 'transaction'
         */
        const start_time = today.toISOString().split('T')[0] + 'T00:00:00.000Z';
        const end_time = today.toISOString().split('T')[0] + 'T23:59:59.999Z';

        //console.log(start_time, end_time);

        const countTodayTransactions = await prisma.transaction.count({
            where: {
                created_at: {
                    gte: start_time,
                    lte: end_time,
                },
            },
        });


        /**
         * TOTAL PENDAPATAN HARI INI 
         * 'transaction' -> 'grand_total'
         */
        const sumTodayTransaction = await prisma.transaction.aggregate({
            where: {
                created_at: {
                    lte: end_time,
                    gte: start_time,
                },
            },
            _sum: {
                grand_total: true,
            },
        });


        /**
         * TOTAL KEUNTUNGAN HARI INI
         * profit -> total
         */
        const sumTodayProfit = await prisma.profit.aggregate({
            where: {
                created_at: {
                    lte: end_time,
                    gte: start_time,
                },
            },
            _sum: {
                total: true,
            },
        });


        /**
         * MENGAMBIL PRODUK YANG STOCKYA KURANG DARI 10
         * 'products' -> stock
         * limit = 10
         */
        const limit = 10;
        const getLesserProduct = await prisma.product.findMany({
            where: {
                stock: {
                    lte: limit,
                },
            },
            include: {
                category: true,
            },
        });


        /**
         * 5 PRODUK TERLARIS
         * 'transactionDetail'
         */
        const top5Products = await prisma.transactionDetail.groupBy({
            by: ['product_id'],
            _sum: {
                qty: true,
            },
            orderBy: {
                _sum: {
                    qty: "desc",
                },
            },
            take: 5,
        });


        /**
         * DETAIL 'PRODUCTS'
         * 'product'
         */
        const productIds = top5Products.map(item => item.product_id);
        const detailProducts = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
            select: {
                id: true,
                title: true,
            },
        });


        /**
         * TOP 5 PRODUCTS + DETAIL PRODUCT
         */
        const detailTop5Products = top5Products.map(item => {
            const product = detailProducts.find(p => p.id === item.product_id);
            return {
                title: product?.title || 'Unknown Product',
                total: item._sum.qty || 0,
            };
        });


        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan data untuk halaman dashboard.'
            },
            data: {
                salesThisWeek: {
                    total: sevenDaysOldSalesSum,
                    salesDate: sevenDaysOldSalesDate,
                    salesTotal: sevenDaysOldSalesTotal,
                },
                profitThisWeek: {
                    total: profitAWeekAgo_SUM,
                    profitDate: profitAWeekAgo_DATE,
                    profitTotal: profitAWeekAgo_TOTAL,

                },
                numberOfTransactionToday: countTodayTransactions,
                totalGainedOfTransactionToday: sumTodayTransaction._sum.grand_total || 0,
                totalGainedOfProfitToday: sumTodayProfit._sum.total || 0,
                lesserProduct: getLesserProduct,
                top5Products: detailTop5Products,
            },
        });



    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: error.message || 'gagal mendapatkan data untuk halaman dashboard.',
                },
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: error.message || 'terjadi kesalahan pada server.',
            },
            error,
        });
    }
};

module.exports = getDashboardData;