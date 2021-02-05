//다른 클라이언트에서 요청을 보내면 그 요청을 처리하는 라우터
//버전1이라는 뜻

const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken, deprecated } = require('./middlewares');
const { Domain, User, Hashtag, Post } = require('../models');

const router = express.Router();

//라우터를 사용하지 말라고 하고 싶을때 deprecated를 라우터에 장착해 주면 됨
//라우터 전체에 적용하고 싶으면 아래처럼 라우터들 위에다가 use로 달아주면 됨
router.use(deprecated);

router.post('/token', async (req, res) => {
    const { clientSecret } = req.body;
    try {
        //도메인 등록했나 검사
        const domain = await Domain.findOne({
            where: { clientSecret },
            include: {
                model: User,
                attribute: ['nick', 'id'],
            },
        });
        if (!domain) {
            return res.status(401).json({
                code: 401,
                message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
            });
        }
        //토큰 발급
        const token = jwt.sign({
            id: domain.User.id,
            nick: domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '1m', // 1분
            issuer: 'nodebird',
        });
        return res.json({
            code: 200,
            message: '토큰이 발급되었습니다',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

//테스트 페이지
router.get('/test', verifyToken, (req, res) => {
    res.json(req.decoded);
});

//자기 자신의 정보를 가져올수 있게 해주는 페이지
router.get('/posts/my', verifyToken, (req, res) => {
    Post.findAll({ where: {userId: req.decoded.id} })
        .then((posts) => {
            res.json({
                code: 200,
                payload: posts,
            })
        })
        .catch((error) => {
            console.error(error);
            return res.status(500).json({
                code: 500,
                message: '서버 에러',
            });
        });
});

//해시태그로 검색하는 api를 제공하는 라우터
router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
    try {
        const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
        if (!hashtag) {
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다.'
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code: 200,
            payload: posts,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러,'
        });
    }
});


module.exports = router;