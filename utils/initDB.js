const { sequelize, testConnection, syncModels } = require('./db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 初始化管理员用户
const initAdmin = async () => {
  try {
    // 检查管理员用户是否已存在
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }
    
    // 创建管理员用户
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      nickname: '管理员',
      role: 'admin'
    });
    
    console.log('Admin user created successfully:', admin.id);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

// 初始化测试用户
const initTestUsers = async () => {
  try {
    // 检查测试用户是否已存在
    const userExists = await User.findOne({ where: { username: 'testuser' } });
    
    if (userExists) {
      console.log('Test user already exists');
      return;
    }
    
    // 创建测试用户
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123',
      nickname: '测试用户',
      role: 'user'
    });
    
    console.log('Test user created successfully:', user.id);
  } catch (error) {
    console.error('Error creating test user:', error.message);
  }
};

// 初始化数据库
const initDB = async () => {
  try {
    await testConnection();
    await syncModels();
    await initAdmin();
    await initTestUsers();
    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
};

// 执行初始化
initDB();