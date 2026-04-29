const express = require('express');
const { createWhatsAppLink } = require('../controllers/whatsappController');

const router = express.Router();

router.post('/whatsapp/link', createWhatsAppLink);

module.exports = router;
