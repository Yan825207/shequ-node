const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// 发送消息
router.post('/', protect, messageController.sendMessage);

// 获取与特定用户的聊天记录
router.get('/chat/:userId', protect, messageController.getChatHistory);

// 获取消息列表（与不同用户的对话）
router.get('/list', protect, messageController.getMessageList);

// 获取未读消息数量
router.get('/unread/count', protect, messageController.getUnreadCount);

// 标记消息为已读
router.put('/:messageId/read', protect, messageController.markAsRead);

// 删除消息
router.delete('/:messageId', protect, messageController.deleteMessage);

module.exports = router;