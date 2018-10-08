const requireDir = require('require-dir');

const TODO_FILE_PATH = './tmp/todo';

const weatherObject = requireDir(TODO_FILE_PATH);

console.log(weatherObject);