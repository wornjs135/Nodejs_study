const request = require('supertest');
const {sequelize} = require('../models');
const app = require('../app');

//사전작업
//테스트가 실행되기 전에 DB 셋팅
beforeAll(async () => {
    await sequelize.sync();
});

describe('POST /join', () => {
    test('로그인 안 했으면 가입', (done) => {
        request(app)         //supertest에 app을 넣어주고 .post메소드 실행하면 app에서 post /auth/login을 한거같은 효과가 남
            .post('/auth/join')
            .send({  //바디에 데이터 담아서 보내는 효과
                email: 'rjeowornjs@naver.com',
                nick: 'jaekwon',
                password: '1234',
            })
            .expect('Location', '/')
            .expect(302, done);
    });
});

describe('POST /login', () => {
    //agent로 만들면 여러 테스트에 걸쳐서 그 상태가 계속 유지됨(한번 로그)
    const agent = request.agent(app);
    beforeEach((done) => {
        agent
            .post('/auth/login')
            .send({
                email: 'rjeowornjs@naver.com',
                password: '1234',
            })
            .end(done);
    });

    test('이미 로그인했으면 redirect /', (done) => {
        const message = encodeURIComponent('로그인한 상태입니다.');
        agent
            .post('/auth/join')
            .send({
                email: 'rjeowornjs@naver.com',
                nick: 'jaekwon',
                password: '1234',
            })
            .expect('Location', `/?error=${message}`)
            .expect(302, done);
    });
});

describe('POST /login', () => {
    test('가입되지 않은 회원', async (done) => {
        const message = encodeURIComponent('가입되지 않은 회원입니다.');
        request(app)
            .post('/auth/login')
            .send({
                email: 'Norjeowornjs@naver.com',
                password: '1234',
            })
            .expect('Location', `/?loginError=${message}`)
            .expect(302, done);
    });

    test('로그인 수행', async (done) => {
        request(app)
            .post('/auth/login')
            .send({
                email: 'rjeowornjs@naver.com',
                password: '1234',
            })
            .expect('Location', '/')
            .expect(302, done);
    });

    test('비밀번호 틀림', async (done) => {
        const message = encodeURIComponent('비밀번호가 일치하지 않습니다.');
        request(app)
            .post('/auth/login')
            .send({
                email: 'rjeowornjs@naver.com',
                password: 'wrong',
            })
            .expect('Location', `/?loginError=${message}`)
            .expect(302, done);
    });
});

describe('GET /logout', () => {
    test('로그인 되어있지 않으면 403', async (done) => {
        request(app)
            .get('/auth/logout')
            .expect(403, done);
    });

    const agent = request.agent(app);
    //agent로 로그인을 시킨 후
    //beforEach는 테스트가 여러개 있으면 각 테스트 전마다 실행됨.(afterEach도 있음.)
    beforeEach((done) => {
        agent
            .post('/auth/login')
            .send({
                email: 'rjeowornjs@naver.com',
                password: '1234',
            })
            .end(done);
    });

    //agent로 로그아웃 수행
    test('로그아웃 수행', async (done) => {
        const message = encodeURIComponent('비밀번호가 일치하지 않습니다.');
        agent
            .get('/auth/logout')
            .expect('Location', `/`)
            .expect(302, done);
    });
});

//마무리작업
//focce: true하면 테이블 새로 만들어짐(데이터 정리)
//before에서 force: true로 생성해도 됨.
afterAll(async () => {
    await sequelize.sync({force: true});
});