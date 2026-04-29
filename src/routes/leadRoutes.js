const express = require('express');
const {
  listLeads,
  getLeadStats,
  createLead,
  importLeads,
  exportLeads,
  getLead,
  updateLead,
  updateLeadStatus,
  updateLeadCategory,
  deleteLead,
  deleteAllLeads,
  generateLeadWhatsAppLink,
  createLeadInteraction
} = require('../controllers/leadController');

const router = express.Router();

router.get('/leads', listLeads);
router.post('/leads', createLead);
router.post('/leads/import', importLeads);
router.get('/leads/export', exportLeads);
router.get('/leads/stats', getLeadStats);
router.delete('/leads', deleteAllLeads);
router.get('/leads/:leadId', getLead);
router.put('/leads/:leadId', updateLead);
router.patch('/leads/:leadId/status', updateLeadStatus);
router.patch('/leads/:leadId/category', updateLeadCategory);
router.post('/leads/:leadId/whatsapp-link', generateLeadWhatsAppLink);
router.post('/leads/:leadId/interactions', createLeadInteraction);
router.delete('/leads/:leadId', deleteLead);

module.exports = router;
