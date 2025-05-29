const express = require('express');
const prisma = require('../base/db');
const { getCompetidores, getComptByTutor, getEstadoCompetidores, actualizarEstado } = require('../controllers/competidor.controller');

const router = express.Router();

router.get('/', getCompetidores);
router.get('/Tutor/:id', getComptByTutor);
router.get('/tutor/:id/estados', getEstadoCompetidores);
router.patch('/:id/estado', actualizarEstado);

module.exports = router;