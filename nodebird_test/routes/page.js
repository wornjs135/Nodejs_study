const express = require('express');
const { Post, User, Hashtag } = require('../models')

const router = express.Router();

//팔로워,팔로잉 구현할 때 쓸 부분
router.use((req, res, next) => {
    //render 할 때 필요한 user변수를 아래의 라우터들에 한번에 넣어주기
    res.locals.user = req.user;
    res.locals.followerCount = req.user ? req.user.Followers.length : 0;
    res.locals.followingCount = req.user ? req.user.Followings : 0;
    res.locals.followingIdList = req.user ? req.user.Followings.map(f => f.id) : [];
    next();
  });

//profile 페이지 보여줌
router.get('/profile', (req, res) => {
    res.render('profile', { title: '내 정보 - NodeBird' });
});

//join 페이지 보여줌
router.get('/join', (req, res) => {
    res.render('join', { title:  '회원가입 - NodeBird' });
})

//main 페이지 보여줌
router.get('/', async (req, res, next) => {
    //twits=메인 게시글
    try {
        const posts = await Post.findAll({
            include: {
                model: User,
                attributes: ['id', 'nick'],
            },
            order: [['createdAt', 'DESC']],
        });
        res.render('main', {
            title: 'NodeBird',
            twits: posts,
        });
    } catch (error) {
        console.error(error);
        next(err);
    }
});

//해시태그 검색
// GET /hashtag?hashtag=노드
router.get('/', async (req, res, next) => {
    const query = req.query.hashtag;
    //해시태그 검색인데 내용이 없으면 메인페이지
    if (!query) {
        return res.redirect('/');
    }
    try {
        //해시태그 검색
        const hashtag = await Hashtag.findOne({ where: { title: query } });
        let posts = [];
        //있으면 해시태그에 딸린 포스트들을 가져와라 (게시글의 작성자까지 가져옴,id랑 닉네임만(보안상))
        if (hashtag) {
            posts = await hashtag.getPosts({ include: [{ model: User, attributes: ['id', 'nick'] }] });
        }

        return res.render('main', {
            title: `${query} 검색 결과 | NodeBird`,
            twits: posts,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;