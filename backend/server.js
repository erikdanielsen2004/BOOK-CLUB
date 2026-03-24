const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'Hello World' });
});

app.listen(5000);