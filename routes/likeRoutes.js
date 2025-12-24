const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createLike,
  deleteLike,
  checkLike
} = require('../controllers/likeController');

// 私有路由
router.post('/', protect, createLike);
router.delete('/', protect, deleteLike);
router.get('/check', protect, checkLike);

module.exports = router;
