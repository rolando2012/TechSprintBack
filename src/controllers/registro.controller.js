const prisma = require('../base/db');
const bcrypt = require('bcrypt');

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
    console.log(req.params.area);
    const gestion = parseInt(req.params.gestion, 10);
    if (isNaN(gestion)) {
        return res.status(400).json({ message: 'El parámetro gestión debe ser un número entero.' });
    }

    const idArea = await prisma.area.findFirst({
        where: {
            nombreArea: req.params.area,
        },
        select: {
            codArea: true,
        },
    });
    if (!idArea) {
        return res.status(404).json({ message: 'Área no encontrada' });
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
    where:{
        codArea: idArea.codArea,
    }
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

const getTutores = async (req, res) => {
    const tutores = await prisma.tutor.findMany({
        select:{
            codPer: true,
            codTut: true,
            persona:{
                select:{
                    nombre: true,
                    apellidoPaterno: true,
                    apellidoMaterno: true,
                }
            }
        }
    });

    // Aplanamos cada objeto combinando los datos de tutor y persona
    const flattenedTutores = tutores.map(({ codPer, codTut, persona }) => ({
        codPer,
        codTut,
        ...persona
    }));

    res.json(flattenedTutores);
};

const regCompetidor = async (req, res) => {
    try {
        const { persona, fechaNac, codMun, colegio, grado, nivel, tutorId } = req.body;
    
        // 1) Crear o actualizar Persona
        const per = await prisma.persona.upsert({
          where: { carnet: persona.carnet },
          update: { ...persona },
          create: persona
        });
    
        // 2) Crear usuario (UserN) con contraseña por defecto y rol Competidor
        const hashed = await bcrypt.hash('1234', 10);
        const user = await prisma.userN.upsert({
          where: { codPer: per.codPer },
          update: { passwUser: hashed, codSis: 'TS-COMP' },
          create: { codPer: per.codPer, passwUser: hashed, codSis: 'TS-COMP' }
        });
        await prisma.userNRol.upsert({
          where: {
            codUserN_codRol: { codUserN: user.codUserN, codRol: /* Competidor role ID */ 4 }
          },
          update: {},
          create: { codUserN: user.codUserN, codRol: /* Competidor role ID */ 4 }
        });
    
        // 3) Encontrar el nivel según nombreNivel
        const nivelRec = await prisma.nivel.findUnique({ where: { nombreNivel: nivel } });
        if (!nivelRec) throw new Error(`Nivel no encontrado: ${nivel}`);
    
        // 4) Crear Competidor
        const comp = await prisma.competidor.create({
          data: {
            codPer: per.codPer,
            fechaNac: new Date(fechaNac),
            codMun,
            colegio,
            grado,
            nivel: nivelRec.codNivel
          }
        });
    
        // 5) Crear Inscripcion pendiente (codModal asumido 1)
        const ins = await prisma.inscripcion.create({
          data: {
            codModal: 1,
            codTutor: tutorId,
            codCompet: comp.codComp,
            estadoInscripcion: 'Pendiente',
            fechaInscripcion: new Date()
          }
        });
        
    
        res.status(201).json({ competidor: comp, inscripcion: ins });
      } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
      }
    };

module.exports = {
    getDepartamentos,
    getMunicipios,
    getAreas,
    getGradosNivel,
    getTutores,
    regCompetidor,
}