const express = require('express');
const prisma = require('../base/db');
const { getDepartamentos, getMunicipios } = require('../controllers/competencia.controller');

const router = express.Router();

router.get('/departamentos', getDepartamentos);

router.get('/municipios/:id', getMunicipios);

module.exports = router;