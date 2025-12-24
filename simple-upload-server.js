const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// 确保uploads目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
}

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 配置静态文件服务
app.use('/uploads', express.static(uploadDir));

// 单个文件上传接口
app.post('/api/v1/upload/single', upload.single('file'), (req, res) => {
    console.log('Received single file upload request');
    console.log('File:', req.file);
    
    if (!req.file) {
        return res.status(400).json({
            code: 400,
            message: 'No file uploaded'
        });
    }
    
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    
    res.status(200).json({
        code: 200,
        message: 'File uploaded successfully',
        data: {
            filename: req.file.filename,
            url: fileUrl,
            size: req.file.size,
            mimetype: req.file.mimetype
        }
    });
});

// 多个文件上传接口
app.post('/api/v1/upload/multiple', upload.array('files', 10), (req, res) => {
    console.log('Received multiple files upload request');
    console.log('Files:', req.files);
    
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            code: 400,
            message: 'No files uploaded'
        });
    }
    
    const files = req.files.map(file => ({
        filename: file.filename,
        url: `http://localhost:${PORT}/uploads/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
    }));
    
    res.status(200).json({
        code: 200,
        message: 'Files uploaded successfully',
        data: { files }
    });
});

// 健康检查接口
app.get('/', (req, res) => {
    res.json({
        code: 200,
        message: 'File upload server is running'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        code: 500,
        message: 'Internal server error',
        error: err.message
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`File upload server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/`);
    console.log(`Single file upload: POST http://localhost:${PORT}/api/v1/upload/single`);
    console.log(`Multiple files upload: POST http://localhost:${PORT}/api/v1/upload/multiple`);
});