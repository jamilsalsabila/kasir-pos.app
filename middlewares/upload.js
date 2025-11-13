const multer = require("multer");
const path = require("path");
const crypto = require("crypto");


const allowedExt = [".jpeg", ".png", ".gif", ".jpg", ".webp"];


const fileStorage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        const fileName = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${fileName}${extension}`);
    },
});


const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExt.includes(ext)) {
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `ekstensi ${ext} tidak diperbolehkan`), false);
    }
    cb(null, true);
}


const upload = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});


module.exports = upload;