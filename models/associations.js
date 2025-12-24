const Post = require('./Post');
const User = require('./User');
const Comment = require('./Comment');
const Follow = require('./Follow');
const Like = require('./Like');
const Message = require('./Message');
const Announcement = require('./Announcement');
const Banner = require('./Banner');

// 设置所有模型关联
const setupAssociations = () => {
  // Post关联
  Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
  Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
  
  // Comment关联
  Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
  Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
  Comment.belongsTo(Comment, { foreignKey: 'parentCommentId', as: 'parentComment' });
  Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies' });
  
  // Message关联
  Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
  Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
  User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
  User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
};

module.exports = setupAssociations;