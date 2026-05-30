const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Servidor AiDEN funcionando');
});

app.listen(3000, () => {
    console.log('Servidor iniciado en puerto 3000');
});