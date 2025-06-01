const express = require('express');
const prisma = require('../base/db');
const { getComptHabilitados } = require('../controllers/cajero.controller');


const router = express.Router();

router.get('/competidores/aprobados', getComptHabilitados);

module.exports = router;