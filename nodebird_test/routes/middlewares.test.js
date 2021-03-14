const { isLoggedIn, isNotLoggedIn } = require('./middlewares');


describe('isLoggedIn', () => {
    //가짜 인수, 가짜 함수(jest.fn())를 만들어줌. 가짜를 만들어 주는 행위를 모킹이라고 함.
    const res = {
        status: jest.fn(() => res),
        send: jest.fn(),
    };
    const next = jest.fn();

    test('로그인되어 있으면 isLoggedIn이 next를 호출해야함.', () => {
        const req = {
            isAuthenticated: jest.fn(() => true),
        };
        //isLoggedIn을 실행시킴(req객체에 isAuthenticated가 true이므로 next함수가 실행될거라고 예상.)
        isLoggedIn(req, res, next);
        //next함수가 호출 됐는지 검사.
        expect(next).toBeCalledTimes(1);
    });

    test('로그인되어 있지 않으면 isLoggedIn이 에러를 응답해야함.', () => {
        const req = {
            isAuthenticated: jest.fn(() => false),
        };
        isLoggedIn(req, res, next);
        expect(res.status).toBeCalledWith(403);
        expect(res.send).toBeCalledWith('로그인 필요');
    });
});


describe('isNotLoggedIn', () => {
    const res = {
        status: jest.fn(() => res),
        send: jest.fn(),
        redirect: jest.fn(),
    };
    const next = jest.fn();

    test('로그인되어 있으면 isNotLoggedIn이 에러를 호출해야함.', () => {
        const req = {
            isAuthenticated: jest.fn(() => true),
        };
        const message = encodeURIComponent('로그인한 상태입니다.');
        isNotLoggedIn(req, res, next);
        expect(res.redirect).toBeCalledWith(`/?error=${message}`);
    });

    test('로그인되어 있지 않으면 isNotLoggedIn이 next를 호출해야함.', () => {
        const req = {
            isAuthenticated: jest.fn(() => false),
        };
        isNotLoggedIn(req, res, next);
        expect(next).toBeCalledTimes(1);
    });
});
