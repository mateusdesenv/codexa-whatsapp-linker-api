const express = require('express');
const authRequired = require('../middlewares/auth');
const { login, refresh, logout, me } = require('../controllers/authController');

const router = express.Router();

router.post('/auth/login', login);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', logout);
router.get('/me', authRequired, me);

module.exports = router;
