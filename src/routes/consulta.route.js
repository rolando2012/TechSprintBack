const express = require('express');
const { getAreaByCompetidor, getCompByPersonaAndArea, getEtapaPago, getEtapaValidacion, getEtapaInscripciones, getCompetenciaById, updateCompetencia } = require('../controllers/consulta.controller');

const router = express.Router();

router.get('/area/:id', getAreaByCompetidor);
router.post('/detalles/:id', getCompByPersonaAndArea);
router.get("/competencia/pago-etapa-general", getEtapaPago);
router.get("/competencia/validacion-etapa-general", getEtapaValidacion);
router.get("/competencia/inscripcion-etapa-general", getEtapaInscripciones);

// Obtener competencia específica
router.get('/competencias/:codComp', getCompetenciaById);

// Actualizar competencia
router.put('/competencias/:codComp', updateCompetencia);

module.exports = router;