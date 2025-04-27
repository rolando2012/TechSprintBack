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

const getAreas = async (req, res) => {
    const areas = await prisma.area.findMany({
        select:{
            codArea:true,
            nombreArea:true,
        }
    });
    res.json(areas);
}

const getGradosNivel = async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'El parámetro id debe ser un número entero.' });
    }
    const grados = await prisma.areaGrado.findMany({
        select:{
            codGrado:true,
            grado:{
                select:{
                    nombreGrado:true,
                    gradosNivel:{
                        select:{
                            codNivel:true,
                            nivel:{
                                select:{
                                    nombreNivel:true,
                                }
                            }
                        
                        }
                    },
                },
            }
           },
        where: {
            codArea: id
        }

    });
    res.json(grados);
}

module.exports = {
    getDepartamentos,
    getMunicipios,
    getAreas,
    getGradosNivel,
}