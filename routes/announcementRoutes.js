const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');

// 公开路由
router.get('/', getAnnouncements);

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
}, createAnnouncement);

router.put('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '无权限执行此操作',
      data: null
    });
  }
  next();
}, updateAnnouncement);

router.delete('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '无权限执行此操作',
      data: null
    });
  }
  next();
}, deleteAnnouncement);

module.exports = router;