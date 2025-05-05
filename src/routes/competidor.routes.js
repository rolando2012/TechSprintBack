const express = require('express');
const prisma = require('../base/db');
const { getCompetidores, getComptByTutor } = require('../controllers/competidor.controller');

const router = express.Router();

router.get('/', getCompetidores);
router.get('/Tutor/:id', getComptByTutor);

module.exports = router;