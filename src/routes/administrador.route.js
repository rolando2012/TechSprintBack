const express = require('express');
const prisma = require('../base/db');
const {regCompetencia, getCompetencias} = require('../controllers/admin.controller');

const router = express.Router();

router.post('/competencia', regCompetencia);
router.get('/competencias',getCompetencias);

module.exports = router;