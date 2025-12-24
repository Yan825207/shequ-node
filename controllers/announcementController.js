const Announcement = require('../models/Announcement');

// 获取所有活跃公告
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      code: 200,
      message: '公告列表获取成功',
      data: announcements
    });
  } catch (error) {
    console.error('获取公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取公告失败',
      data: null
    });
  }
};

// 管理员：创建公告
const createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        code: 400,
        message: '标题和内容不能为空',
        data: null
      });
    }
    
    const announcement = await Announcement.create({
      title,
      content
    });
    
    res.status(201).json({
      code: 201,
      message: '公告创建成功',
      data: announcement
    });
  } catch (error) {
    console.error('创建公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建公告失败',
      data: null
    });
  }
};

// 管理员：更新公告
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;
    
    const announcement = await Announcement.findByPk(id);
    
    if (!announcement) {
      return res.status(404).json({
        code: 404,
        message: '公告不存在',
        data: null
      });
    }
    
    await announcement.update({
      title: title || announcement.title,
      content: content || announcement.content,
      isActive: isActive !== undefined ? isActive : announcement.isActive
    });
    
    res.status(200).json({
      code: 200,
      message: '公告更新成功',
      data: announcement
    });
  } catch (error) {
    console.error('更新公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新公告失败',
      data: null
    });
  }
};

// 管理员：删除公告
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findByPk(id);
    
    if (!announcement) {
      return res.status(404).json({
        code: 404,
        message: '公告不存在',
        data: null
      });
    }
    
    await announcement.destroy();
    
    res.status(200).json({
      code: 200,
      message: '公告删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除公告失败',
      data: null
    });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};