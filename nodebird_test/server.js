const app = require('./app');

//supertest 동안 서버 실행을 위해 따로 빼줌.
app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
});