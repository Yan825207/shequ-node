const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const COS = require('cos-nodejs-sdk-v5');

// 确保从当前目录的.env文件加载环境变量
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// 初始化腾讯云COS客户端
const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
    // 添加超时设置，避免长时间等待
    Timeout: 30000 // 30秒超时
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

// 单个文件上传
const uploadSingleFile = (req, res) => {
    console.log('Received single file upload request');
    
    // 检查文件是否存在
    if (!req.file) {
        return res.status(400).json({
            code: 400,
            message: 'No file uploaded'
        });
    }
    
    // 记录文件信息但不打印完整的buffer数据
    console.log('File:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size
    });
    
    // 获取功能类型参数，默认存储在根目录
    const funcType = req.body.funcType || req.query.funcType || '';
    
    // 根据功能类型确定存储文件夹
    let folder = '';
    switch(funcType) {
        case 'avatar':
            folder = 'avatars/';
            break;
        case 'post':
            folder = 'posts/';
            break;
        case 'product':
            folder = 'products/';
            break;
        case 'banner':
            folder = 'banners/';
            break;
        case 'announcement':
            folder = 'announcements/';
            break;
        default:
            folder = '';
    }
    
    // 生成唯一的文件名，处理中文文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // 生成安全的文件名（不包含特殊字符）
    const safeFilename = req.file.originalname.replace(/[\\/:"*?<>|]/g, '');
    // 使用原始文件名的基本名称加上唯一后缀和扩展名
    const filename = path.basename(safeFilename, path.extname(safeFilename)) + '-' + uniqueSuffix + path.extname(safeFilename);
    // 直接使用文件名，让COS SDK自己处理编码
    const cosKey = folder + filename;
    
    // 上传到腾讯云COS
    cos.putObject({
        Bucket: process.env.COS_BUCKET,
        Region: process.env.COS_REGION,
        Key: cosKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read', // 设置文件为公共读权限
        // 为大文件添加分块上传设置
        SliceSize: 1024 * 1024 * 5 // 5MB分块
    }, (err, data) => {
        if (err) {
            console.error('COS upload error:', err);
            return res.status(500).json({
                code: 500,
                message: 'File upload failed',
                error: err.message
            });
        }
        
        // 构建COS文件URL，只对文件名部分进行编码，保持路径分隔符
        const fileUrl = `${process.env.COS_BASE_URL}/${folder}${encodeURIComponent(filename)}`;
        
        res.status(200).json({
            code: 200,
            message: 'File uploaded successfully',
            data: {
                filename: filename,
                originalname: req.file.originalname,
                url: fileUrl,
                preview_url: fileUrl,
                size: req.file.size,
                mimetype: req.file.mimetype,
                folder: folder
            }
        });
    });
};

// 处理中文文件名的函数
const handleChineseFilename = (filename) => {
    // 移除文件名中的特殊字符
    const cleanedFilename = filename.replace(/[\\/:"*?<>|]/g, '');
    // 使用URL编码处理整个文件名
    return encodeURIComponent(cleanedFilename);
};

// 多个文件上传
const uploadMultipleFiles = (req, res) => {
    console.log('Received multiple files upload request');
    
    // 检查文件是否存在
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            code: 400,
            message: 'No files uploaded'
        });
    }
    
    // 记录文件信息但不打印完整的buffer数据
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
    
    // 获取功能类型参数，默认存储在根目录
    const funcType = req.body.funcType || req.query.funcType || '';
    
    // 根据功能类型确定存储文件夹
    let folder = '';
    switch(funcType) {
        case 'avatar':
            folder = 'avatars/';
            break;
        case 'post':
            folder = 'posts/';
            break;
        case 'product':
            folder = 'products/';
            break;
        case 'banner':
            folder = 'banners/';
            break;
        case 'announcement':
            folder = 'announcements/';
            break;
        default:
            folder = '';
    }
    
    // 使用Promise.all来处理所有文件上传，确保所有文件上传完成后再发送响应
    const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
            // 生成唯一的文件名，处理中文文件名
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            // 生成安全的文件名（不包含特殊字符）
            const safeFilename = file.originalname.replace(/[\/:"*?<>|]/g, '');
            // 使用原始文件名的基本名称加上唯一后缀和扩展名
            const filename = path.basename(safeFilename, path.extname(safeFilename)) + '-' + uniqueSuffix + path.extname(safeFilename);
            // 直接使用文件名，让COS SDK自己处理编码
            const cosKey = folder + filename;
            
            // 上传到腾讯云COS
            cos.putObject({
                Bucket: process.env.COS_BUCKET,
                Region: process.env.COS_REGION,
                Key: cosKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read', // 设置文件为公共读权限
                // 为大文件添加分块上传设置
                SliceSize: 1024 * 1024 * 5 // 5MB分块
            }, (err, data) => {
                if (err) {
                    console.error(`File upload failed (${file.originalname}):`, err);
                    reject(err);
                } else {
                    // 构建COS文件URL，只对文件名部分进行编码，保持路径分隔符
                    const fileUrl = `${process.env.COS_BASE_URL}/${folder}${encodeURIComponent(filename)}`;
                    resolve({
                        filename: filename, // 显示原始文件名（不包含特殊字符）
                        originalname: file.originalname, // 显示原始中文文件名
                        url: fileUrl,
                        preview_url: fileUrl,
                        size: file.size,
                        mimetype: file.mimetype,
                        folder: folder
                    });
                }
            });
        });
    });
    
    // 处理所有上传结果
    Promise.all(uploadPromises)
        .then(results => {
            res.status(200).json({
                code: 200,
                message: 'Files uploaded successfully',
                data: { files: results }
            });
        })
        .catch(err => {
            console.error('Multiple files upload failed:', err);
            res.status(500).json({
                code: 500,
                message: 'Files upload failed',
                error: err.message
            });
        });
};

module.exports = {
    upload,
    uploadSingleFile,
    uploadMultipleFiles
};