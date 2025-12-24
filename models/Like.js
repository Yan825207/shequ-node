const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');
const User = require('./User');

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetType: {
    type: DataTypes.ENUM('post', 'comment'),
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'likes',
  indexes: [
    // 复合唯一索引，防止重复点赞
    {
      unique: true,
      fields: ['userId', 'targetId', 'targetType']
    }
  ]
});

// 关联关系
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Like;