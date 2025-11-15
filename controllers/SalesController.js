const prisma = require("../prisma/client");
const excelJS = require('exceljs');
const moneyFormat = require("../utils/moneyFormat");


const filterSales = async (req, resp) => {

    try {
        /**
         * ambil nilai 'startDate' dan 'endDate' dari URL query
         * contoh: http://localhost:3000/api/sales?start_date=2025-11-10&end_date=2025-12-10
         */
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(req.query.end_date);
        endDate.setHours(23, 59, 59, 999);


        /**
         * ambil data transaksi dari 'startDate' - 'endDate'
         */
        const sales = await prisma.transaction.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                cashier: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });


        /**
         * Hitung total pendapatan penjualan dari 'startDate' = 'endDate'
         */
        const totalGained = await prisma.transaction.aggregate({
            _sum: {
                grand_total: true,
            },
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });


        /**
         * kirim respon ke pengguna.
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan data.',
            },
            sales: sales,
            total: totalGained || 0,
        });

    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: 'false',
                    message: error.message || 'gagal mendapatkan data.',
                },
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: 'false',
                message: error.message || 'terjadi kesalahan pada server.',
            },
            error,
        });
    }

};

const exportSales = async (req, resp) => {

    try {
        /**
         * ambil nilai 'start_date' dan 'end_date' dari URL query
         * contoh: http://localhost:3000/api/sales?start_date=2025-11-10&end_date=2025-12-10 
         */
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(req.query.end_date);
        endDate.setHours(23, 59, 59, 999);


        /**
         * cari data transaksi berdasarkan nilai 'startDate' dan 'endDate'
         */
        const salesByDate = await prisma.transaction.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                cashier: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });


        /**
         * total pendapatan penjualan dari 'startDate' - 'endDate'
         */
        const totalGained = await prisma.transaction.aggregate({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                grand_total: true,
            },
        });


        /**
         * 
         *  BAGIAN PEMBUATAN DAN PENGIRIMAN File EXCEL
         *  MENGGUNAKAN LIBRARY 'exceljs'
         * 
         */
        // buat 'workbook'
        const workbook = new excelJS.Workbook();

        // buat 'worksheet'
        const worksheet = workbook.addWorksheet('Sales');


        // nama kolom
        worksheet.columns = [
            { header: 'DATE', key: 'created_at', width: 25 },
            { header: 'INVOICE', key: 'invoice', width: 30 },
            { header: 'CASHIER', key: 'cashier', width: 15 },
            { header: 'CUSTOMER', key: 'customer', width: 15 },
            { header: 'TOTAL', key: 'grand_total', width: 15 },
        ];

        // permak kolom
        worksheet.columns.forEach((col) => {
            col.style = {
                font: {
                    bold: true,
                },
                alignment: {
                    horizontal: "center",
                },
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" },
                },
            };
        });


        // jadikan tiap record 'salesByDate' sebagai 'baris'
        salesByDate.forEach(sale => {
            worksheet.addRow({
                created_at: sale.created_at,
                invoice: sale.invoice,
                cashier: sale.cashier.name,
                customer: sale.customer?.name || 'Umum',
                grand_total: `${moneyFormat(sale.grand_total)}`,
            });
        });


        // tambahkan baris khusus 'TOTAL'
        const totalRow = worksheet.addRow({
            created_at: '',
            invoice: '',
            cashier: '',
            customer: 'TOTAL',
            grand_total: `${moneyFormat(totalGained._sum.grand_total)}`,
        });

        // permak baris khusus 'TOTAL'
        totalRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, };
            cell.alignment = { horizontal: 'right' };
            if (colNumber === 5) {
                cell.alignment = { horizontal: 'center' };
            }
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            };
        });


        // kirim respon dalam bentuk 'excel' ke pengguna
        resp.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(resp);


    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: error.message || 'gagal membua laporan berbentuk file excel.',
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
}


module.exports = {
    filterSales,
    exportSales,
};