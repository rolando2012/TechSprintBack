const express = require('express');
const prisma = require('../base/db');
const { getDepartamentos, getMunicipios, getAreas, getGradosNivel, getTutores, regCompetidor, getCosto, } = require('../controllers/registro.controller');

const router = express.Router();

router.get('/departamentos', getDepartamentos);

router.get('/departamentos/:id/municipios', getMunicipios);

router.get('/areas',getAreas)

router.get('/areas/grados/nivel/:gestion/:area', getGradosNivel);

router.get('/tutores', getTutores);

router.post('/competidor', regCompetidor);

router.get('/costo/:gestion',getCosto);

module.exports = router;