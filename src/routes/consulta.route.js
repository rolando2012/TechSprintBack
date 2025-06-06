const express = require('express');
const { getAreaByCompetidor, getCompByPersonaAndArea, getInfo } = require('../controllers/consulta.controller');

const router = express.Router();

router.get('/area/:id', getAreaByCompetidor);
router.post('/detalles/:id', getCompByPersonaAndArea);
router.get("/competencia/etapa-info-general", getInfo);

module.exports = router;