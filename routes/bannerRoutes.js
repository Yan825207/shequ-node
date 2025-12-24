const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect } = require('../middleware/auth');

// 公开路由
router.get('/', getBanners);

// 管理员路由
router.post('/', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '无权限执行此操作',
      data: null
    });
  }
  next();
}, createBanner);

router.put('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '无权限执行此操作',
      data: null
    });
  }
  next();
}, updateBanner);

router.delete('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '无权限执行此操作',
      data: null
    });
  }
  next();
}, deleteBanner);

module.exports = router;