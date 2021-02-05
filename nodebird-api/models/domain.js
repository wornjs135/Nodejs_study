//nodebird서비스랑 api서비스가 데이터베이스를 공유하기 때문에 테이블같은게 다르면 이상하니까
//nodebird서비스에도 domain모델을 만들어주는게 좋음
const Sequelize = require('sequelize');

module.exports = class Domain extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            host: {
                type: Sequelize.STRING(80),
                allowNull: false,
            },
            type: {
                type: Sequelize.ENUM('free', 'premium'),
                allowNull: false,
            },
            clientSecret: {
                type: Sequelize.UUID,
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: true,
            paranoid: true,
            modelName: 'Domain',
            tableName: 'domains',
        });
    }

    static associate(db) {
        db.Domain.belongsTo(db.User);
    }
};