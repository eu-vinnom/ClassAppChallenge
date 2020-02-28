const fs = require('fs');

const csvFilePath = 'input.csv';
const fileReader = fs.readFileSync(csvFilePath, 'utf-8');

var lines = fileReader.split("\n");

console.log(fileReader);
console.log(lines);