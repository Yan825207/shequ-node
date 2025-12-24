const Message = require('../models/Message');
const User = require('../models/User');
const { Op } = require('sequelize');

// 发送消息
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    // 验证接收者是否存在
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ code: 404, message: '接收者不存在', data: null });
    }

    // 不能给自己发消息
    if (senderId === receiverId) {
      return res.status(400).json({ code: 400, message: '不能给自己发送消息', data: null });
    }

    // 创建消息
    const message = await Message.create({
      senderId,
      receiverId,
      content
    });

    // 返回包含发送者和接收者信息的消息
    const fullMessage = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'avatar'] }
      ]
    });

    res.status(201).json({ code: 201, message: '消息发送成功', data: fullMessage });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
};

// 获取与特定用户的聊天记录
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // 验证对方用户是否存在
    const otherUser = await User.findByPk(userId);
    if (!otherUser) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    // 获取聊天记录
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'avatar'] }
      ],
      order: [['createdAt', 'ASC']],
      limit: 50, // 限制返回消息数量
      offset: parseInt(req.query.offset) || 0
    });

    // 标记收到的消息为已读
    await Message.update(
      { read: true },
      {
        where: {
          senderId: userId,
          receiverId: currentUserId,
          read: false
        }
      }
    );

    res.status(200).json({ code: 200, message: '聊天记录获取成功', data: messages });
  } catch (error) {
    console.error('获取聊天记录错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
};

// 获取消息列表（与不同用户的对话）
exports.getMessageList = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取所有与当前用户有关的消息
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 整理消息列表，每个对话只保留最新的一条消息
    const conversationMap = new Map();
    
    messages.forEach(message => {
      // 确定对话的对方用户ID
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      // 如果还没有该对话的记录，或者当前消息比已有的更晚
      if (!conversationMap.has(otherUserId) || 
          new Date(message.createdAt) > new Date(conversationMap.get(otherUserId).createdAt)) {
        conversationMap.set(otherUserId, message);
      }
    });

    // 转换为数组并按最新消息时间排序
    const conversationList = Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // 为每个对话添加未读消息数量
    const conversationsWithUnreadCount = await Promise.all(conversationList.map(async (conversation) => {
      const otherUserId = conversation.senderId === userId ? conversation.receiverId : conversation.senderId;
      
      // 计算该对话中的未读消息数量
      const unreadCount = await Message.count({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          read: false
        }
      });
      
      return {
        ...conversation.toJSON(),
        unreadCount
      };
    }));

    res.status(200).json({ code: 200, message: '消息列表获取成功', data: conversationsWithUnreadCount });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
};

// 获取未读消息数量
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.count({
      where: {
        receiverId: userId,
        read: false
      }
    });

    res.status(200).json({ code: 200, message: '未读消息数量获取成功', data: { unreadCount: count } });
  } catch (error) {
    console.error('获取未读消息数量错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
};

// 标记消息为已读
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // 查找消息
    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({ code: 404, message: '消息不存在', data: null });
    }

    // 只有消息接收者可以标记为已读
    if (message.receiverId !== userId) {
      return res.status(403).json({ code: 403, message: '无权标记此消息', data: null });
    }

    // 标记为已读
    await message.update({ read: true });

    res.status(200).json({ code: 200, message: '消息已标记为已读', data: null });
  } catch (error) {
    console.error('标记消息已读错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
};

// 删除消息
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // 查找消息
    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({ code: 404, message: '消息不存在', data: null });
    }

    // 只有消息发送者或接收者可以删除消息
    if (message.senderId !== userId && message.receiverId !== userId) {
      return res.status(403).json({ code: 403, message: '无权删除此消息', data: null });
    }

    // 删除消息
    await message.destroy();

    res.status(200).json({ code: 200, message: '消息已删除', data: null });
  } catch (error) {
    console.error('删除消息错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
};