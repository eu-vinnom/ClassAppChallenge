const fs = require('fs');
const _ = require('lodash');

const csvFilePath = 'input.csv';

const fileReader = readLines(csvFilePath, fs);
const lineArray = oneArrayLines(fileReader);
const nlinesArray = eachLineAsArray(lineArray);
const contentArray = removeEmptyFromFirstLine(nlinesArray);

var fullnames = new Set(getFullnames(contentArray));
var eids = new Set(getEids(contentArray));
var classes = new Set(getClasses(contentArray));
var invisible = getInvisible(contentArray);
var seeAll = getSeeAll(contentArray);

// console.log(fileReader);
// console.log(lineArray);
// console.log(nlinesArray);
// console.log(contentArray[3].length);

console.log(fullnames);
console.log(eids);
console.log(classes);
console.log(invisible);
console.log(seeAll);

function readLines(pathToFile, fileSystemInteractor) {
    return fileSystemInteractor.readFileSync(pathToFile, 'utf-8');
}

function oneArrayLines(multiLinesString) {
    return multiLinesString.split("\n");
}

function eachLineAsArray(oneLineArray) {
    let linesArray = [];
    let quotes = "\"";
    for (let line = 0; line < oneLineArray.length; line++) {
        linesArray[line] = oneLineArray[line].split(",");
    }
    for (let line = 0; line < linesArray.length; line++) {
        for (let column = 0; column < linesArray[line].length; column++) {
            if (linesArray[line][column].length === 0) {
                linesArray[line][column] = "empty";
            } else if (linesArray[line][column].startsWith(quotes)) {
                linesArray[line][column] = linesArray[line][column].concat(linesArray[line][column + 1]);
                linesArray[line][column + 1] = "";
                column++;
            }
        }
    }
    for (let line = 0; line < linesArray.length; line++) {
        linesArray[line] = _.compact(linesArray[line]);
    }
    
    return linesArray;
}

function removeEmptyFromFirstLine(multilinesArray) {
    let line = 0;
    let firstLineArray = multilinesArray[line];
    let empty = "empty";
    let arrayOfContents = [];

    for (let column = 0; column < firstLineArray.length; column++) {
        if (firstLineArray[column] === empty) {
            firstLineArray[column] = "";
        }
    }
    arrayOfContents = multilinesArray;
    arrayOfContents[line] = _.compact(firstLineArray);

    return arrayOfContents;
}

function getCategoryColumns(arrayOfContents, categoryNameRegex) {
    let categoryLine = 0;
    let categoryColumnIndexes = [];

    while (categoryLine === 0) {
        for (let column = 0; column < arrayOfContents[categoryLine].length; column++) {
            if (arrayOfContents[categoryLine][column].match(categoryNameRegex)) {
                categoryColumnIndexes[column] = column;
            }
        }
        categoryLine++;
    }
    return categoryColumnIndexes;
}

function setValues(arrayOfContents, categoryNameRegex) {
    let line = 1;
    let category = getCategoryColumns(arrayOfContents, categoryNameRegex);
    let dataArray = [];

    while (line < arrayOfContents.length) {
        for (let column = 0; column < arrayOfContents[line].length; column++) {
            if (column === category[column] && dataArray.length === 0) {
                dataArray[line] = arrayOfContents[line][column];
            } else if (column === category[column] && dataArray.length !== 0) {
                dataArray = dataArray.concat(arrayOfContents[line][column]);
            }
        }
        line++;
    }
    
    return dataArray;
}

function mapCategoryByFullname(arrayOfContents, fullnameSet, categoryNameRegex) {
    let index = 0;
    let key = 0;
    let dataLine = 1;
    let line = 1;
    let category = getCategoryColumns(arrayOfContents, categoryNameRegex);
    let fullnames = getFullnames(arrayOfContents);
    let dataArray = [];

    while (line < arrayOfContents.length) {
        dataArray[key] = fullnames[index];
        for (let column = 0; column < arrayOfContents[line].length; column++) {
            if (column === category[column] && dataArray[dataLine] == undefined) {
                dataArray[dataLine] = arrayOfContents[line][column];
            } else if (column === category[column] && dataArray[dataLine] != undefined) {
                dataArray[dataLine] = dataArray[dataLine].concat(arrayOfContents[line][column])
            }
        }
        line++;
        index++;
        dataLine = dataLine + 2;
        key = key + 2;
    }

    return _.chunk(dataArray, 2);
    
}

