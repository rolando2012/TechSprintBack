const prisma = require('../base/db');

const getDepartamentos = async (req, res) => {
    const departamentos = await prisma.departamento.findMany();    
    res.json(departamentos);
}

const getMunicipios = async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'El parámetro id debe ser un número entero.' });
    }
    const municipios = await prisma.municipio.findMany({
        select:{
            codMun:true,
            nombreMun:true,
        },
        where: {
            codDept: id
        }
    });
    if (municipios.length === 0) {
        return res.status(404).json({ message: 'No se encontraron municipios para el departamento especificado.' });
    }
    res.json(municipios);
}

module.exports = {
    getDepartamentos,
    getMunicipios
}