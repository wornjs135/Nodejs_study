const passport = require('passport');
//passport에서는 전략이라는 것을 사용
//로그인을 어떻게할지 로직을 적어놓은 파
const local = require('./localStrategy');
const kakao = require('/kakaoStrategy');
const User = require('../models/user');

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user.id)
        /*세션에 user.id의 저장, null,user로 user객체 전체를 저장해도 되지만 세션에 회원정보가 다 들어가면 메모리 낭비
        * 실무에서는 메모리에도 저장하면 안됨.(사용자가 엄청 많으면 터짐), 나중엔 메모리 저장용 DB를 따로 씀*/
    });

    //passport.session을 통해 알아낸 id값을 통해 user의 전체 정보를 복구
    //이 서비스에서 쓰이는 req.user는 여기서 생성되는 것.
    passport.deserializeUser((id, done) => {
        User.findOne(
            {
                where: {id},
                include: [{
                    model: User,
                    attributes: ['id', 'nick'],
                    as: 'Followers',
                }, {
                    model: User,
                    attributes: ['id', 'nick'],
                    as: 'Followings',
                }],
            })
            .then(user => done(null, user)) //req.user를 통해 로그인한 사람의 정보를 볼 수 있음
            .catch(err => done(err));
    });

    //strategy를 등록
    local();
    kakao();
};