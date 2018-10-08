const express = require('express');
const requireDir = require('require-dir');

const app = express();
const port = process.env.PORT || 5000;

app.get('/api/state', (req, res) => {
  const stateDir = requireDir('./states');
  res.send(stateDir);
});

app.listen(port, () => console.log(`Listening on port ${port}`));