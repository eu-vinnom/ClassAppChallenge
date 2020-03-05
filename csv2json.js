const fs = require('fs');
const _ = require('lodash');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const csvFilePath = 'input.csv';
const jsonFilePath = 'output.json';

const fileReader = readLines(csvFilePath, fs);
const lineArray = oneArrayLines(fileReader);
const nlinesArray = eachLineAsArray(lineArray);
const contentArray = removeEmptyFromFirstLine(nlinesArray);

const fullname = new Set(getFullnames(contentArray));
const eid = new Set(getEids(contentArray));
const classes = new Set(getClasses(contentArray));
const invisible = getInvisible(contentArray);
const seeAll = getSeeAll(contentArray);
const addresses = getAddresses(contentArray);
const json = getJsonObject();

const jsonString = JSON.stringify(json, null, 4);

fs.writeFileSync(jsonFilePath, jsonString);

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
    removeQuotesFromContent(arrayOfContents);

    return arrayOfContents;
}

function removeQuotesFromContent(arrayOfContents) {
    let quote = "\"";

    for (let line = 0; line < arrayOfContents.length; line++) {
        for (let column = 0; column < arrayOfContents[line].length; column++) {
            if (arrayOfContents[line][column].startsWith(quote) && arrayOfContents[line][column].endsWith(quote)) {
                arrayOfContents[line][column] = arrayOfContents[line][column].substring(1, arrayOfContents[line][column].length - 1);
            }
        }
    }
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

function mapCategoryByFullname(arrayOfContents, categoryNameRegex) {
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
                continue;
            }
            if (column === category[column] && dataArray[dataLine] != undefined) {
                dataArray[dataLine] = dataArray[dataLine].concat(arrayOfContents[line][column]);
            }
        }
        dataLine = dataLine + 2;
        key = key + 2;
        line++;
        index++;
    }

    dataArray = _.compact(dataArray);
    return _.chunk(dataArray, 2);
}

function getMappedValues(categoryArray) {
    let mappedArray = [];
    let line = 0;
    let columnKey = 0;
    let columnValue = 1;

    while (line < categoryArray.length) {
        if (mappedArray[line] == undefined) {
            mappedArray[line] = categoryArray[line][columnValue];
        } if (categoryArray[line + 1] != undefined) {
            if (categoryArray[line][columnKey] === categoryArray[line + 1][columnKey]) {
                mappedArray[line] = mappedArray[line].concat(" ", categoryArray[line + 1][columnValue]);
                line++;
            }
        }
        line++;
    }
    mappedArray = _.compact(mappedArray);

    return mappedArray;
}

function mapPhoneAddress(arrayOfContents) {
    let dataLine = 0;
    let dataColumn = 1;
    let phoneNumberKey = 2;
    let line = 1;
    let mappedArray = [];

    while (line < arrayOfContents.length) {
        for (let column = 0; column < arrayOfContents[line].length; column++) {
            if (phoneUtil.isPossibleNumberString(arrayOfContents[line][column], 'BR')) {
                mappedArray[dataLine] = line;
                mappedArray[dataColumn] = column;
                mappedArray[phoneNumberKey] = arrayOfContents[line][column];
            }
            dataLine = dataLine + 3;
            dataColumn = dataColumn + 3;
            phoneNumberKey = phoneNumberKey + 3;
        }
        line++;
    }

    mappedArray = _.compact(mappedArray);
    return _.chunk(mappedArray, 3);
}

function mapEmailAddress(arrayOfContents) {
    let dataLine = 0;
    let dataColumn = 1;
    let emailKey = 2;
    let line = 1;
    let mappedArray = [];

    while (line < arrayOfContents.length) {
        for (let column = 0; column < arrayOfContents[line].length; column++) {
            if (isAValidEmail(arrayOfContents[line][column])) {
                mappedArray[dataLine] = line;
                mappedArray[dataColumn] = column;
                mappedArray[emailKey] = arrayOfContents[line][column];
            }
            dataLine = dataLine + 3;
            dataColumn = dataColumn + 3;
            emailKey = emailKey + 3;
        }
        line++;
    }

    mappedArray = _.compact(mappedArray);
    return _.chunk(mappedArray, 3);
}

