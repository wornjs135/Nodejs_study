const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

//로그인 여부 판단하는 미들웨어를 직접 만듬
exports.isLoggedIn = (req, res, next) => {
    //req.isAuthenticated는 로그인 되있으면 true,아니면 false
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send('로그인 필요');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        const message = encodeURIComponent('로그인한 상태입니다.');
        res.redirect(`/?error=${message}`);
    }
};

exports.verifyToken = (req, res, next) => {
    try {
        //headers.authorization과 JWT키를 넣어 verify(검증)를 하면 req.decoded에 페이로드(데이터)부분이 담김
        //verify에서 오류가 나면 에러처리로 넘어감
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    } catch (error) {
        //유효기간 초과
        if (error.name === 'TokenExpiredError') {
            return res.status(419).json({
                code: 419,
                message: '토큰이 만료되었습니다.',
            });
        }
        return res.status(401).json({
            code: 401,
            message: '유효하지 않은 토큰입니다.'
        });
    }
}

//사용량 제한 미들웨어
exports.apiLimiter = new RateLimit({
    widowMs: 60 * 1000,  //1분간
    max: 1, //1번
    delayMs: 0, //요청간 간격 시간
    handler(req, res) { //제한 초과시 콜백 함수
        res.status(this.statusCode).json({
            code: this.statusCode, //상태코드 429
            message: '1분에 한번만 요청할 수 있습니다.'
        });
    }
});

//사용하면 안되는 라우터에 붙여서 경고
exports.deprecated = (req, res) => {
    res.status(410).json({
        code: 410,
        message: '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.',
    });
};