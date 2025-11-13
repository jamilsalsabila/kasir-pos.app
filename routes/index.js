const express = require('express');
const router = express.Router();

// CONTROLLER
const login = require('../controllers/LoginController');
const userController = require("../controllers/UserController");
const categoryController = require('../controllers/CategoryController');
const productController = require('../controllers/ProductController');
const customerController = require('../controllers/CustomerController');
const cartController = require('../controllers/CartController');
const transactionController = require('../controllers/TransactionController');

// MIDDLEWARES
const {
    verifyToken,
    handleValidationErrors,
    upload,
    handleUploadError,
} = require("../middlewares");

// VALIDATORS
const { validateLogin,
    validateUser,
    validateCategory,
    validateProduct,
    validateCustomer,
    validateCart,
    validateTransaction,
} = require("../utils/validators");


// ======== Rute =========
/*
Catatan PENTING! 
----------------
untuk urutan middlewares

jika terdapat file yang perlu diupload, misal: gambar, atau file text,
utamakan upload ( multer ) dulu, baru validasi ( express-validation ),
karna nilai req.body nya belum terisi alias bernilai null
jika langsung validasi.

Jika gagal di validasi setelah upload, 
bisa dihapus file hasil upload tersebut
di file handleValidationError.js 
atau bisa juga tidak dihapus,
tapi perlu penyesuaian dengan cara kerja frontend-nya.
----------------
*/
const routes = [
    // RUTE LOGIN
    { method: 'post', path: '/login', middlewares: [validateLogin, handleValidationErrors], controller: login },


    // RUTE GET ALL USERS
    { method: 'get', path: '/users', middlewares: [verifyToken], controller: userController.findUsers },
    // RUTE CREATE USER
    { method: 'post', path: '/users', middlewares: [verifyToken, validateUser, handleValidationErrors], controller: userController.createUser },
    // RUTE FIND USER BY ID
    { method: 'get', path: '/users/:id', middlewares: [verifyToken], controller: userController.findUserById },
    // RUTE UPDATE USER
    { method: 'put', path: '/users/:id', middlewares: [verifyToken, validateUser, handleValidationErrors], controller: userController.updateUser },
    { method: 'delete', path: '/users/:id', middlewares: [verifyToken], controller: userController.deleteUser },


    // RUTE GET CATEGORY BY KEYWORD
    { method: 'get', path: '/categories', middlewares: [verifyToken], controller: categoryController.findCategories },
    // RUTE INSERT CATEGORY
    { method: 'post', path: '/categories', middlewares: [verifyToken, upload.single('image'), validateCategory, handleValidationErrors], controller: categoryController.createCategory },
    // RUTE ALL CATEGORIES
    { method: 'get', path: '/categories/all', middlewares: [verifyToken], controller: categoryController.allCategories },
    // RUTE FIND CATEGORY BY ID
    { method: 'get', path: '/categories/:id', middlewares: [verifyToken], controller: categoryController.findCategoryById },
    // RUTE UPDATE CATEGORY BY ID
    { method: 'put', path: '/categories/:id', middlewares: [verifyToken, upload.single('image'), handleUploadError, validateCategory, handleValidationErrors], controller: categoryController.updateCategoryById },
    // // RUTE DELETE CATEGORY BY ID
    { method: 'delete', path: '/categories/:id', middlewares: [verifyToken], controller: categoryController.deleteCategoryById },


    // RUTE FIND PRODUCTS
    { method: 'get', path: '/products', middlewares: [verifyToken], controller: productController.findProducts },
    // RUTE CREATE PRODUCTS
    { method: 'post', path: '/products', middlewares: [verifyToken, upload.single('image'), handleUploadError, validateProduct, handleValidationErrors,], controller: productController.createProduct },
    // RUTE FIND PRODUCT BY ID
    { method: 'get', path: '/products/:id', middlewares: [verifyToken], controller: productController.findProductById },
    // RUTE UPDATE PRODUCT BY ID
    { method: 'put', path: '/products/:id', middlewares: [verifyToken, upload.single('image'), validateProduct, handleValidationErrors], controller: productController.updateProductById },
    // RUTE DELETE PRODUCT BY ID
    { method: 'delete', path: '/products/:id', middlewares: [verifyToken], controller: productController.deleteProductById },
    // RUTE FIND PRODUCT BY CATEGORY ID
    { method: 'get', path: '/products-by-category/:id', middlewares: [verifyToken], controller: productController.findProductByCategoryId },
    // RUTE FIND PRODUCT BY BARCODE
    {
        method: 'post',
        path: '/product-by-barcode',
        middlewares: [verifyToken],
        controller: productController.findProductByBarcode
    },


    // RUTE FIND CUSTOMERS
    {
        method: 'get',
        path: '/customers',
        middlewares: [verifyToken],
        controller: customerController.findCustomers,
    },
    // RUTE CREATE CUSTOMER
    {
        method: 'post',
        path: '/customers',
        middlewares: [
            verifyToken,
            validateCustomer,
            handleValidationErrors,
        ],
        controller: customerController.createCustomer,
    },
    // RUTE ALL CUSTOMERS
    {
        method: 'get',
        path: '/customers/all',
        middlewares: [
            verifyToken,
        ],
        controller: customerController.findAllCustomers,
    },
    // RUTE FIND CUSTOMER BY ID
    {
        method: 'get',
        path: '/customers/:id',
        middlewares: [
            verifyToken,
        ],
        controller: customerController.findCustomerById,
    },
    // RUTE UPDATE CUSTOMER BY ID
    {
        method: 'put',
        path: '/customers/:id',
        middlewares: [
            verifyToken,
            validateCustomer,
            handleValidationErrors,
        ],
        controller: customerController.updateCustomerById,
    },
    // RUTE DELETE CUSTOMER BY ID
    {
        method: 'delete',
        path: '/customers/:id',
        middlewares: [
            verifyToken,
        ],
        controller: customerController.deleteCustomerById,
    },


    /**
     * Cart Controller
     */
    // RUTE GET CART BASED ON USER ID
    { method: 'get', path: '/carts', middlewares: [verifyToken], controller: cartController.findCartsByUserId },
    // RUTE CREATE CART 
    { method: 'post', path: '/carts', middlewares: [verifyToken, validateCart, handleValidationErrors], controller: cartController.createCart },
    // RUTE DELETE CART 
    {
        method: 'delete',
        path: '/carts/:id',
        middlewares: [
            verifyToken,
        ],
        controller: cartController.deleteCartById,
    },


    /**
     * Transaction Controller
     */
    // RUTE CREATE TRANSACTION
    { method: 'post', path: '/transactions', middlewares: [verifyToken, validateTransaction, handleValidationErrors], controller: transactionController.createTransaction },
    // RUTE CREATE TRANSACTION
    {
        method: 'get',
        path: '/transactions',
        middlewares: [
            verifyToken,
        ],
        controller: transactionController.findTransactionByInvoice,
    },
];
// =======================


// 
const createRouter = (routes) => {
    routes.forEach(({ method, path, middlewares, controller }) => {
        router[method](path, ...middlewares, controller);
    });
};


createRouter(routes);

module.exports = router;