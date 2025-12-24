const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getUserById
} = require('../controllers/userController');

// 公共路由
router.post('/register', registerUser);
router.post('/login', loginUser);

// 私有路由
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// 更通用的路由放在最后
router.get('/:id', getUserById);

module.exports = router;
