//다른 클라이언트에서 요청을 보내면 그 요청을 처리하는 라우터
//버전1이라는 뜻

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Hashtag, Post } = require('../models');

const router = express.Router();
//cors 에러 해결하기 위해 추가, api제공하고싶은 라우터에만 등록해줘도 됌.
//origin으로 localhost:4000만 허용하게, credentials로 쿠키까지 주고받고
//origin: ture로 하면 보내는 쪽의 주소가 자동으로 헤더에 들어감.
//실무에서는 전체 라우터에 달아주는게 아니라 개별 라우터마다 다르게 적용하는게 좋음.
router.use(async (req, res, next) => {
    //가입된 도메인인지 검사
    const domain = await Domain.findOne({
        where: { host: url.parse(req.get('origin'))?.host }  //옵셔널 체이닝 연산
    });
    //가입된 도메인이면 cors 에러 피할 수 있게
    if (domain) {
        cors({
            origin: true,
            credentials: true,
        })(req, res, next);
    } else {
        next();
    }
});

//사용량 제한 기능
router.use(apiLimiter);

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