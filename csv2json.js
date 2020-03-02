const fs = require('fs');
const _ = require('lodash');

const csvFilePath = 'input.csv';

const fileReader = readLines(csvFilePath, fs);
const lineArray = oneArrayLines(fileReader);
const nlinesArray = eachLineAsArray(lineArray);
const contentArray = removeFalseyContent(nlinesArray);

var fullname = new Set(getFullnamesStringArray(contentArray));

console.log(fileReader);
console.log(lineArray);
console.log(nlinesArray);
console.log(contentArray);
console.log(fullname);

function readLines(pathToFile, fileSystemInteractor) {
    return fileSystemInteractor.readFileSync(pathToFile, 'utf-8');
}

function oneArrayLines(multiLinesString) {
    return multiLinesString.split("\n");
}

function eachLineAsArray(oneLineArray) {
    let linesArray = [];
    for (let index = 0; index < oneLineArray.length; index++) {
        linesArray[index] = oneLineArray[index].split(",");
    }
    return linesArray;
}

function removeFalseyContent(multilinesArray) {
    let eachLineIsArray = [];
    for (let index = 0; index < multilinesArray.length; index++) {
        eachLineIsArray[index] = _.compact(multilinesArray[index]);
    }
    return eachLineIsArray;
}

function getFullnamesArrays(arrayOfContents) {
    let fullnamesArray = [];
    let nameAux = [];
    for (let i = 0; i < arrayOfContents.length; i++) {
        for (let j = 0; j < arrayOfContents[i].length; j++) {
            nameAux[j] = arrayOfContents[i][j].split(" ");
            nameAux[j] = _.compact(nameAux[j]);
            if (nameAux[j].length === 3) {
                fullnamesArray[i] = nameAux[j];
            }
        }
    }
    return _.compact(fullnamesArray);
}

function getFullnamesStringArray(arrayOfContents) {
    let fullnameStringArray = [];
    arrayOfFullnames = getFullnamesArrays(arrayOfContents);
    for (let index = 0; index < arrayOfFullnames.length; index++) {
        fullnameStringArray[index] = arrayOfFullnames[index].join(" ");
    }
    return fullnameStringArray;
}