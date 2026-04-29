const express = require('express');
const { exportConfig, importConfig } = require('../controllers/configController');

const router = express.Router();

router.get('/config/export', exportConfig);
router.post('/config/import', importConfig);

module.exports = router;
