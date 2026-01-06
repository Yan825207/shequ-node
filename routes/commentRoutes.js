const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPostComments,
  getProductComments,
  createComment,
  deleteComment
} = require('../controllers/commentController');

// 公共路由
router.get('/post/:postId', getPostComments);
router.get('/product/:productId', getProductComments);

// 私有路由
router.post('/', protect, createComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
