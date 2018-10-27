let express = require("express");
let app = express();
let requireDir = require("require-dir");
let dir = requireDir("./stats-folder");
const port = process.env.PORT || 5000;

app.get("/data", (req, res) => {
  res.send({ dir });
});

app.listen(port, () => {
  console.log("listening to port");
});

