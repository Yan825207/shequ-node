const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500]
    }
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联的帖子ID',
    references: {
      model: 'posts',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联的商品ID',
    references: {
      model: 'products',
      key: 'id'
    }
  },
  parentCommentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'comments'
});

// 关联关系将在associations.js中统一处理

module.exports = Comment;