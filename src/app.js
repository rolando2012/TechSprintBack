const express = require('express');
const config = require('./config');
const morgan = require('morgan');
const cors = require('cors');

const competidor = require('./routes/competidor.routes');
const registro = require('./routes/registro.routes');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

//condfiguracion
app.set('port', config.app.port);

//rutas
app.use('/api/competidor',competidor);
app.use('/api/registro',registro);

module.exports = app;