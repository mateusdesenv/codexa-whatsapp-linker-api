const express = require('express');
const {
  getSettings,
  updateTheme,
  updateMenuOrder,
  updateMenuVisibility,
  updateSectionsOrder,
  resetSettings
} = require('../controllers/settingsController');

const router = express.Router();

router.get('/settings', getSettings);
router.put('/settings/theme', updateTheme);
router.put('/settings/menu-order', updateMenuOrder);
router.put('/settings/menu-visibility', updateMenuVisibility);
router.put('/settings/sections-order', updateSectionsOrder);
router.post('/settings/reset', resetSettings);

module.exports = router;
