const express = require('express');
const {
  listLeadStatuses,
  createLeadStatus,
  getLeadStatus,
  updateLeadStatus,
  deleteLeadStatus
} = require('../controllers/leadStatusController');

const router = express.Router();

router.get('/lead-statuses', listLeadStatuses);
router.post('/lead-statuses', createLeadStatus);
router.get('/lead-statuses/:statusId', getLeadStatus);
router.put('/lead-statuses/:statusId', updateLeadStatus);
router.delete('/lead-statuses/:statusId', deleteLeadStatus);

module.exports = router;
