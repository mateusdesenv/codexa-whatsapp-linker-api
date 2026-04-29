const express = require('express');
const {
  listMessages,
  createMessage,
  getMessage,
  updateMessage,
  updateFavorite,
  deleteMessage
} = require('../controllers/messageController');

const router = express.Router();

router.get('/messages', listMessages);
router.post('/messages', createMessage);
router.get('/messages/:messageId', getMessage);
router.put('/messages/:messageId', updateMessage);
router.patch('/messages/:messageId/favorite', updateFavorite);
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;
