const express = require('express');
const prisma = require('../base/db');
const {regCompetencia} = require('../controllers/admin.controller');

const router = express.Router();

router.post('/competencia', regCompetencia);

module.exports = router;