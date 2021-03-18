#!/usr/bin/env node
//위의 줄의 의미는 js파일을 뭐가 실행할건지 알려주는 의미. /usr/bin/env 폴더에 있는 node로 실행해라. 셔뱅이라고 부름.
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.clear();
const answerCallback = (answer) => {
    if (answer === 'y') {
        console.log('땡큐');
        rl.close();
    } else if (answer === 'n') {
        console.log('sorry');
        rl.close();
    } else {
        console.clear();
        console.log('y나 n만 입력하세요.');
        rl.question('예제가 재미있습니까? (y/n)', answerCallback);
    }
};

rl.question('예제가 재미있습니까? (y/n)', answerCallback);