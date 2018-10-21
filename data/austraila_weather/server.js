const express = require('express');
const requireDir = require('require-dir');

const stats = requireDir('./stats');
const statsArr = Object.values(stats);

const app = express();
const port = 3001;

app.get(`/api/stats`, (req, res) => {
  res.json(statsArr)
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
})
