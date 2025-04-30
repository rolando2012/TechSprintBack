const app = require('./app');
const port = 4000; // Cambia el puerto a 4000 si es necesario

app.get('/', (req, res) => {
  // Enviar una respuesta JSON
  res.json({ mensaje: "Servidor de TechSprint Encendido" });
});

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
