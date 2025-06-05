const express = require('express');
const { getAreaByCompetidor, getCompByPersonaAndArea } = require('../controllers/consulta.controller');

const router = express.Router();

router.get('/area/:id', getAreaByCompetidor);
router.post('/detalles/:id', getCompByPersonaAndArea)

module.exports = router;