const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/**
 * @route GET /api/favorites
 * @desc 获取当前用户的收藏列表
 * @access Private
 */
router.get('/', protect, async (req, res) => {
    try {
        // 获取当前用户的收藏列表，包含帖子详情和作者信息
        const favorites = await Favorite.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Post,
                    include: [
                        {
                            model: User,
                            as: 'author',
                            attributes: ['id', 'username', 'avatar']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 转换为前端需要的格式
        const favoritePosts = favorites.map(favorite => {
            const post = favorite.Post;
            return {
                id: post.id,
                title: post.title,
                content: post.content,
                images: post.images,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                author: {
                    id: post.author.id,
                    username: post.author.username,
                    avatar: post.author.avatar
                },
                likes_count: post.likes_count || 0,
                commentCount: post.commentCount || 0,
                isLiked: false, // 收藏接口不返回点赞状态
                isFavorite: true
            };
        });

        res.json(favoritePosts);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * @route POST /api/favorites/:postId
 * @desc 收藏帖子
 * @access Private
 */
router.post('/:postId', protect, async (req, res) => {
    try {
        const { postId } = req.params;

        // 检查帖子是否存在
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: '帖子不存在' });
        }

        // 检查是否已经收藏
        const existingFavorite = await Favorite.findOne({
            where: {
                userId: req.user.id,
                postId: postId
            }
        });

        if (existingFavorite) {
            return res.status(400).json({ message: '已经收藏过该帖子' });
        }

        // 创建收藏记录
        await Favorite.create({
            userId: req.user.id,
            postId: postId
        });

        res.json({ message: '收藏成功' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * @route DELETE /api/favorites/:postId
 * @desc 取消收藏帖子
 * @access Private
 */
router.delete('/:postId', protect, async (req, res) => {
    try {
        const { postId } = req.params;

        // 查找并删除收藏记录
        const result = await Favorite.destroy({
            where: {
                userId: req.user.id,
                postId: postId
            }
        });

        if (result === 0) {
            return res.status(404).json({ message: '未收藏该帖子' });
        }

        res.json({ message: '取消收藏成功' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;