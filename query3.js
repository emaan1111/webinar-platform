const fs = require('fs');
const grep = require('child_process').execSync('grep -rn "ext_" src/app').toString();
console.log(grep);
