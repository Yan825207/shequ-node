const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 认证中间件
const protect = async (req, res, next) => {
  let token;

  // 检查Authorization头
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 提取token
      token = req.headers.authorization.split(' ')[1];
      console.log('Received token:', token);

      // 验证token
      console.log('JWT Secret:', process.env.JWT_SECRET);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);

      // 获取用户信息，排除密码
      req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      console.log('User found:', req.user);

      next();
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(401).json({ code: 401, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ code: 401, message: 'Not authorized, no token' });
  }
};

// 可选认证中间件 - 用于公开接口但需要知道用户是否登录
const optionalProtect = async (req, res, next) => {
  let token;

  // 检查Authorization头
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 提取token
      token = req.headers.authorization.split(' ')[1];

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 获取用户信息，排除密码
      req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    } catch (error) {
      // 可选认证，token无效不影响请求继续
      console.error('Token validation error in optional protect:', error);
    }
  }

  // 无论是否有有效token，都继续处理请求
  next();
};

// 角色授权中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: 'Not authorized for this role' });
    }
    next();
  };
};

module.exports = { protect, optionalProtect, authorize };
