const express = require('express');
const prisma = require('../base/db');
const { getDepartamentos, getMunicipios } = require('../controllers/registro.controller');

const router = express.Router();

router.get('/departamentos', getDepartamentos);

router.get('/departamentos/:id/municipios', getMunicipios);

//router.get('/');

module.exports = router;