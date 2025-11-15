/**
 * menghitung profit dan export profit dalam bentung file excel  
 */

const prisma = require("../prisma/client");
const excelJS = require('exceljs');
const moneyFormat = require('../utils/moneyFormat');


const filterProfits = async (req, resp) => {

    try {

        /**
         * dapatkan rentang tanggal dan ubah ke dalam tipe date 'Date'
         */
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(req.query.end_date);
        endDate.setHours(23, 59, 59, 999);


        /**
         * cari record berdasarkan rentang tanggal
         */
        const profitByDate = await prisma.profit.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                Transaction: {
                    select: {
                        id: true,
                        invoice: true,
                        grand_total: true,
                        created_at: true,
                    },
                },
            },
        });


        /**
         * hitung total profit secara keseluruhan berdasarkan rentang tanggal
         */
        const totalProfitByDate = await prisma.profit.aggregate({
            where: {
                created_at: {
                    lte: endDate,
                    gte: startDate,
                },
            },
            _sum: {
                total: true,
            },
        });


        /**
         * kirim respon ke pengguna
         */
        resp.status(200).json({
            meta: {
                success: true,
                message: 'berhasil mendapatkan record profit',
            },
            data: {
                totalProfit: totalProfitByDate._sum.total || 0, // jika tidak ada record, maka nilainnya 'null' atau diganti sama angka '0'
                profit: profitByDate,
            },
        });


    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: 'gagal mendapatkan record profit.',
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

const exportProfits = async (req, resp) => {

    try {
        /**
         * AMBIL NILAI 'start_date' dan 'end_date' dari URL query
         */
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(req.query.end_date);
        endDate.setHours(23, 59, 59, 999);


        /**
         * RECORD PROFIT & TRANSAKSI
         */
        const profitByDate = await prisma.profit.findMany({
            where: {
                created_at: {
                    lte: endDate,
                    gte: startDate,
                },
            },
            include: {
                Transaction: {
                    select: {
                        id: true,
                        invoice: true,
                    },
                },
            },
        });


        /**
         * TOTAL PROFIT
         */
        const totalProfitByDate = await prisma.profit.aggregate({
            where: {
                created_at: {
                    lte: endDate,
                    gte: startDate,
                },
            },
            _sum: {
                total: true,
            }
        });


        /**
         * GENERATE EXCEL FILE
         */
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('profits');

        /**
         * add column definition
         */
        worksheet.columns = [
            { header: 'DATE', key: 'created_at', width: 10, },
            { header: 'INVOICE', key: 'invoice', width: 30, },
            { header: 'TOTAL', key: 'total', width: 20, },
        ];

        /**
         * STYLING COLUMNS
         */
        worksheet.columns.forEach((col) => {
            col.style = {
                font: { bold: true, },
                alignment: { horizontal: "center" },
                border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                },
            };
        });

        /**
         * JADIKAN RECORD SEBAGAI ROW
         */
        profitByDate.forEach((profit) => {
            worksheet.addRow({
                created_at: profit.created_at,
                invoice: profit.Transaction.invoice,
                total: moneyFormat(profit.total),
            });
        });

        /**
         * ROW KHUSUS TOTAL
         */
        const totalRow = worksheet.addRow({
            created_at: '',
            invoice: 'TOTAL',
            total: moneyFormat(totalProfitByDate._sum.total),
        });

        /**
         * STYLING TOTAL ROW
         */
        totalRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, };
            cell.alignment = { horizontal: "right" };
            if (colNumber == 5) {
                cell.alignment = { horizontal: "center" };
            }
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            };
        });


        /**
         * kirim respon ke pengguna sebagai file excel
         */
        resp.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        workbook.xlsx.write(resp);


    } catch (error) {
        if (error.code) {
            return resp.status(400).json({
                meta: {
                    success: false,
                    message: error.message || 'gagal export profit.'
                },
                error,
            });
        }

        resp.status(500).json({
            meta: {
                success: false,
                message: error.message || 'terjadi kesalahan pada server.'
            },
            error,
        });
    }

};

module.exports = {
    filterProfits,
    exportProfits,
};