// 定时任务服务 - 处理自动发布功能
const cron = require('node-cron');
const Post = require('../models/Post');
const { getJinshanDailyQuote, generateImageWithAI } = require('./contentGenerator');

/**
 * 自动发布金山词霸每日一句
 */
async function publishDailyQuote() {
  try {
    console.log('开始发布金山词霸每日一句...');
    
    // 1. 获取金山词霸每日一句
    const dailyQuote = await getJinshanDailyQuote();
    console.log('获取到每日一句:', dailyQuote);
    
    // 2. 使用AI生成图片（基于每日一句内容）
    let imageUrl = '';
    if (dailyQuote.originalData && dailyQuote.originalData.picture) {
      // 如果金山词霸返回了图片，直接使用
      imageUrl = dailyQuote.originalData.picture;
      console.log('使用金山词霸提供的图片:', imageUrl);
    } else {
      // 否则使用AI生成图片
      imageUrl = await generateImageWithAI(dailyQuote.content);
      console.log('使用AI生成的图片:', imageUrl);
    }
    
    // 3. 创建动态
    const post = await Post.create({
      title: dailyQuote.title,
      content: dailyQuote.content,
      authorId: 1, // 管理员用户ID
      images: imageUrl ? [imageUrl] : [],
      category: '学习',
      likes_count: 0,
      views: 0
    });
    
    console.log('✅ 金山词霸每日一句发布成功:', post);
    return post;
    
  } catch (error) {
    console.error('❌ 发布金山词霸每日一句失败:', error.message);
    console.error('错误详情:', error);
    return null;
  }
}

/**
 * 初始化定时任务
 */
function initializeCronJobs() {
  console.log('正在初始化定时任务...');
  
  // 每天早上8点发布金山词霸每日一句
  const dailyQuoteJob = cron.schedule('0 8 * * *', async () => {
    await publishDailyQuote();
  });
  
  console.log('定时任务已设置: 每天早上8点发布金山词霸每日一句');
  
  // 立即测试一次功能
  testDailyQuotePublish();
  
  return {
    dailyQuoteJob
  };
}

/**
 * 测试每日一句发布功能
 */
async function testDailyQuotePublish() {
  try {
    console.log('开始测试每日一句发布功能...');
    
    // 测试获取每日一句
    const dailyQuote = await getJinshanDailyQuote();
    console.log('测试获取到每日一句:', dailyQuote);
    
    // 测试AI图片生成
    const imageUrl = await generateImageWithAI(dailyQuote.content);
    console.log('测试生成的图片URL:', imageUrl);
    
    console.log('每日一句发布功能测试完成');
    
  } catch (error) {
    console.error('测试每日一句发布功能失败:', error.message);
  }
}

module.exports = {
  initializeCronJobs,
  publishDailyQuote,
  testDailyQuotePublish
};
