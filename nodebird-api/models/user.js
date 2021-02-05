const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            email: {
                type: Sequelize.STRING(40),
                allowNull: true,
                unique: true,
              },
              nick: {
                type: Sequelize.STRING(15),
                allowNull: false,
              },
              password: {
                //비밀번호가 해쉬화되면 100글자까지 늘어날 수 있어서 여유롭게 설정
                //로그인을 카카오id같은걸로 로그인하면 비밀번호가 없어도 될 경우를 대비해 allowNull true
                type: Sequelize.STRING(100),
                allowNull: true,
              },
              provider: {
                //로그인 제공:이 서비스에서 로그인(기본값) 혹은 카카오로 로그인
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'local',
              },
              snsId: {
                type: Sequelize.STRING(30),
                allowNull: true,
              },
            }, {
              sequelize,
              timestamps: true,
              underscored: false,
              modelName: 'User',
              tableName: 'users',
              paranoid: true,
              charset: 'utf8',
              collate: 'utf8_general_ci',
        });
    }

    static associate(db) {
        db.User.hasMany(db.Post);
        db.User.hasMany(db.Domain);
        db.User.belongsToMany(db.User, {
            foreignKey: 'followingId',
            as: 'Followers',
            through: 'Follow',
        });
        db.User.belongsToMany(db.User, {
            foreignKey: 'followerId',
            as: 'Followings',
            through: 'Follow',
        });
    }
};