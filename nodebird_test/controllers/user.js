const User = require('../models/user');

exports.addFollowing = async (req, res, next) => {
    try {
        //자신의 대한 객체를 찾고
        const user = await User.findOne({where: {id: req.user.id}});
        if (user) {
            //model의 관계 설정해줄때 나오는 메소드(팔로잉 추가 하는 메소드)
            //수정하는 메소드는 setFollowings(set메소드는 기존 데이터를 통째로 바꾸기 때문에 주의.)
            //배열로 여러명 동시 등록 가능 [1,2,3,4,..]
            await user.addFollowings([parseInt(req.params.id, 10)]);
            res.send('success');
        } else {
            res.status(404).send('no user');
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
}