const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

/**
 * @route POST /api/v1/uploads/single
 * @description 上传单个文件
 * @access 公共
 */
router.post('/single', uploadController.upload.single('file'), uploadController.uploadSingleFile);

/**
 * @route POST /api/v1/uploads/multiple
 * @description 上传多个文件
 * @access 公共
 */
router.post('/multiple', uploadController.upload.array('files', 10), uploadController.uploadMultipleFiles);

module.exports = router;