const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductCategories
} = require('../controllers/productController');

// 确保uploads目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 创建multer实例，限制最多6张图片
const upload = multer({ storage: storage });

// 公共路由
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/categories/list', getProductCategories);

// 私有路由
router.post('/', protect, upload.array('images', 6), createProduct);
router.put('/:id', protect, upload.array('images', 6), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;