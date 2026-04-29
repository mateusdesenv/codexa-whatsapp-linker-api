const express = require('express');
const {
  createUser,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.post('/usuarios', createUser);
router.get('/usuarios/:id', getUser);
router.put('/usuarios/:id', updateUser);
router.delete('/usuarios/:id', deleteUser);

module.exports = router;
