const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            content: {
                type: Sequelize.STRING(140),
                allowNull: false,
              },
              //이렇게 하면 이미지를 한개밖에 못올림
              //여러게 올리고 싶으면 img테이블을 따로 생성해서 post와 1대다 관계를 맺어주면 됨.
              img: {
                type: Sequelize.STRING(200),
                allowNull: true,
              },
            }, {
              sequelize,
              timestamps: true,
              underscored: false,
              modelName: 'Post',
              tableName: 'posts',
              paranoid: false,
              charset: 'utf8mb4',
              collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.Post.belongsTo(db.User);
        db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
    }
};