const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models/');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

//uploads폴더 만들어주기
try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어서 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

//multer 설정
const upload = multer({
    //uploads폴더에 이미지 업로드
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        //파일명의 중복을 막기 위해 업로드한 날짜를 파일명에 붙여줌
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

//이미지 업로드
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
    console.log(req.file);
    //이미지 url을 프론트로 보내줘서 게시글이랑 이미지를 엮어서 같이 가져오게 할 수 있게 이미지 url 알려주는 역할
    res.json({ url: `/img/${req.file.filename}` });
});

//게시글 등록
router.post('/', isLoggedIn, upload.none(), async (req,res, next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            UserId: req.user.id,
        });
        //해시태그 추출
        const hashtags = req.body.content.match(/#[^\s#]*/g); //정규표현식,#으로 시작해서 띄어쓰기랑 #이 아닌 애들 모두를 골라,배열이 아닌 셋으로 처리하면 중복이 사라져서 좋음
        if (hashtags) {
            //[#노드, #익스프레스]
            //slice실행되면 [노드, 익스프레스](#이 때짐)
            //[findOrCreate(노드), findOrCreate(익스프레스)]
            //[[해시태그, true],[해시태그, true]]  true는 create되면, find하면 false로 나옴, 해시태그는 해시태그 객체
            const result = await Promise.all(
                hashtags.map(tag => {
                    return Hashtag.findOrCreate({
                        where: { title: tag.slice(1).toLowerCase() },
                    })
                }),
            );
            console.log(result);
            await post.addHashtags(result.map(r => r[0]));  //배열의 첫번째인 해시태그 객체를 add해주기
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        next(error);
    }
})

module.exports = router;
