const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0.01
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
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  category: {
    type: DataTypes.ENUM('闲置', '电子产品', '家居用品', '服装配饰', '书籍音像', '运动户外', '其他'),
    defaultValue: '闲置'
  },
  status: {
    type: DataTypes.ENUM('全新', '九成新', '八成新', '七成新', '六成新及以下'),
    defaultValue: '九成新'
  },
  isSold: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  views: {
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
  tableName: 'products'
});

// 关联关系将在associations.js中统一处理

module.exports = Product;