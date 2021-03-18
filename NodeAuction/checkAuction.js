const { Op } = require('Sequelize');

const { Good, Auction, User, sequelize } = require('./models');
const schedule = require('node-schedule');

//서버껐다가 재시작하면 실행됨.
module.exports = async () => {
    console.log('checkAuction');
    const t = sequelize.transaction();
    try {
        //어제 시간보다 먼저 생성되었으니 낙찰처리 되어야 하는데 안된 애들 찾아서 낙찰처리.
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1); // 어제 시간
        const targets = await Good.findAll({
            where: {
                SoldId: null,
                createdAt: { [Op.lte]: yesterday },
            },
        });
        targets.forEach(async (target) => {
            const success = await Auction.findOne({
                where: { GoodId: target.id, transaction: t },
                order: [['bid', 'DESC']],
            });
            await Good.update({ SoldId: success.UserId }, { where: { id: target.id }, transaction: t });
            await User.update({
                money: sequelize.literal(`money - ${success.bid}`),
            }, {
                where: { id: success.UserId, transaction: t },
            });
        });
        t.commit();
        //어제시간 이후와 서버 다시 시작한 시간 사이에 경매 진행중인 상품들 찾아서 스케쥴잡으로 한번 더 등록해주기.
        //24시간 아직 안지난 애들.
        const unsold = await Good.findAll({
            where: {
                SoldId: null,
                createdAt: { [Op.gt]: yesterday },
            },
        });
        unsold.forEach((target) => {
            const end = new Date(unsold.createdAt);
            end.setDate(end.getDate() + 1);
            schedule.scheduleJob(end, async () => {
                const success = await Auction.findOne({
                    where: { GoodId: target.id, transaction: t },
                    order: [['bid', 'DESC']],
                });
                await Good.update({ SoldId: success.UserId }, { where: { id: target.id }, transaction: t });
                await User.update({
                    money: sequelize.literal(`money - ${success.bid}`),
                }, {
                    where: { id: success.UserId, transaction: t },
                });
            });

        });
    } catch (error) {
        t.rollback();
        console.error(error);
    }
};