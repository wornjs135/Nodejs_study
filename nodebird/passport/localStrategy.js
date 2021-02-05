const passport = require('/passport');
const LocalStrategy = require('/passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
    passport.use(new LocalStrategy({
        usernameField: 'email', //req.body.email
        passwordField: 'password', //req.body.password
    }, async (email, password, done) => {
        try {
            //이메일 존재하는지 검
            const exUser = await User.findOne({ where: { email } });사
            //이메일 있으면
            if (exUser) {
                //요청으로 받은 비밀번호랑 해쉬화된 비밀번호교(db에 있는 비밀번호)랑 비교(겳과값은 true/false)
                //done함수가 호출되면 auth.js의 passport.authenticate로 돌아감
                const result = await bcrypt.compare(password, exUser.password);
                if (result) {
                    done(null, exUser);
                } else {
                    done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
                }
            } else {
                done(null, false, { message: '가입되지 않은 회원입니다.' });
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};
