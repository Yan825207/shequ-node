const Banner = require('../models/Banner');

// 获取所有活跃的Banner
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });
    
    res.status(200).json({
      code: 200,
      message: 'Banner列表获取成功',
      data: banners
    });
  } catch (error) {
    console.error('获取Banner失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取Banner失败',
      data: null
    });
  }
};

// 管理员：创建Banner
const createBanner = async (req, res) => {
  try {
    const { title, imageUrl, linkUrl, order } = req.body;
    
    if (!title || !imageUrl || !linkUrl) {
      return res.status(400).json({
        code: 400,
        message: '标题、图片URL和链接URL不能为空',
        data: null
      });
    }
    
    const banner = await Banner.create({
      title,
      imageUrl,
      linkUrl,
      order: order || 0
    });
    
    res.status(201).json({
      code: 201,
      message: 'Banner创建成功',
      data: banner
    });
  } catch (error) {
    console.error('创建Banner失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建Banner失败',
      data: null
    });
  }
};

// 管理员：更新Banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, linkUrl, order, isActive } = req.body;
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({
        code: 404,
        message: 'Banner不存在',
        data: null
      });
    }
    
    await banner.update({
      title: title || banner.title,
      imageUrl: imageUrl || banner.imageUrl,
      linkUrl: linkUrl || banner.linkUrl,
      order: order !== undefined ? order : banner.order,
      isActive: isActive !== undefined ? isActive : banner.isActive
    });
    
    res.status(200).json({
      code: 200,
      message: 'Banner更新成功',
      data: banner
    });
  } catch (error) {
    console.error('更新Banner失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新Banner失败',
      data: null
    });
  }
};

// 管理员：删除Banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({
        code: 404,
        message: 'Banner不存在',
        data: null
      });
    }
    
    await banner.destroy();
    
    res.status(200).json({
      code: 200,
      message: 'Banner删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除Banner失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除Banner失败',
      data: null
    });
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
};