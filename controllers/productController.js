const Product = require('../models/Product');
const User = require('../models/User');

// @desc    创建二手商品
// @route   POST /api/v1/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, status, images: bodyImages } = req.body;

    // 处理上传的图片
    let images = [];
    
    // 构建完整的预览地址基础
    const baseUrl = process.env.BASE_URL || `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`;
    
    // 优先处理文件上传
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => {
        const fileUrl = `${baseUrl}/uploads/${file.filename}`;
        return {
          filename: file.filename,
          url: fileUrl,
          preview_url: fileUrl,
          size: file.size,
          mimetype: file.mimetype
        };
      });
    } 
    // 处理直接传入的图片地址
    else if (bodyImages && Array.isArray(bodyImages)) {
      images = bodyImages.map(imageUrl => {
        // 从图片地址中提取文件名
        const filename = imageUrl.split('/').pop();
        // 如果是相对路径，转换为完整的预览地址
        let fullUrl = imageUrl;
        if (imageUrl.startsWith('/')) {
          fullUrl = `${baseUrl}${imageUrl}`;
        }
        return {
          filename,
          url: fullUrl,
          preview_url: fullUrl,
          size: 0,
          mimetype: 'image/jpeg'
        };
      });
    }

    // 创建二手商品
    const product = await Product.create({
      title,
      description,
      price,
      category,
      status,
      authorId: req.user.id,
      images
    });

    res.status(201).json({
      code: 201,
      message: '二手商品创建成功',
      data: product
    });
  } catch (error) {
    console.error('创建二手商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建二手商品失败',
      error: error.message
    });
  }
};

// @desc    获取所有二手商品
// @route   GET /api/v1/products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category, isSold, userId } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 构建查询条件
    const whereCondition = {};
    if (category) whereCondition.category = category;
    if (isSold !== undefined) whereCondition.isSold = isSold === 'true';
    if (userId) whereCondition.authorId = userId;

    // 获取商品列表和总数
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar'],
        as: 'author'
      }]
    });

    res.status(200).json({
      code: 200,
      message: '获取二手商品列表成功',
      data: {
        list: products,
        pagination: {
          current: parseInt(page),
          pageSize: limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取二手商品列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取二手商品列表失败',
      error: error.message
    });
  }
};

// @desc    根据ID获取二手商品
// @route   GET /api/v1/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar'],
        as: 'author'
      }]
    });

    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '二手商品不存在'
      });
    }

    // 更新浏览量
    product.views += 1;
    await product.save();

    res.status(200).json({
      code: 200,
      message: '获取二手商品成功',
      data: product
    });
  } catch (error) {
    console.error('获取二手商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取二手商品失败',
      error: error.message
    });
  }
};

// @desc    更新二手商品
// @route   PUT /api/v1/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { title, description, price, category, status, isSold, images: bodyImages } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '二手商品不存在'
      });
    }

    // 检查是否为商品作者
    if (product.authorId !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权限更新此商品'
      });
    }

    // 处理上传的图片
    let images = [];
    
    // 构建完整的预览地址基础
    const baseUrl = process.env.BASE_URL || `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`;
    
    // 优先处理文件上传
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => {
        const fileUrl = `${baseUrl}/uploads/${file.filename}`;
        return {
          filename: file.filename,
          url: fileUrl,
          preview_url: fileUrl,
          size: file.size,
          mimetype: file.mimetype
        };
      });
    } 
    // 处理直接传入的图片地址
    else if (bodyImages && Array.isArray(bodyImages)) {
      images = bodyImages.map(imageUrl => {
        // 从图片地址中提取文件名
        const filename = imageUrl.split('/').pop();
        // 如果是相对路径，转换为完整的预览地址
        let fullUrl = imageUrl;
        if (imageUrl.startsWith('/')) {
          fullUrl = `${baseUrl}${imageUrl}`;
        }
        return {
          filename,
          url: fullUrl,
          preview_url: fullUrl,
          size: 0,
          mimetype: 'image/jpeg'
        };
      });
    } else {
      // 如果没有上传新图片，保持原图片
      images = product.images;
    }

    // 更新商品信息
    await product.update({
      title: title || product.title,
      description: description || product.description,
      price: price || product.price,
      category: category || product.category,
      status: status || product.status,
      isSold: isSold !== undefined ? isSold : product.isSold,
      images
    });

    res.status(200).json({
      code: 200,
      message: '更新二手商品成功',
      data: product
    });
  } catch (error) {
    console.error('更新二手商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新二手商品失败',
      error: error.message
    });
  }
};

// @desc    删除二手商品
// @route   DELETE /api/v1/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '二手商品不存在'
      });
    }

    // 检查是否为商品作者
    if (product.authorId !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权限删除此商品'
      });
    }

    await product.destroy();

    res.status(200).json({
      code: 200,
      message: '删除二手商品成功',
      data: null
    });
  } catch (error) {
    console.error('删除二手商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除二手商品失败',
      error: error.message
    });
  }
};

// @desc    获取二手商品分类
// @route   GET /api/v1/products/categories
// @access  Public
const getProductCategories = async (req, res) => {
  try {
    // 获取所有分类
    const categories = ['电子产品', '家居用品', '服装配饰', '书籍音像', '运动户外', '其他'];
    
    res.status(200).json({
      code: 200,
      message: '获取二手商品分类成功',
      data: categories
    });
  } catch (error) {
    console.error('获取二手商品分类失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取二手商品分类失败',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductCategories
};