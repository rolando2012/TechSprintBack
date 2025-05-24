const express = require('express');
const prisma = require('../base/db');
const {regCompetencia, getCompetencias, getGrados, getNiveles, checkNombreUnico} = require('../controllers/admin.controller');

const router = express.Router();

router.post('/competencia', regCompetencia);
router.get('/competencias',getCompetencias);
router.get('/grados', getGrados);
router.get('/niveles', getNiveles);
router.post('/validar-nombre', checkNombreUnico)

module.exports = router;