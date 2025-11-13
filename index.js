// import express
const express = require('express');
// import CORS
const cors = require('cors');
// import body-parser
const bodyParser = require('body-parser');
// import path
const path = require('path');
// import router
const router = require('./routes');


// ===== Config =====
// init app
const app = express();
// init port
const port = 3000;
// ==================


// ====== Plugins =======
// use cors
app.use(cors());
// use body parser
app.use(bodyParser.urlencoded({ extended: false }));
// jadikan format data di req.body menjadi json
app.use(bodyParser.json());
// ======================



// ======== RUTE =========
app.get('/', (req, res) => {
    res.send({ message: "hello world!" });
});

app.get('/uploads/:filename', (req, resp) => {
    resp.sendFile(path.join(__dirname, 'uploads', req.params.filename));
});
app.use('/api', router);
// =======================



// start server
app.listen(port, () => console.log(`Server started on port ${port}`));