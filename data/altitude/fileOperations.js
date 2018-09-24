'use strict';

const { readFile, writeFile } = require('fs');
const { promisify } = require('util');

const readWithPromise = promisify(readFile);
const writeWithPromise = promisify(writeFile);

function readCities(path) {
  return readWithPromise(path, 'utf8')
    .then(JSON.parse);
}

function writeCities(path, data) {
  return writeWithPromise(path, JSON.stringify(data, null, 2));
}

module.exports = {
  readCities,
  writeCities
};