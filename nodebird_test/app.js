const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');

//dotenv.config는 최대한 위에
dotenv.config();
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');
const passportConfig = require('./passport')

const app = express();
/*process.env.PORT는 나중에 배포할때는 80(http)이나 443(https)을 쓰는데 개발할 때는 8081포트를 쓰다가
배포할때는 .env파일에서 PORT=80 이런식으로 넣어줄거임.(배포때, 개발때 포트를 다르게 사용하기 위해서
이렇게 표현함)*/
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});
/*sequelize.sync는 프로미스이기 때문에 then,catch 붙여주면 좋음.
models폴더의 파일에서 모델(테이블)정의한걸 수정하면 테이블을 수동으로 수정해줘야함.
옵션-force:true를 하면 테이블이 지워졌다가 다시 생성됨.(데이터들이 다 날라가므로 조심)
alter:true는 데이터를 유지하고 컬럼 변경한걸 반영하고싶을 때(가끔 컬럼이랑 기존 데이터랑 안맞아서 에러나는 경우가 있음)
기본값을 주거나 직접 수정하거나 force옵션(실무에서는 하면 큰일)을 사용하여 해결
 */
sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });
//passport폴더의 index.js의 함수 실행해서 passport연결 해주기
passportConfig();

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));
//express 세션보다 아래 있어야함. 라우터들보다는 위에
//로그인 후에 그 다음 요청부터 passport.session이 실행될 때 passport/index.js의 deserializeUser가 실행
//passport.session에서는 세션 쿠키를 통해 id값을 알아내고 deserializeUser로 id 값을 넘겨줌
app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);

//404처리 미들웨어
app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

//에러처리 미들웨어
//res.locals.ㅇㅇㅇ는 템플릿 엔진에서 변수
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    //개발모드일때는 에러 상세내역(스택,메세지) 보이게, 배포모드일때는 안보여주게(보안상)
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

//app.js를 supertest 하기 위해 listen을 따로 빼줌(server.js에)
//listen이 여기 있으면 테스트 중에 실제로 서버가 돌아가버리니깐
//module.exports = app;
app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
});