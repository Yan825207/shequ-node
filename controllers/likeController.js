const Like = require('../models/Like');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @desc    Like a post or comment
// @route   POST /api/v1/likes
// @access  Private
const createLike = async (req, res) => {
  try {
    const { target_id, target_type } = req.body;
    
    if (!target_id || !target_type) {
      return res.status(400).json({ code: 400, message: 'target_id and target_type are required' });
    }
    
    // 检查目标是否存在
    let target;
    if (target_type === 'post') {
      target = await Post.findByPk(target_id);
    } else {
      target = await Comment.findByPk(target_id);
    }
    
    if (!target) {
      return res.status(404).json({ code: 404, message: `${target_type} not found` });
    }
    
    // 创建点赞记录
    const like = await Like.create({
      userId: req.user.id,
      targetId: target_id,
      targetType: target_type
    });
    
    // 更新目标的点赞数
    if (target_type === 'post') {
      await target.update({ likes_count: target.likes_count + 1 });
    } else {
      await target.update({ likes_count: target.likes_count + 1 });
    }
    
    res.status(201).json({ code: 201, message: 'Like created successfully', data: like });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ code: 400, message: 'Already liked' });
    }
    res.status(500).json({ code: 500, message: 'Server error', error: error.message });
  }
};

// @desc    Unlike a post or comment
// @route   DELETE /api/v1/likes
// @access  Private
const deleteLike = async (req, res) => {
  try {
    const { target_id, target_type } = req.query;
    
    if (!target_id || !target_type) {
      return res.status(400).json({ code: 400, message: 'target_id and target_type are required' });
    }
    
    // 查询点赞记录
    const like = await Like.findOne({
      where: {
        userId: req.user.id,
        targetId: target_id,
        targetType: target_type
      }
    });
    
    if (!like) {
      return res.status(404).json({ code: 404, message: 'Like not found' });
    }
    
    // 删除点赞记录
    await Like.destroy({
      where: {
        userId: req.user.id,
        targetId: target_id,
        targetType: target_type
      }
    });
    
    // 更新目标的点赞数
    if (target_type === 'post') {
      const post = await Post.findByPk(target_id);
      if (post) {
        await post.update({ likes_count: Math.max(0, post.likes_count - 1) });
      }
    } else {
      const comment = await Comment.findByPk(target_id);
      if (comment) {
        await comment.update({ likes_count: Math.max(0, comment.likes_count - 1) });
      }
    }
    
    res.status(200).json({ code: 200, message: 'Like deleted successfully', data: null });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Server error', error: error.message });
  }
};

// @desc    Check if user liked a target
// @route   GET /api/v1/likes/check
// @access  Private
const checkLike = async (req, res) => {
  try {
    const { target_id, target_type } = req.query;
    
    if (!target_id || !target_type) {
      return res.status(400).json({ code: 400, message: 'target_id and target_type are required' });
    }
    
    // 查询点赞记录
    const like = await Like.findOne({
      where: {
        userId: req.user.id,
        targetId: target_id,
        targetType: target_type
      }
    });
    
    res.status(200).json({ 
      code: 200, 
      message: 'success', 
      data: { 
        is_liked: !!like 
      } 
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createLike,
  deleteLike,
  checkLike
};
