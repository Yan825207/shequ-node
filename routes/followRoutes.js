const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createFollow,
  deleteFollow,
  getFollowers,
  getFollowing,
  checkFollow
} = require('../controllers/followController');

// 公共路由
router.get('/followers/:id', getFollowers);
router.get('/following/:id', getFollowing);

// 私有路由
router.post('/', protect, createFollow);
router.delete('/:id', protect, deleteFollow);
router.get('/check/:id', protect, checkFollow);

module.exports = router;
