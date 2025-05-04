const express = require('express');
const {  loginUser } = require('../controllers/auth.controller');

const router = express.Router();

//router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;