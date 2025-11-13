const { validationResult } = require("express-validator");
const fs = require('fs').promises;

const handleValidationErrors = async (req, resp, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        /*
        jika terjadi error di validasi, jangan lupa hapus file yang telah terupload.
        atau sesuaikan dengan cara frontend nge-handle-nya
        untuk semnetara kita hapus dulu.
        */
        if (req.file)
            await fs.unlink(req.file.path);

        // ==================

        return resp.status(422).json({
            meta: {
                success: false,
                message: "validasi gagal."
            },
            errors: errors.array(),
        });
    }

    next();
};

module.exports = handleValidationErrors