const express = require('express');
const config = require('./config');
const morgan = require('morgan');

const competidor = require('./routes/competidor.routes');
const competencia = require('./routes/competencia.routes');

const app = express();

app.use(morgan('dev'));

//condfiguracion
app.set('port', config.app.port);

//rutas
app.use('/api/competidor',competidor);
app.use('/api/competencia',competencia);

module.exports = app;