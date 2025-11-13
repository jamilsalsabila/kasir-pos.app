const multer = require("multer");

const handleUploadError = (err, req, resp, next) => {

    if (err instanceof multer.MulterError) {

        return resp.status(400).json({
            meta: {
                success: false,
                message: err.field,
            },
            code: err.code,
            filename: __filename.split('/').pop(),
        });
    } else if (err) {

        return resp.status(500).json({
            meta: {
                success: false,
                message: `terjadi kesalahan pada server`,
            },
            filename: __filename.split('/').pop(),
        });
    }

    next();
}

module.exports = handleUploadError;