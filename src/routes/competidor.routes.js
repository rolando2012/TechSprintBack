const express = require('express');
const prisma = require('../base/db');
const { getCompetidores } = require('../controllers/competidor.controller');

const router = express.Router();

router.get('/', getCompetidores);

module.exports = router;