let fs = require("fs");
let apiOutput = require("./requestOutputs/weatherOutputAPI.json");
let metnoOutput = require("./requestOutputs/weatherOutputMetno.json");
let timestamp = Math.round(new Date().getTime() / 1000);

console.log('Api data length'+ ''+ apiOutput.length)
console.log('Metno data length' + ''+ metnoOutput.length)

if(apiOutput.length===67 && metnoOutput.length===67){
//move to API todo
fs.writeFileSync(
  `./todo/developer.weatherUnlocked.${timestamp}.json`,
  JSON.stringify(apiOutput, null, 2)
);

// move to todoMetno
fs.writeFileSync(
  `./todoMetno/metno.${timestamp}.json`,
  JSON.stringify(metnoOutput, null, 2)
);
} else{
  console.log('Data is incomplete.Data length should be 67.run parse.js and met.no.js again')
}