const express = require('express');
const prisma = require('../base/db');
const { getDepartamentos, getMunicipios, getAreas, getGradosNivel } = require('../controllers/registro.controller');

const router = express.Router();

router.get('/departamentos', getDepartamentos);

router.get('/departamentos/:id/municipios', getMunicipios);

router.get('/areas',getAreas)

router.get('/areas/:id/grados/nivel', getGradosNivel);

module.exports = router;