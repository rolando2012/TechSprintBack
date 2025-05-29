const express = require('express');
const prisma = require('../base/db');
const { getCompetidores, getComptByTutor, getEstadoCompetidores } = require('../controllers/competidor.controller');

const router = express.Router();

router.get('/', getCompetidores);
router.get('/Tutor/:id', getComptByTutor);
router.get('/tutor/:id/estados', getEstadoCompetidores);

module.exports = router;