function isAValidEmail(emailAddress) {
    dotCom = ".com";
    dotComDotBr = ".com.br";

    return (emailAddress.endsWith(dotCom)) || (emailAddress.endsWith(dotComDotBr));
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
                } else if (validArray[line] == undefined) {
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

function mergeAddressCategory(phoneAddressMap, emailAddressMap, addressType, arrayOfContents) {
    let line = 0;
    let typeIndex = 1;
    let tagIndex = 2;
    let addressIndex = 3;
    let keyLine = 0;
    let keyColumn = 0;
    let tagColumn = 1;
    let addressColumn = 2;
    let mappedAddressesArray = [];
    let phone = 0;
    let email = 1;

    let phoneArrayMapped = [];
    let emailArrayMapped = [];

    while (line < phoneAddressMap.length) {
        phoneArrayMapped[keyLine] = phoneAddressMap[line][keyColumn];
        phoneArrayMapped[typeIndex] = addressType[phone];
        phoneArrayMapped[tagIndex] = arrayOfContents[0][phoneAddressMap[line][tagColumn]];
        phoneArrayMapped[addressIndex] = phoneAddressMap[line][addressColumn];

        keyLine = keyLine + 4;
        typeIndex = typeIndex + 4;
        tagIndex = tagIndex + 4;
        addressIndex = addressIndex + 4;
        line++;
    }

    keyLine = 0;
    typeIndex = 1;
    tagIndex = 2;
    addressIndex = 3;
    line = 0;

    while (line < emailAddressMap.length) {
        emailArrayMapped[keyLine] = emailAddressMap[line][keyColumn];
        emailArrayMapped[typeIndex] = addressType[email];
        emailArrayMapped[tagIndex] = arrayOfContents[0][emailAddressMap[line][tagColumn]];
        emailArrayMapped[addressIndex] = emailAddressMap[line][addressColumn];

        keyLine = keyLine + 4;
        typeIndex = typeIndex + 4;
        tagIndex = tagIndex + 4;
        addressIndex = addressIndex + 4;
        line++;
    }

    mappedAddressesArray = fixData(_.chunk(phoneArrayMapped, 4), _.chunk(emailArrayMapped, 4));

    return mappedAddressesArray;
}

function fixData(phoneArrayMapped, emailArrayMapped) {
    let tagColumn = 2;
    let phoneArray = [];
    let emailArray = [];
    let phoneLine = 0;
    let emailLine = 0;
    let counter = 0;

    while (phoneLine < phoneArrayMapped.length) {
        for (let emailLine = 0; emailLine < emailArrayMapped.length; emailLine++) {
            if (phoneArrayMapped[phoneLine].includes(emailArrayMapped[emailLine][tagColumn])) {
                counter++;
                break;
            }
        }
        if (counter === 0) {
            phoneArray[phoneLine] = phoneArrayMapped[phoneLine];
        }
        counter = 0;
        phoneLine++;
    }

    phoneArray = _.compact(phoneArray);

    counter = 0;
    while (emailLine < emailArrayMapped.length) {
        for (let phoneLine = 0; phoneLine < phoneArray.length; phoneLine++) {
            if (emailArrayMapped[emailLine].includes(phoneArray[phoneLine][tagColumn])) {
                counter++;
                break;
            }
        }
        if (counter === 0) {
            emailArray[emailLine] = emailArrayMapped[emailLine];
        }
        counter = 0;
        emailLine++;
    }

    emailArray = _.compact(emailArray);

    return _.concat(phoneArray, emailArray);
}

function getTagsFixed(addressArrayMapped) {
    let addressArrayMappedTags = [];
    let tagColumn = 2;
    let typeColumn = 1;

    for (let line = 0; line < addressArrayMapped.length; line++) {
        addressArrayMappedTags[line] = [addressArrayMapped[line][0], addressArrayMapped[line][1],
        addressArrayMapped[line][tagColumn].split(" "), addressArrayMapped[line][3]];

        if (addressArrayMappedTags[line][tagColumn][0] === addressArrayMappedTags[line][typeColumn]) {
            addressArrayMappedTags[line][tagColumn] = _.pull(addressArrayMappedTags[line][tagColumn], addressArrayMappedTags[line][typeColumn]);
        }
    }

    return addressArrayMappedTags;
}

function getEmailFixed(addressArrayMapped) {
    let emailColumn = 3;
    let emailTypeColumn = 1;
    let email = "email";
    let slash = "/";

    for (let line = 0; line < addressArrayMapped.length; line++) {
        if (addressArrayMapped[line][emailTypeColumn] === email && addressArrayMapped[line][emailColumn].includes(slash)) {
            addressArrayMapped[line][emailColumn] = addressArrayMapped[line][emailColumn].split(slash);
        }
    }

    return addressArrayMapped;
}

function getPhoneNumberFixed(addressArrayMapped) {
    let phoneNumberColumn = 3;
    let plusSign = "+";

    for (let line = 0; line < addressArrayMapped.length; line++) {
        if (phoneUtil.isPossibleNumberString(addressArrayMapped[line][phoneNumberColumn], 'BR')) {
            let phoneNumber = phoneUtil.parseAndKeepRawInput(addressArrayMapped[line][phoneNumberColumn], 'BR');
            phoneNumber = phoneUtil.format(phoneNumber, PNF.E164);
            if (phoneNumber.startsWith(plusSign)) {
                phoneNumber = phoneNumber.substring(1);
            }
            addressArrayMapped[line][phoneNumberColumn] = phoneNumber;
        }
    }

    return addressArrayMapped;
}

function mapAddressToFullnames(mergedAddress, fullname) {
    let fullnameColumn = 0;

    for (let line = 0; line < mergedAddress.length; line++) {
        mergedAddress[line][fullnameColumn] = mergedAddress[line][fullnameColumn] - 1;
    }

    for (let line = 0; line < mergedAddress.length; line++) {
        if (mergedAddress[line + 1] != undefined) {
            if (fullname[mergedAddress[line][fullnameColumn]] === fullname[mergedAddress[line + 1][fullnameColumn]]) {
                mergedAddress[line + 1][fullnameColumn] = mergedAddress[line][fullnameColumn];
            } else if (mergedAddress[line + 1][fullnameColumn] - 1 >= 0) {
                mergedAddress[line + 1][fullnameColumn] = mergedAddress[line + 1][fullnameColumn] - 1;
            }
        }
    }
    return mergedAddress;
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
    let classesArray = mapCategoryByFullname(arrayOfContents, classesCategoryRegex);
    let mappedClassesArray = getMappedValues(classesArray);
    let classRegex = /\w*sala [0-9]*/gi;
    let mappedClassesArrayFormatted = getFormattedArray(mappedClassesArray, classRegex);

    return mappedClassesArrayFormatted;
}

function getInvisible(arrayOfContents) {
    let invisibleCategoryRegex = /^\w*invisible\b/gi;
    let invisibleArray = mapCategoryByFullname(arrayOfContents, invisibleCategoryRegex);
    let mappedInvisibleArray = getMappedValues(invisibleArray);
    let validInvisible = checkIfTrueofFalse(mappedInvisibleArray);

    return validInvisible;
}

function getSeeAll(arrayOfContents) {
    let seeAllCategoryRegex = /^\w*see_all\b/gi;
    let seeAllArray = mapCategoryByFullname(arrayOfContents, seeAllCategoryRegex);
    let mappedSeeAllArray = getMappedValues(seeAllArray);
    let validSeeAll = checkIfTrueofFalse(mappedSeeAllArray);

    return validSeeAll;
}

function getAddressType() {
    let addressType = ["phone", "email"];

    return addressType;
}

function getPhoneAddress(arrayOfContents) {
    let mappedPhoneAddressArray = mapPhoneAddress(arrayOfContents);

    return mappedPhoneAddressArray;
}

function getEmailAddress(arrayOfContents) {
    let mappedEmailAddressArray = mapEmailAddress(arrayOfContents);

    return mappedEmailAddressArray;
}

function getAddresses(arrayOfContents) {
    let phoneAddressMapped = getPhoneAddress(arrayOfContents);
    let emailAddressMapped = getEmailAddress(arrayOfContents);
    let addressType = getAddressType();
    let mergedAddress = mergeAddressCategory(phoneAddressMapped, emailAddressMapped, addressType, arrayOfContents);
    let mergedAddressFixedTags = getTagsFixed(mergedAddress);
    let mergedAddressFixedPhoneNumbers = getPhoneNumberFixed(mergedAddressFixedTags);
    let mergedAddressFixedEmail = getEmailFixed(mergedAddressFixedPhoneNumbers);
    let mappedAddress = mapAddressToFullnames(mergedAddressFixedEmail, getFullnames(arrayOfContents));
    mappedAddress.sort();
    let type = getAddressCategory(mappedAddress, 1);
    let tags = getAddressCategory(mappedAddress, 2);
    let address = getAddressCategory(mappedAddress, 3);

    let addressObject = [];
    value = 1;

    for (let line = 0; line < mappedAddress.length; line++) {
        addressObject[line] = {
            "key": mappedAddress[line][0],
            "type": type[line][value],
            "tags": tags[line][value],
            "address": address[line][value],
        };
    }

    return addressObject;
}

function getJsonObject() {
    let fullnameIterator = fullname.values();
    let eidIterator = eid.values();
    let classesIterator = classes.values();
    let invisibleIterator = invisible.values();
    let seeAllIterator = seeAll.values();
    let jsonIteration = 0;
    let addressIteration = 0;
    let json = [];

    while (jsonIteration < fullname.size) {
        let addressesClone = [];
        while (addressIteration < addresses.length) {
            if (addresses[addressIteration]["key"] == jsonIteration) {
                addressesClone[addressIteration] = addresses[addressIteration];
                delete addressesClone[addressIteration]["key"];
            }
            addressIteration++;
        }
        addressesClone = _.compact(addressesClone);
        json[jsonIteration] = {
            "fullname": fullnameIterator.next().value,
            "eid": eidIterator.next().value,
            "classes": classesIterator.next().value,
            "addresses": addressesClone,
            "invisible": invisibleIterator.next().value,
            "see_all": seeAllIterator.next().value
        };
        jsonIteration++;
        addressIteration = 0;
    }

    return json;
}

function getAddressCategory(mergedAddress, categoryColumn) {
    let category = [];
    let keyColumn = 0;
    let element1 = 0;
    let element2 = 1;

    for (let line = 0; line < mergedAddress.length; line++) {
        category[element1] = mergedAddress[line][keyColumn];
        category[element2] = mergedAddress[line][categoryColumn];

        element1 = element1 + 2;
        element2 = element2 + 2;
    }
    return _.chunk(category, 2);
}
