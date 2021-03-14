const express = require('express');
const axios = require('axios');

const router = express.Router();

//자주쓰니까 만들어놓음
const URL = 'http://localhost:8002/v2';
//노드캣 주소를 넣어놓음. nodebird-api에서 요청이 어디서 왔는지 알 수 있게.
//브라우저에서 서버로 보낼땐 origin이 자동으로 넣어주기도 하는데
//서버에서 서버로 보낼땐 자동으로 안들어가는 경우가 많아서 직접 넣음
//cors에러 해결할때도 쓰임
axios.defaults.headers.origin = 'http://localhost:4000';

//api 서버로 요청을 보내는 함수, 토큰이 만료된 경우 자동으로 재발급 받아주는 기능 추가된 함
const request = async (req, api) => {
    try {
        if (!req.session.jwt) { // 세션에 토큰이 없으면
            const tokenResult = await axios.post(`${URL}/token`, {
                clientSecret: process.env.CLIENT_SECRET,
            });
            req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
        }
        return await axios.get(`${URL}${api}`, {
            headers: { authorization: req.session.jwt },
        }); // API 요청
    } catch (error) {
        if (error.response.status === 419) { // 토큰 만료시 토큰 재발급 받기
            delete req.session.jwt;
            return request(req, api);
        } // 419 외의 다른 에러면
        return error.response;
    }
};

// 토큰 테스트 라우터
// router.get('/test', async (req, res, next) => {
//     try {
//         if (!req.session.jwt) { // 세션에 토큰이 없으면 토큰 발급 시도
//             const tokenResult = await axios.post('http://localhost:8002/v1/token', {
//                 clientSecret: process.env.CLIENT_SECRET,
//             });
//             //axios 요청을 보내면 응답데이터가 .data에 들어있음
//             if (tokenResult.data && tokenResult.data.code === 200) { // 토큰 발급 성공
//                 req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
//             } else { // 토큰 발급 실패
//                 return res.json(tokenResult.data); // 발급 실패 사유 응답
//             }
//         }
//         // 발급받은 토큰 테스트
//         const result = await axios.get('http://localhost:8002/v1/test', {
//             headers: { authorization: req.session.jwt },
//         });
//         return res.json(result.data);
//     } catch (error) {
//         console.error(error);
//         if (error.response.status === 419) { // 토큰 만료 시
//             return res.json(error.response.data);
//         }
//         return next(error);
//     }
// });

//api서버로 요청 보내기
router.get('/mypost', async (req, res, next) => {
    try {
        const result = await request(req, '/posts/my');
        res.json(result.data);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/search/:hashtag', async (req, res, next) => {
    try {
        const result = await request(
            req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
        );
        res.json(result.data);
    } catch (error) {
        if (error.code) {
            console.error(error);
            next(error);
        }
    }
});

//브라우저(프론트)에서 api서버로 요청 보내기
router.get('/', (req, res) => {
    //실무에서 이렇게 비밀키를 그냥 보내면 노출됨. 실무에서는 REST API키와 공개키(프론트키) 두개를 사용해 공개키로 브라우저로 보내줌.
    res.render('main', { key: process.env.CLIENT_SECRET });
});

module.exports = router;