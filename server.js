const express = require('express');
const Router = require('./routes/index');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/', Router);

app.listen(PORT, (err) => {
  if (err) console.error(err);
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
