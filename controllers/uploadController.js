const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const { PassThrough } = require('stream');

// 确保从当前目录的.env文件加载环境变量
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// 配置 Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // 启用HTTPS
});

// 配置multer使用内存存储，并增加文件大小限制
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB文件大小限制
        files: 10 // 最多10个文件
    }
});

// 根据功能类型确定存储文件夹
const getFolder = (funcType) => {
    switch(funcType) {
        case 'avatar':
            return 'avatars';
        case 'post':
            return 'posts';
        case 'product':
            return 'products';
        case 'banner':
            return 'banners';
        case 'announcement':
            return 'announcements';
        default:
            return 'uploads';
    }
};

// 将中文转换为拼音或英文
const transliterate = (str) => {
    // 中文字符范围
    const chineseRegex = /[\u4e00-\u9fa5]/g;
    
    if (!chineseRegex.test(str)) {
        return str;
    }
    
    // 简单的中文到拼音映射（常用词）
    const translationMap = {
        '测试': 'test',
        '中文': 'chinese',
        '文件': 'file',
        '图片': 'image',
        '头像': 'avatar',
        '帖子': 'post',
        '商品': 'product',
        '广告': 'banner',
        '公告': 'announcement'
    };
    
    let result = str;
    for (const [CN, EN] of Object.entries(translationMap)) {
        result = result.replace(new RegExp(CN, 'g'), EN);
    }
    
    // 移除非打印字符和特殊字符，保留字母、数字、中文和基本符号
    result = result.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '');
    
    return result;
};

// 生成安全的 public_id
const generateSafePublicId = (originalname, uniqueSuffix) => {
    // 获取文件扩展名
    const ext = path.extname(originalname);
    const basename = path.basename(originalname, ext);
    
    // 将中文转换为拼音
    const safeBasename = transliterate(basename);
    
    // 使用时间戳和随机数确保唯一性
    return `file_${uniqueSuffix}`;
};

// 上传文件到 Cloudinary
const uploadToCloudinary = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: options.folder,
                public_id: options.publicId,
                transformation: options.transformation || []
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        // 将 buffer 转换为流并上传
        const passThrough = new PassThrough();
        passThrough.end(buffer);
        passThrough.pipe(uploadStream);
    });
};

// 单个文件上传
const uploadSingleFile = async (req, res) => {
    console.log('Received single file upload request');
    
    // 检查文件是否存在
    if (!req.file) {
        return res.status(400).json({
            code: 400,
            message: '没有文件上传'
        });
    }
    
    // 记录文件信息
    console.log('File:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size
    });
    
    // 获取功能类型参数
    const funcType = req.body.funcType || req.query.funcType || '';
    const folder = getFolder(funcType);
    
    // 生成唯一的文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    try {
        // 上传到 Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: folder,
            publicId: generateSafePublicId(req.file.originalname, uniqueSuffix)
        });
        
        console.log('Cloudinary upload successful:', result.public_id);
        
        res.status(200).json({
            code: 200,
            message: '文件上传成功',
            data: {
                filename: req.file.originalname,
                url: result.secure_url,
                preview_url: result.secure_url,
                size: result.bytes,
                mimetype: req.file.mimetype,
                folder: folder,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                resource_type: result.resource_type
            }
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({
            code: 500,
            message: '文件上传失败',
            error: error.message
        });
    }
};

// 多个文件上传
const uploadMultipleFiles = async (req, res) => {
    console.log('Received multiple files upload request');
    
    // 检查文件是否存在
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            code: 400,
            message: '没有文件上传'
        });
    }
    
    // 记录文件信息
    console.log('Files count:', req.files.length);
    req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size
        });
    });
    
    // 获取功能类型参数
    const funcType = req.body.funcType || req.query.funcType || '';
    const folder = getFolder(funcType);
    
    try {
        // 使用 Promise.all 处理所有文件上传
        const uploadPromises = req.files.map(async (file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            
            const result = await uploadToCloudinary(file.buffer, {
                folder: folder,
                publicId: generateSafePublicId(file.originalname, uniqueSuffix)
            });
            
            return {
                filename: file.originalname,
                url: result.secure_url,
                preview_url: result.secure_url,
                size: result.bytes,
                mimetype: file.mimetype,
                folder: folder,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                resource_type: result.resource_type
            };
        });
        
        const results = await Promise.all(uploadPromises);
        
        console.log('All files uploaded successfully');
        
        res.status(200).json({
            code: 200,
            message: '所有文件上传成功',
            data: { files: results }
        });
    } catch (error) {
        console.error('Multiple files upload failed:', error);
        res.status(500).json({
            code: 500,
            message: '文件上传失败',
            error: error.message
        });
    }
};

module.exports = {
    upload,
    uploadSingleFile,
    uploadMultipleFiles
};
