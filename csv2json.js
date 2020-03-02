const fs = require('fs');

const csvFilePath = 'input.csv';

const fileReader = readLines(csvFilePath, fs);
const lines = splitIntoLines(fileReader);
const contentRaw = splitIntoContent(lines);

console.log(fileReader);
console.log(lines);
console.log(contentRaw);

function readLines(pathToFile, fileSystemInteractor) {
    return fileSystemInteractor.readFileSync(pathToFile, 'utf-8');
}

function splitIntoLines(multiLinesString) {
    return multiLinesString.split("\n");
}

function splitIntoContent(lineArray) {
    let contentArray = [];
    for (let index = 0; index < lineArray.length; index++) {
        contentArray[index] = lineArray[index].split(",");
    }
    return contentArray;
}