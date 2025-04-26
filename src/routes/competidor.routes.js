const express = require('express');
const prisma = require('../base/db');

const router = express.Router();

router.get('/', (req, res) => {
   res.send('Competidor API');
});

module.exports = router;