const Follow = require('../models/Follow');
const User = require('../models/User');

// @desc    Follow a user
// @route   POST /api/v1/follows
// @access  Private
const createFollow = async (req, res) => {
  try {
    const { following_id } = req.body;
    
    if (!following_id) {
      return res.status(400).json({ code: 400, message: 'following_id is required' });
    }
    
    // 不能关注自己
    if (following_id === req.user.id.toString()) {
      return res.status(400).json({ code: 400, message: 'You cannot follow yourself' });
    }

    // 检查被关注用户是否存在
    const followingUser = await User.findByPk(following_id);
    if (!followingUser) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    // 创建关注记录
    const follow = await Follow.create({
      followerId: req.user.id,
      followingId: following_id
    });

    // 更新关注者和被关注者的统计数据
    const followerUser = await User.findByPk(req.user.id);
    await followerUser.update({ following_count: followerUser.following_count + 1 });

    await followingUser.update({ followers_count: followingUser.followers_count + 1 });
    
    res.status(201).json({ code: 201, message: 'Followed successfully', data: follow });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ code: 400, message: 'Already following' });
    }
    res.status(500).json({ code: 500, message: 'Server error', error: error.message });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/v1/follows/:id
// @access  Private
const deleteFollow = async (req, res) => {
  try {
    const following_id = req.params.id;
    
    // 查询关注记录
    const follow = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId: following_id
      }
    });

    if (!follow) {
      return res.status(404).json({ code: 404, message: 'Follow record not found' });
    }

    // 删除关注记录
    await Follow.destroy({
      where: {
        followerId: req.user.id,
        followingId: following_id
      }
    });

    // 更新关注者和被关注者的统计数据
    const followerUser = await User.findByPk(req.user.id);
    await followerUser.update({ following_count: Math.max(0, followerUser.following_count - 1) });

    const followingUser = await User.findByPk(following_id);
    await followingUser.update({ followers_count: Math.max(0, followingUser.followers_count - 1) });
    
    res.status(200).json({ code: 200, message: 'Unfollowed successfully', data: null });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Server error', error: error.message });
  }
};

// @desc    Get followers list
// @route   GET /api/v1/follows/followers/:id
// @access  Public
const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    
    // 计算分页参数
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    // 查询关注者列表和总数量
    const { count: total, rows: followers } = await Follow.findAndCountAll({
      where: { followingId: id },
      include: [{
        model: User,
        as: 'follower',
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limit
    });
    
    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        list: followers,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          pages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Server error', error: error.message });
  }
};

// @desc    Get following list
// @route   GET /api/v1/follows/following/:id
// @access  Public
const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    
    // 计算分页参数
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    // 查询关注列表和总数量
    const { count: total, rows: following } = await Follow.findAndCountAll({
      where: { followerId: id },
      include: [{
        model: User,
        as: 'following',
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limit
    });
    
    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        list: following,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          pages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Server error', error: error.message });
  }
};

// @desc    Check if user is following another user
// @route   GET /api/v1/follows/check/:id
// @access  Private
const checkFollow = async (req, res) => {
  try {
    const following_id = req.params.id;
    
    // 查询关注记录
    const follow = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId: following_id
      }
    });
    
    res.status(200).json({ 
      code: 200, 
      message: 'success', 
      data: { 
        is_following: !!follow 
      } 
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createFollow,
  deleteFollow,
  getFollowers,
  getFollowing,
  checkFollow
};
