const express = require("express");
const requireDir = require("require-dir");
const statsDir = requireDir("./stats");
const stats = Object.values(statsDir);

const app = express();

app.get("/api/getStats", (req, res) => {
  res.json(stats);
});

app.listen(3001, () => {
  console.log("server listening on port 3001 ");
});
