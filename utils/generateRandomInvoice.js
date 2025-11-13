
const generateRandomInvoice = (PREFIX = 'INV') => {
    // 1. timestamp
    const timestamp = Date.now();

    // 2. random number between 1000 - 9999
    const randomNumber = Math.ceil(Math.random() * 10000);

    // 3. buat string
    const invoice = `${PREFIX}-${timestamp}-${randomNumber}`;

    // 4. kembalikan ke pengguna
    return invoice;
};

module.exports = generateRandomInvoice;