const express = require('express');
const {
  listLeadCategories,
  createLeadCategory,
  getLeadCategory,
  updateLeadCategory,
  deleteLeadCategory
} = require('../controllers/leadCategoryController');

const router = express.Router();

router.get('/lead-categories', listLeadCategories);
router.post('/lead-categories', createLeadCategory);
router.get('/lead-categories/:categoryId', getLeadCategory);
router.put('/lead-categories/:categoryId', updateLeadCategory);
router.delete('/lead-categories/:categoryId', deleteLeadCategory);

module.exports = router;
