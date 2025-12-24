const { Sequelize } = require('sequelize');
require('dotenv').config();

// 安全地创建Sequelize实例
let sequelize;
try {
  // 尝试加载pg包
  require('pg');
  
  // 创建Sequelize实例（PostgreSQL配置）
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 1, // 减少连接池大小，适合开发环境
        min: 0,
        acquire: 10000, // 减少超时时间
        idle: 5000
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        connectTimeout: 10000 // 设置连接超时
      }
    }
  );
} catch (error) {
  console.error('Error initializing database connection:', error.message);
  // 创建一个空对象，避免在依赖安装阶段崩溃
  sequelize = {};
}

// 测试数据库连接
const testConnection = async () => {
  try {
    if (!sequelize || !sequelize.authenticate) {
      console.warn('Database connection not initialized, skipping connection test');
      return;
    }
    
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
    // 在开发环境中，不要直接退出进程
    // 而是记录错误并允许服务器继续运行
    if (process.env.NODE_ENV === 'production') {
      // 在生产环境中也不要退出，而是记录错误
      console.warn('Continuing server startup despite database connection error');
    }
  }
};

// 同步数据库模型
const syncModels = async () => {
  try {
    if (!sequelize || !sequelize.sync) {
      console.warn('Database connection not initialized, skipping model sync');
      return;
    }
    
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized');
  } catch (error) {
    console.error('Error synchronizing database models:', error.message);
    // 在开发环境中，不要直接退出进程
    // 而是记录错误并允许服务器继续运行
    if (process.env.NODE_ENV === 'production') {
      // 在生产环境中也不要退出，而是记录错误
      console.warn('Continuing server startup despite model sync error');
    }
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncModels
};