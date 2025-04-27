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

// Supongamos que codCompet en la tabla competencia coincide con codGrado
const getGradosNivel = async (req, res) => {
    const gestion = parseInt(req.params.gestion, 10);
    if (isNaN(gestion)) {
        return res.status(400).json({ message: 'El parámetro gestión debe ser un número entero.' });
    }

    // 1. Traigo los grados por área con su nivel
    const gradosPorArea = await prisma.areaGrado.findMany({
    select: {
        codArea: true,
        codGrado: true,
        grado: {
            select: {
            nombreGrado: true,
            gradosNivel: {
                select: {
                codNivel: true,
                nivel: {
                  select: {
                    nombreNivel: true,
                },
                },
            },
            },
        },
        },
    },
    });

    // 2. Traigo los costos de competencias para esta gestión
    const costos = await prisma.competencia.findMany({
        where: { gestion },
        select: { gestion: true, costo: true },
    });

    // 3. Construyo un mapa codCompet → costo
    const mapaCostos = new Map(costos.map(c => [c.gestion, c.costo]));

    // 4. Transformo la estructura de salida
    const resultado = gradosPorArea.reduce((acc, { codArea, codGrado, grado }) => {
      // Inicializo si no existe aún
        if (!acc[codArea]) {
        acc[codArea] = {
            codArea,
            primary: [],
            secondary: []
        };
        }

      // Para cada nivel asignado al grado
        grado.gradosNivel.forEach(({ codNivel, nivel: { nombreNivel } }) => {
        // Determino si va a primary o secondary
        const bucket = grado.nombreGrado.toLowerCase().includes("primaria") ? 'primary' : 'secondary';
        const price = mapaCostos.get(gestion) ?? 0; // ajusta la clave si tu costo se basa en otro código

        acc[codArea][bucket].push({
            codGrado,
            grade: grado.nombreGrado,
            level: nombreNivel,
            price,
            codNivel
        });
        });

        return acc;
    }, {});

    // 5. Convierto a array
    const salida = Object.values(resultado);

    res.json(salida);
};

module.exports = {
    getDepartamentos,
    getMunicipios,
    getAreas,
    getGradosNivel
}