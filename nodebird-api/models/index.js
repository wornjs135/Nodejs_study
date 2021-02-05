const Sequelize = require('sequelize');
//NODE_ENV를 설정안하면 기본값은 development
const env = process.env.NODE_ENV || 'development';
//기본으로는 config.json의 development에 해당하는 객체를 불러오는거임
//NODE_ENV를 따로 설정해주면 설정값에 맞게 config.json에서 객체를 불러옴
const config = require('../config/config')[env];
const User = require('./user');
const Post = require('./post');
const Hashtag = require('./hashtag');
const Domain = require('./domain');

const db = {};
//연결 객체 생성
const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.User = User;
db.Post = Post;
db.Hashtag = Hashtag;
db.Domain = Domain;

//연결객체로 모델이랑 mySQL이랑 연결해주기
User.init(sequelize);
Post.init(sequelize);
Hashtag.init(sequelize);
Domain.init(sequelize);

//관계 설정 메서드 실행
//사용자-게시글 1:n, 게시글-해시태그 n:m, 사용자-사용자(팔로잉팔로워) n:m
User.associate(db);
Post.associate(db);
Hashtag.associate(db);
Domain.associate(db);

module.exports = db;