const express = require('express');
const { getAreaByCompetidor } = require('../controllers/consulta.controller');

const router = express.Router();

router.get('/area/:id', getAreaByCompetidor);

module.exports = router;