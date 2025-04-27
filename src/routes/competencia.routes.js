const express = require('express');
const prisma = require('../base/db');
const { getDepartamentos, getMunicipios } = require('../controllers/competencia.controller');

const router = express.Router();

router.get('/departamentos', getDepartamentos);

router.get('/departamentos/:id/municipios', getMunicipios);

module.exports = router;