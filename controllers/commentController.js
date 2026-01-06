const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    创建评论（支持帖子和商品）
// @route   POST /api/v1/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { content, postId, productId, parentCommentId } = req.body;

    // 至少需要postId或productId之一
    if (!postId && !productId) {
      return res.status(400).json({ 
        code: 400, 
        message: '请提供postId或productId' 
      });
    }

    // 如果有postId，检查帖子是否存在
    if (postId) {
      const post = await Post.findByPk(postId);
      if (!post) {
        return res.status(404).json({ code: 404, message: '帖子不存在' });
      }
    }

    // 如果有productId，检查商品是否存在
    if (productId) {
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }
    }

    // 如果有父评论ID，检查父评论是否存在
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findByPk(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ code: 404, message: '父评论不存在' });
      }
      // 验证父评论关联的是同一个资源
      if (parentComment.postId && parentComment.postId !== postId) {
        return res.status(400).json({ code: 400, message: '父评论不属于此资源' });
      }
      if (parentComment.productId && parentComment.productId !== productId) {
        return res.status(400).json({ code: 400, message: '父评论不属于此资源' });
      }
    }

    // 创建评论
    const comment = await Comment.create({
      content,
      authorId: req.user.id,
      postId: postId || null,
      productId: productId || null,
      parentCommentId: parentCommentId || null
    });

    // 返回响应
    res.status(201).json({
      code: 201,
      message: '评论创建成功',
      data: comment
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    获取帖子的所有评论
// @route   GET /api/v1/comments/post/:postId
// @access  Public
const getPostComments = async (req, res) => {
  try {
    // 获取帖子的所有顶级评论
    const comments = await Comment.findAll({
      where: { postId: req.params.postId, parentCommentId: null },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }, {
        model: Comment,
        as: 'replies',
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    // 返回响应
    res.status(200).json({
      code: 200,
      message: '获取帖子评论成功',
      data: comments
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    获取商品的所有评论
// @route   GET /api/v1/comments/product/:productId
// @access  Public
const getProductComments = async (req, res) => {
  try {
    // 获取商品的所有顶级评论
    const comments = await Comment.findAll({
      where: { productId: req.params.productId, parentCommentId: null },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }, {
        model: Comment,
        as: 'replies',
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    // 返回响应
    res.status(200).json({
      code: 200,
      message: '获取商品评论成功',
      data: comments
    });
  } catch (error) {
    console.error('获取商品评论失败:', error);
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    删除评论
// @route   DELETE /api/v1/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    // 查找评论
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ code: 404, message: '评论不存在' });
    }

    // 检查是否为作者
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权删除此评论' });
    }

    // 如果是父评论，删除所有回复
    if (comment.parentCommentId === null) {
      await Comment.destroy({
        where: { parentCommentId: comment.id }
      });
    }

    // 删除评论
    await comment.destroy();

    // 返回响应
    res.status(200).json({
      code: 200,
      message: '评论删除成功',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(400).json({ code: 400, message: error.message });
  }
};

module.exports = {
  createComment,
  getPostComments,
  getProductComments,
  deleteComment
};