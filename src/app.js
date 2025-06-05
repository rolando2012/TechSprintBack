const express = require('express');
const config = require('./config');
const morgan = require('morgan');
const cors = require('cors');

const competidor = require('./routes/competidor.routes');
const registro = require('./routes/registro.routes');
const authRoutes = require('./routes/auth.route');
const administrador = require('./routes/administrador.route')
const cajero = require('./routes/cajero.route');
const consulta = require('./routes/consulta.route');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors({
    origin:'*',
    credentials:true
}));
app.use(cookieParser());

//condfiguracion
app.set('port', config.app.port);

//rutas
app.use('/api/competidor',competidor);
app.use('/api/registro',registro);
app.use('/api/auth', authRoutes);
app.use('/api/administrador',administrador);
app.use('/api/cajero',cajero);
app.use('/api/consulta',consulta);

module.exports = app;