function setMappedValues(categoryArray) {
    let mappedArray = [];
    let line = 0;
    let columnKey = 0;
    let columnValue = 1;

    while (line < categoryArray.length) {
        if (mappedArray[line] == undefined) {
            mappedArray[line] = categoryArray[line][columnValue];
        } if (categoryArray[line + 1] != undefined) {
            if (categoryArray[line][columnKey] === categoryArray[line + 1][columnKey]) {
                mappedArray[line] = mappedArray[line].concat(" ",categoryArray[line + 1][columnValue]);
                line++;
            }
        }
        line++;
    }
    mappedArray = _.compact(mappedArray);

    return mappedArray;
}

function checkIfTrueofFalse(mappedArray) {
    let testValidArray = [];
    let validArray = [];
    let yes = "yes";
    let one = 1;

    for (let index = 0; index < mappedArray.length; index++) {
        testValidArray[index] = mappedArray[index].split(" ");
    }
    for (let line = 0; line < testValidArray.length; line++) {
        if (testValidArray[line].length > 1) {
            for (let column = 0; column < testValidArray[line].length; column++) {
                if (testValidArray[line][column] == one || testValidArray[line][column] == yes) {
                    validArray[line] = true;
                } else {
                    validArray[line] = false;
                }
            }
        } else {
            if (testValidArray[line] == one || testValidArray[line] == yes) {
                validArray[line] = true;
            } else {
                validArray[line] = false;
            }
        }
    }

    return validArray;
}

function getFormattedArray(mappedArray, regex) {
    formattedArray = [];
    for (let index = 0; index < mappedArray.length; index++) {
        formattedArray[index] = mappedArray[index].match(regex);
    }
    return formattedArray;
}

function getFullnames(arrayOfContents) {
    let fullNameCategoryRegex = /^\w*fullname\b/gi;
    let fullnamesArray = setValues(arrayOfContents, fullNameCategoryRegex);

    return _.compact(fullnamesArray);
}

function getEids(arrayOfContents) {
    let eidCategoryRegex = /^\w*eid\b/gi;
    let eidsArray = setValues(arrayOfContents, eidCategoryRegex);

    return _.compact(eidsArray);
}

function getClasses(arrayOfContents) {
    let classesCategoryRegex = /^\w*class\b/gi;
    let classesArray = mapCategoryByFullname(arrayOfContents, fullnames, classesCategoryRegex);
    let mappedClassesArray = setMappedValues(classesArray);
    let classRegex = /\w*sala [0-9]*/gi;
    let mappedClassesArrayFormatted = getFormattedArray(mappedClassesArray, classRegex);
    
    return mappedClassesArrayFormatted;
}

function getInvisible(arrayOfContents) {
    let invisibleCategoryRegex = /^\w*invisible\b/gi;
    let invisibleArray = mapCategoryByFullname(arrayOfContents, fullnames, invisibleCategoryRegex);
    let mappedInvisibleArray = setMappedValues(invisibleArray);
    let validInvisible = checkIfTrueofFalse(mappedInvisibleArray);

    return validInvisible;
}

function getSeeAll(arrayOfContents) {
    let seeAllCategoryRegex = /^\w*see_all\b/gi;
    let seeAllArray = mapCategoryByFullname(arrayOfContents, fullnames, seeAllCategoryRegex);
    let mappedSeeAllArray = setMappedValues(seeAllArray);
    let validSeeAll = checkIfTrueofFalse(mappedSeeAllArray);

    return validSeeAll;
}
