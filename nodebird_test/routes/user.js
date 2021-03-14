const express = require('express');

const { isLoggedIn } = require('./middlewares');
const { addFollowing } = require('../controllers/user');

const router = express.Router();

// POST /user/1/follow (1번사용자를 팔로우한다)
//여기선 req.params.id값은 1
router.post('/:id/follow', isLoggedIn, addFollowing);

module.exports = router;