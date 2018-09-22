'use strict';

const { readFile, writeFile } = require('fs');
const { promisify } = require('util');

const readWithPromise = promisify(readFile);
const writeWithPromise = promisify(writeFile);

function readJSONFile(path) {
  return readWithPromise(path, 'utf8')
    .then(JSON.parse)
}

function writeJSONFile(path, data) {
  return writeWithPromise(path, JSON.stringify(data, null, 2))
}

module.exports = {
  readJSONFile,
  writeJSONFile
};