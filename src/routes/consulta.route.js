const express = require('express');
const { getAreaByCompetidor, getCompByPersonaAndArea, getEtapaPago, getEtapaValidacion } = require('../controllers/consulta.controller');

const router = express.Router();

router.get('/area/:id', getAreaByCompetidor);
router.post('/detalles/:id', getCompByPersonaAndArea);
router.get("/competencia/pago-etapa-general", getEtapaPago);
router.get("/competencia/validacion-etapa-general", getEtapaValidacion);

module.exports = router;