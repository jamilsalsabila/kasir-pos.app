// import prisma client
const prisma = require('../client');
const primsa = require('../client');

// import bcrypt
const bcrypt = require('bcryptjs');

async function main() {

    // hash passwrod
    const password = await bcrypt.hash('password', 10);

    // create user
    await primsa.user.create({
        data: {
            name: 'admin',
            email: 'admin@gmail.com',
            password,
        }
    });

}

main()
    .catch(e => console.log(e))
    .finally(async () => await prisma.$disconnect());