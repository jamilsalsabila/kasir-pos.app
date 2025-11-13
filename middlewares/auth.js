const express = require('express');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) return res.status(401).json({ message: "Tidak terauthentikasi." });

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) return res.status(401).json({ message: "Token tidak valid" });

        req.userId = decoded.id;

        next();
    });

};

module.exports = verifyToken;