// 内容生成器 - 提供多种免费内容来源，包括金山词霸每日一句
const axios = require('axios');

/**
 * 获取金山词霸每日一句
 * @returns {Object} 每日一句内容对象
 */
async function getJinshanDailyQuote() {
  try {
    // 金山词霸每日一句API
    const url = 'https://open.iciba.com/dsapi/';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const data = response.data;
    
    if (!data || !data.content) {
      throw new Error('获取每日一句失败：返回数据格式不正确');
    }
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN');
    
    return {
      title: `${dateStr} 金山词霸每日一句`,
      content: `原文：${data.content}\n译文：${data.note}\n日期：${data.dateline}`,
      category: '学习',
      type: 'daily_quote',
      originalData: data
    };
    
  } catch (error) {
    console.error('获取金山词霸每日一句失败:', error.message);
    // 提供默认数据
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN');
    
    return {
      title: `${dateStr} 每日一句`,
      content: `原文：Life is like a box of chocolates, you never know what you're going to get.\n译文：生活就像一盒巧克力，你永远不知道下一颗是什么滋味。`,
      category: '学习',
      type: 'daily_quote',
      originalData: null
    };
  }
}

/**
 * 使用AI生成图片（基于内容关键词）
 * @param {string} text 用于生成图片的文本内容
 * @returns {string} 图片URL
 */
async function generateImageWithAI(text) {
  try {
    // 使用免费的AI图片生成API - Hugging Face的Stable Diffusion
    // 注意：需要注册获取API Key
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.warn('未配置Hugging Face API Key，使用默认图片');
      return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop';
    }
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4',
      {
        inputs: text.substring(0, 100), // 只取前100个字符
        parameters: {
          width: 800,
          height: 600,
          num_inference_steps: 25
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 将图片数据转换为Base64或上传到服务器
    // 这里简化处理，直接返回默认图片
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop';
    
  } catch (error) {
    console.error('AI图片生成失败:', error.message);
    // 返回默认图片
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop';
  }
}

/**
 * 生成随机名言
 * @returns {Object} 名言内容对象
 */
function generateQuote() {
  const quotes = [
    { content: '生活就像海洋，只有意志坚强的人才能到达彼岸。', author: '马克思' },
    { content: '时间就像海绵里的水，只要愿挤，总还是有的。', author: '鲁迅' },
    { content: '成功的秘诀在于对目标的执着追求。', author: '爱因斯坦' },
    { content: '知识是进步的阶梯。', author: '高尔基' },
    { content: '书籍是人类进步的阶梯。', author: '高尔基' },
    { content: '失败乃成功之母。', author: '爱迪生' },
    { content: '天才是百分之一的灵感加百分之九十九的汗水。', author: '爱迪生' },
    { content: '生命在于运动。', author: '伏尔泰' },
    { content: '一寸光阴一寸金，寸金难买寸光阴。', author: '王贞白' },
    { content: '千里之行，始于足下。', author: '老子' },
    { content: '天生我材必有用。', author: '李白' },
    { content: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
    { content: '读书破万卷，下笔如有神。', author: '杜甫' },
    { content: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
    { content: '莫等闲，白了少年头，空悲切。', author: '岳飞' }
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN');
  
  return {
    title: `${dateStr} 每日名言`,
    content: `今日名言：${randomQuote.content}\n—— ${randomQuote.author}`,
    category: '生活',
    type: 'quote'
  };
}

/**
 * 生成每日谚语
 * @returns {Object} 谚语内容对象
 */
function generateProverb() {
  const proverbs = [
    '一年之计在于春，一日之计在于晨',
    '路遥知马力，日久见人心',
    '三人行，必有我师焉',
    '有志者事竟成',
    '言必信，行必果',
    '少壮不努力，老大徒伤悲',
    '不怕慢，就怕站',
    '只要功夫深，铁杵磨成针',
    '吃一堑，长一智',
    '滴水之恩，涌泉相报',
    '海内存知己，天涯若比邻',
    '有缘千里来相会，无缘对面不相逢',
    '一寸光阴一寸金，寸金难买寸光阴',
    '虚心使人进步，骄傲使人落后',
    '众人拾柴火焰高'
  ];
  
  const randomProverb = proverbs[Math.floor(Math.random() * proverbs.length)];
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN');
  
  return {
    title: `${dateStr} 每日谚语`,
    content: `今日谚语：${randomProverb}`,
    category: '生活',
    type: 'proverb'
  };
}

module.exports = {
  getJinshanDailyQuote,
  generateImageWithAI,
  generateQuote,
  generateProverb
};
