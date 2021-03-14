//로그인 여부 판단하는 미들웨어를 직접 만
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