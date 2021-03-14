const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const ColorHash = require('color-hash');

dotenv.config();
const connect = require('./schemas');
const webSocket = require('./socket'); //웹소켓 불러오기
const indexRouter = require('./routes');

const app = express();
app.set('port', process.env.PORT || 8005);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});
//몽고디비 연결
connect();

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/gif', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionMiddleware = session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
});
app.use(sessionMiddleware);

//익명의 채팅방이라 사용자를 색깔로 구분하기 위한 미들웨어.
app.use((req, res, next) => {
    if (!req.session.color) {
        const colorHash = new ColorHash();
        //색을 부여해서 세션에 저장해두면 세션이 끝나기 전까지는 고유한 색상이 부여되어있음.
        //req.sessionID = 세션에 대한 고유값
        req.session.color = colorHash.hex(req.sessionID);
    }
    next();
});

app.use('/', indexRouter);

app.use((req, res, next) => {
   const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
   error.status = 404;
   next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

const server = app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
});

//익스프레스 서버랑 웹소켓 서버랑 연결
webSocket(server, app, sessionMiddleware);