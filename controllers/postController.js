const Post = require('../models/Post');
const User = require('../models/User');
const Favorite = require('../models/Favorite');

// @desc    创建帖子
// @route   POST /api/v1/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { title, content, category, images: bodyImages } = req.body;

    // 处理上传的图片
    let images = [];
    
    // 构建完整的预览地址基础
    // 优先使用环境变量中的BASE_URL，否则使用请求的主机信息
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
          size: 0, // 直接传入地址时无法获取文件大小
          mimetype: 'image/jpeg' // 默认类型，实际使用时可能需要根据文件名后缀判断
        };
      });
    }

    // 创建帖子
    const post = await Post.create({
      title,
      content,
      authorId: req.user.id,
      images,
      category
    });

    // 返回响应
    res.status(201).json({
      code: 201,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    获取所有帖子
// @route   GET /api/v1/posts
// @access  Public
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where = category ? { category } : {};

    // 获取帖子总数和列表
    const { count: total, rows: posts } = await Post.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: Number(limit)
    });

    // 如果用户已登录，获取用户的收藏列表
    let userFavorites = [];
    if (req.user) {
      const favorites = await Favorite.findAll({
        where: { userId: req.user.id },
        attributes: ['postId']
      });
      userFavorites = favorites.map(fav => fav.postId);
    }

    // 为每个帖子添加收藏状态
    const postsWithFavoriteStatus = posts.map(post => {
      const postData = post.toJSON();
      postData.isFavorite = userFavorites.includes(postData.id);
      return postData;
    });

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Posts retrieved successfully',
      data: {
        list: postsWithFavoriteStatus,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    获取单个帖子详情
// @route   GET /api/v1/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }]
    });

    if (!post) {
      return res.status(404).json({ code: 404, message: 'Post not found' });
    }

    // 增加浏览量
    await post.update({ views: post.views + 1 });

    // 检查用户是否已收藏该帖子
    let isFavorite = false;
    if (req.user) {
      const favorite = await Favorite.findOne({
        where: {
          userId: req.user.id,
          postId: post.id
        }
      });
      isFavorite = !!favorite;
    }

    // 为帖子添加收藏状态
    const postData = post.toJSON();
    postData.isFavorite = isFavorite;

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Post retrieved successfully',
      data: postData
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    更新帖子
// @route   PUT /api/v1/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const { title, content, category, images: bodyImages } = req.body;

    // 查找帖子
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ code: 404, message: 'Post not found' });
    }

    // 检查是否为作者
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ code: 403, message: 'Not authorized to update this post' });
    }

    // 处理上传的图片
    let images = post.images;
    
    // 构建完整的预览地址基础
    // 优先使用环境变量中的BASE_URL，否则使用请求的主机信息
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
    else if (bodyImages !== undefined) {
      if (Array.isArray(bodyImages)) {
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
            size: 0, // 直接传入地址时无法获取文件大小
            mimetype: 'image/jpeg' // 默认类型，实际使用时可能需要根据文件名后缀判断
          };
        });
      } else {
        // 如果传入的不是数组，清空图片
        images = [];
      }
    }

    // 更新帖子
    const updatedPost = await post.update({
      title: title || post.title,
      content: content || post.content,
      images,
      category: category || post.category
    });

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    删除帖子
// @route   DELETE /api/v1/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    // 查找帖子
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ code: 404, message: 'Post not found' });
    }

    // 检查是否为作者
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ code: 403, message: 'Not authorized to delete this post' });
    }

    // 删除帖子
    await post.destroy();

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Post deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    获取用户发布的帖子
// @route   GET /api/v1/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // 获取帖子总数和列表
    const { count: total, rows: posts } = await Post.findAndCountAll({
      where: { authorId: req.params.userId },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: Number(limit)
    });

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'User posts retrieved successfully',
      data: {
        posts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    获取帖子分类列表
// @route   GET /api/v1/posts/categories
// @access  Public
const getPostCategories = async (req, res) => {
  try {
    // 从Post模型的category字段定义中获取所有分类
    // 注意：这种方法只适用于Sequelize的ENUM类型
    const categories = Post.rawAttributes.category.values || [
      '生活分享', '求助', '通知', '活动', '其他'
    ];

    // 格式化分类数据
    const formattedCategories = categories.map(category => ({
      label: category,
      value: category
    }));

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Post categories retrieved successfully',
      data: formattedCategories
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getUserPosts,
  getPostCategories
};
