const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');

// @desc    创建评论
// @route   POST /api/v1/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;

    // 查找帖子是否存在
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ code: 404, message: 'Post not found' });
    }

    // 创建评论
    const comment = await Comment.create({
      content,
      authorId: req.user.id,
      postId,
      parentCommentId: parentCommentId || null
    });

    // 返回响应
    res.status(201).json({
      code: 201,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    获取帖子的所有评论
// @route   GET /api/v1/comments/post/:postId
// @access  Public
const getPostComments = async (req, res) => {
  try {
    // 获取帖子的所有评论
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
      message: 'Comments retrieved successfully',
      data: comments
    });
  } catch (error) {
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
      return res.status(404).json({ code: 404, message: 'Comment not found' });
    }

    // 检查是否为作者
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ code: 403, message: 'Not authorized to delete this comment' });
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
      message: 'Comment deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

module.exports = {
  createComment,
  getPostComments,
  deleteComment
};
