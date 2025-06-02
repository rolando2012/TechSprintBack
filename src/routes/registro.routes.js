const express = require('express');
const prisma = require('../base/db');
const { getDepartamentos, getMunicipios, getAreas, getGradosNivel, getTutores, regCompetidor, getCosto,getMunicipiosByName, checkEmail } = require('../controllers/registro.controller');

const router = express.Router();

router.get('/departamentos', getDepartamentos);

router.get('/departamentos/:id/municipios', getMunicipios);

router.get('/municipios/:nombre', getMunicipiosByName);

router.get('/areas',getAreas)

router.get('/areas/grados/nivel/:gestion/:area', getGradosNivel);

router.get('/tutores', getTutores);

router.post('/competidor', regCompetidor);

router.get('/costo/:gestion',getCosto);

router.get('/check-email', checkEmail)

module.exports = router;