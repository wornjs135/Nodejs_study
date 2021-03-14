const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const rooms = await Room.find({});
        res.render('main', { rooms, title: 'GIF 채팅방' });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/room', (req, res) => {
    res.render('room', { title: 'GIF 채팅방 생성' });
});

router.post('/room', async (req, res, next) => {
    try {
        const newRoom = await Room.create({
            title: req.body.title,
            max: req.body.max,
            //방장 색으로 구별.
            owner: req.session.color,
            password: req.body.password,
        });
        //라우터에서 io객체 사용.
        const io = req.app.get('io');
        //room 네임스페이스 안에 있는 사람들한테 새 방에 대한 정보가 전달.
        io.of('/room').emit('newRoom', newRoom);
        //방으로 입장.
        res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/room/:id', async (req, res, next) => {
    try {
        const room = await Room.findOne({ _id: req.params.id });
        const io = req.app.get('io');
        if (!room) {
            return res.redirect('/?error=존재하지 않는 방입니다.');
        }
        if (room.password && room.password !== req.query.password) {
            return res.redirect('/?error=비밀번호가 틀렸습니다.');
        }
        const { rooms } = io.of('/chat').adapter;
        //rooms안에 방 목록들이 들어있음. req.param.id = 방 id, 이 안에 사용자들도 들어있음. .length하면 방안에 사람이 몇명인지.
        //io.of('/chat').adapter.rooms[방아이디].length
        if (rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
            return res.redirect('/?error=허용 인원이 초과하였습니다.');
        }
        //방에 입장 후 채팅목록 가져와서 보내주기.
        const chats = await Chat.find({ room: room._id }).sort('createdAt');
        return res.render('chat', {
            room,
            title: room.title,
            chats,
            user: req.session.color,
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.delete('/room/:id', async (req, res, next) => {
    try {
        //방삭제.
        await Room.remove({ _id: req.params.id });
        //채팅삭제. 선택사항.
        await Chat.remove({ room: req.params.id });
        res.send('ok');
        req.app.get('io').of('/room').emit('removeRoom', req.params.id);
        //setTimeout안하면 마지막으로 방에서 나간사람에게는 이벤트가 전달이 안됨.
        setTimeout(() => {
            req.app.get('io').of('/room').emit('removeRoom', req.params.id);
        }, 2000);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

//이 코드처럼 라우터를 안거치고 chat.html socket.js를 수정해서 바로 웹소켓만으로 채팅을 할 수 있음.
//socket.js에서 DB까지 처리하는 식으로.
//이 예제에서는 이론적인 측면에서 사용.
//실무에서 http라우터랑 웹소켓이랑 같이 쓰면 성능적으로 문제가 될 수 있음.
router.post('/room/:id/chat', async (req, res, next) => {
    try {
        const chat = await Chat.create({
           room: req.params.id,
           user: req.session.color,
           chat: req.body.chat,
        });
        //to안에 socket.id로 쓰면 특정인 한명에게만 전송.
        //req.app.get('io').broadcats.emit('chat', chat)하면 나를 제외한 모든사람에게 전송.
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
        res.send('ok');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

try {
    fs.readdirSync('uploads');
} catch (err) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads/');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/room/:id/gif', upload.single('gif'), async (req, res, next) => {
    try {
        const chat = await Chat.create({
            room: req.params.id,
            user: req.session.color,
            gif: req.file.filename,
        });
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
        res.send('ok');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;