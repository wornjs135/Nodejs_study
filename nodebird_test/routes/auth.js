const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.post('/join', isNotLoggedIn, async (req, res, next) => {
    //프론트에서 이메일 닉네임 비밀번호를 받아
    const { email, nick, password } = req.body;
    try {
        //검사: 기존에 있는 이메일로 가입하는지 검
        const exUser = await User.findOne({ where: { email } });
        if (exUser) {
            return res.redirect('/join?error=exist');
        }
        //신규이메일이면 회원가입 진행, 비밀번호를 비크립트 해쉬화, 12는 얼마나 복잡하게 해시할건지(숫자가 클수록 해킹 위험 적지만 오래걸)
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            email,
            nick,
            password: hash,
        });
        //유저를 생성하고 메인페이지로 돌려보
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        return next(error);
    }

});

/*프론트에서 post로 /auth/login으로 요청을 보내면 아래 미들웨어가 실행됨
authenticate가 실행되면 passport가 localStrategy를 찾으러 가서 done함수를 만나면 돌아옴.
localStrategy의 done함수의 세 인자랑 딱 맞음*/
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        //로그인 실패한 경우, 메세지를 담아서 프론트로 돌려줌
        if (!user) {
            return res.redirect(`/?loginError=${info.message}`);
        }
        /*로그인 성공한 경우, req.login에 인자로 사용자 객체를 넣어줌
        * req.login이 실행되면 passport/index.js로 가서 serializeUser가 실행*/
        //req.login의 기능은 세션 쿠키를 브라우저로 보내줌. 브라우저에 세션쿠키가 들어가있어서 다음 요청부터는 서버가 요청을 누가 보냈는 알 수 있게됨(즉 로그인 된 상태)
        return req.login(user, (loginError) => {
            if (loginError) {
                console.error((loginError));
            }
            //로그인 성공, 메인 페이지로 돌려
            return res.redirect('/');
        });
    })(req, res, next); //미들웨어 내의 미들웨어에는 (req, res, next)를 붙임.
});

router.get('/logout', isLoggedIn, (req, res) => {
    req.logout();  //실행되면 세션 쿠키가 사라짐
    req.session.destroy();
    req.redirect('/');
});

// passport.authenticate가 실행되면 카카오 페이지로 가서 로그인을 하게되고, 로그인을 성공하면 카카오가 /kakao/callback으로 요청을 하나 쏴줌
//그래서 다시 /kakao/callback의 authenticate가 실행되고 kakaoStrategy.js로 가서 함수부분 실행
router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    //카카오 로그인 실패하면면 실행
    failureRedirect: '/',
    //카카오 로그인 성공하면 실행
}), (req, res) => {
    res.redirect('/');
});

module.exports = router;