const app = require('./app');
const port = app.get('port')

app.get('/', (req, res) => {
    res.send('Servidor de TechSprint Encendido');
});

app.listen(port, () => {
   console.log(`Servidor ejecutando en http://localhost:${port}`); 
});