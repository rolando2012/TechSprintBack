const express = require('express');
const prisma = require('../base/db');
const { getDepartamentos, getMunicipios, getAreas, getGradosNivel, getTutores, } = require('../controllers/registro.controller');

const router = express.Router();

router.get('/departamentos', getDepartamentos);

router.get('/departamentos/:id/municipios', getMunicipios);

router.get('/areas',getAreas)

router.get('/areas/grados/nivel/:gestion/:area', getGradosNivel);

router.get('/tutores', getTutores)

module.exports = router;