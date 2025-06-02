const express = require('express');
const prisma = require('../base/db');
const { getComptHabilitados, getComptAprobados, getPagoStats, actualizarPago } = require('../controllers/cajero.controller');


const router = express.Router();

router.get('/competidores/aprobados', getComptAprobados);
router.get('/competidores/habilitados', getComptHabilitados);
router.get('/stats', getPagoStats);
router.patch('/pagos/:codIns', actualizarPago);

module.exports = router;