# 使用官方 Node.js 18 镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 创建 uploads 目录
RUN mkdir -p uploads

# 环境变量配置
ENV DB_NAME=shequ
ENV DB_USER=neondb_owner
ENV DB_PASSWORD=npg_lxN2uHQYSiZ5
ENV DB_HOST=ep-little-credit-a4ljft2f-pooler.us-east-1.aws.neon.tech
ENV DB_PORT=5432
ENV PORT=5000
ENV HOST=0.0.0.0
ENV JWT_SECRET=your_jwt_secret_key_here
ENV JWT_EXPIRES_IN=7d

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["node", "app.js"]