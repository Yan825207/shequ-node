const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// @desc    用户注册
// @route   POST /api/v1/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });
    if (userExists) {
      return res.status(400).json({ code: 400, message: 'User already exists' });
    }

    // 创建用户
    const user = await User.create({ username, email, password });

    // 返回响应
    res.status(201).json({
      code: 201,
      message: 'User registered successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    用户登录
// @route   POST /api/v1/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Invalid email or password' });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ code: 401, message: 'Invalid email or password' });
    }

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Login successful',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    获取个人资料
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    更新个人资料
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username, email, avatar, bio } = req.body;

    // 查找用户
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    // 更新用户信息
    const updatedUser = await user.update({
      username: username || user.username,
      email: email || user.email,
      avatar: avatar || user.avatar,
      bio: bio || user.bio
    });

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    根据ID获取用户信息
// @route   GET /api/v1/users/:id
// @access  Public
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

// @desc    修改密码
// @route   PUT /api/v1/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 验证输入
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ code: 400, message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ code: 400, message: 'New password and confirm password do not match' });
    }

    // 查找用户
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    // 验证当前密码
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ code: 401, message: 'Current password is incorrect' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    // 返回响应
    res.status(200).json({
      code: 200,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  getUserById
};
