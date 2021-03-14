// //npm i ws (웹소켓 모듈 설치)
// const WebSocket = require('ws');
//
// //익스프레스 서버랑 웹소켓 서버랑 연결시켜줌
// module.exports = (server) => {
//     const wss = new WebSocket.Server({ server });
//
//     wss.on('connection', (ws, req) => { // 웹소켓 연결 시 실행(프론트에서 연결 요청하면 바로)
//         //클라이언트 ip 파악, remoteAddress만으로도 알아낼 수 있지만 프록시서버에서 요청 올 경우를 대비해 x-forwarded 이거 씀.(100퍼 정확하진 않음)
//         //express의 req라면 req.ip로도 가져올 수 있음.
//         const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//         console.log('새로운 클라이언트 접속', ip);
//         //이벤트리스너
//         ws.on('message', (message) => { // 클라이언트가 메시지 보냈을 때
//             console.log(message);
//         });
//         ws.on('error', (error) => { // 에러 시
//             console.error(error);
//         });
//         ws.on('close', () => { // 연결 종료 시
//             console.log('클라이언트 접속 해제', ip);
//             //연결이 끊기면 3초마다 보내는 것도 종료.
//             clearInterval(ws.interval);
//         });
//
//         ws.interval = setInterval(() => { // 3초마다 클라이언트로 메시지 전송
//             //클라이언트랑 서버랑 연결된 상태에서 실행. (안전장치)
//             if (ws.readyState === ws.OPEN) {
//                 ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
//             }
//         }, 3000);
//     });
// };


// npm i socket.io  채팅기능 만들때 용이
// const SocketIO = require('socket.io');
//
// module.exports = (server) => {
//     //path는 프론트랑 일치시켜줘야함.
//     const io = SocketIO(server, { path: '/socket.io' });
//
//     io.on('connection', (socket) => { // 웹소켓 연결 시
//         //request는 소켓안에 들어있음.
//         const req = socket.request;
//         const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//         //socket.id: 어떤사람이 웹소켓 연결했을때 고유한 id가 부여됨.
//         console.log('새로운 클라이언트 접속!', ip, socket.id, req.ip);
//         socket.on('disconnect', () => { // 연결 종료 시
//             console.log('클라이언트 접속 해제', ip, socket.id);
//             clearInterval(socket.interval);
//         });
//         socket.on('error', (error) => { // 에러 시
//             console.error(error);
//         });
//         socket.on('reply', (data) => { // 클라이언트로부터 메시지
//             console.log(data);
//         });
//         socket.interval = setInterval(() => { // 3초마다 클라이언트로 메시지 전송
//             socket.emit('news', 'Hello Socket.IO');
//         }, 3000);
//     });
// };

const SocketIO = require('socket.io');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const cookie = require('cookie-signature');

module.exports = (server, app, sessionMiddleware) => {
    const io = SocketIO(server, {path: '/socket.io'});
    //app.set은 익스프레스의 변수처럼 사용.
    //req.app.get('io') 라우터에서 socket.io의 io객체를 사용할 수 있음
    //라우터랑 소켓io랑 연결
    app.set('io', io);
    //네임스페이스 구분
    const room = io.of('/room');
    const chat = io.of('/chat');

    //socket.request에 session을 사용할 수 있게 미들웨어 장착.
    //socket.request.res가 소켓io에서 res에 접근하는 방법임. 버전에 따라서 res가 undefined로 뜰 수 있어서 빈객체 넣어줌.
    //이렇게 장착해주면 socket.request에서 쿠키랑 세션 사용 가능.
    // io.use((socket, next) => {
    //     cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res || {}, next);
    //     sessionMiddleware(socket.request, socket.request.res || {}, next);
    // });
    //socket.io가 3버전 이상인 경우에는 아래처럼 쿠키랑 세션 미들웨어 연결.
    const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
    chat.use(wrap(cookieParser(process.env.COOKIE_SECRET)));
    chat.use(wrap(sessionMiddleware));

    room.on('connection', (socket) => {
        console.log('room 네임스페이스에 접속');
        socket.on('disconnect', () => {
            console.log('room 네임스페이스 접속 해제');
        });
    });

    chat.on('connection', (socket) => {
        console.log('chat 네임스페이스에 접속');
        const req = socket.request;
        const {headers: {referer}} = req;
        //주소에서 roomId 추출
        const roomId = referer
            .split('/')[referer.split('/').length - 1]
            .replace(/\?.+/, '');
        //웹소켓에서 자동으로 같은 roomId에 있는 사람들끼리 채팅 주고받을 수 있게 해줌.
        socket.join(roomId);
        socket.to(roomId).emit('join', {
            user: 'system',
            chat: `${req.session.color}님이 입장하셨습니다.`,
        });

        socket.on('disconnect', () => {
            console.log('chat 네임스페이스 접속 해제');
            socket.leave(roomId);
//            const currentRoom = socket.adapter.rooms[roomId];
//            const userCount = currentRoom ? currentRoom.length : 0;
//          socket.io 3버전 이후부터는 socket.adapter.rooms가 map object로 되어있음. 값은 set object. 위는 2버전
            const currentRoom = socket.adapter.rooms.get(roomId);
            const userCount = currentRoom ? currentRoom.size : 0;
            if (userCount === 0) { // 유저가 0명이면 방 삭제
                //서버에서 서버로 요청을 보내면, 세션쿠키가 자동으로 안넣어져서 누가 보낸 요청인지 판단을 못함.(브라우저에서는 브라우저가 자동으로 넣어줘서 판단 가능)
                //그래서 직접 넣어줘야함. 서명된 쿠키=req.signedCookies['connect.sid']
                //얘(이미 서명이 풀려있음)를 다시 서명을 해서 헤더에 넣어줘야함. 그래야 delete요청을 보낸 사람이 누군지 서버가 알수있음.
                const signedCookie = cookie.sign(req.signedCookies['connect.sid'], process.env.COOKIE_SECRET);
                const connectSID = `${signedCookie}`;
                axios.delete(`http://localhost:8005/room/${roomId}`, {
                    headers: {
                        Cookie: `connect.sid=s%3A${connectSID}`
                    }
                })
                    .then(() => {
                        console.log('방 제거 요청 성공');
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            } else {
                socket.to(roomId).emit('exit', {
                    user: 'system',
                    chat: `${req.session.color}님이 퇴장하셨습니다.`,
                });
            }
        });
    });
};