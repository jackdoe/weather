const express = require("express");
const requireDir = require("require-dir");

const app = express();

app.get("/api/stats", (req, res) => {
  const stats = requireDir("./sources/stats");
  const statsArr = Object.values(stats);
  res.json(statsArr);
});

const port = 3001;

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
