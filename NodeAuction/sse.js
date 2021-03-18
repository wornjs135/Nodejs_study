const SSE = require('sse');

//main.html의 const es = new EventSource('/see')가 실행되는 순간 서버로 연결되서 아래부분 실행.
module.exports = (server) => {
    const see = new SSE(server);
    see.on('connection', (client) => { //서버센트이벤트 연결
        setInterval(() => {
            client.send(Date.now().toString()); //sse도 웹소켓처럼 문자열만 보낼 수 있음.
        }, 1000);
    });
};