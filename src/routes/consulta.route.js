const express = require('express');
const { getAreaByCompetidor, getCompByPersonaAndArea, getEtapaPago, getEtapaValidacion, getEtapaInscripciones } = require('../controllers/consulta.controller');

const router = express.Router();

router.get('/area/:id', getAreaByCompetidor);
router.post('/detalles/:id', getCompByPersonaAndArea);
router.get("/competencia/pago-etapa-general", getEtapaPago);
router.get("/competencia/validacion-etapa-general", getEtapaValidacion);
router.get("/competencia/inscripcion-etapa-general", getEtapaInscripciones);

module.exports = router;