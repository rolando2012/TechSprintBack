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

const getGradosNivel = async (req, res) => {
    const { area: nombreArea, gestion: gestionParam } = req.params;
    const gestion = parseInt(gestionParam, 10);
    if (isNaN(gestion)) {
      return res.status(400).json({ message: 'La gestión debe ser un número entero.' });
    }
  
    // 1. Área
    const areaRec = await prisma.area.findUnique({ where: { nombreArea } });
    if (!areaRec) return res.status(404).json({ message: 'Área no encontrada' });
  
    // 2. Grados numéricos
    const grados = await prisma.areaGrado.findMany({
      where: { codArea: areaRec.codArea },
      include: { grado: true }
    });
  
    // 3. Niveles especiales
    const niveles = await prisma.nivelEspecial.findMany({
      where: { codArea: areaRec.codArea }
    });
  
    // 4. Precios por gestión
    const costos = await prisma.competencia.findMany({
      where: { gestion },
      select: { gestion: true, costo: true }
    });
    const mapaCostos = new Map(costos.map(c => [c.gestion, c.costo]));
  
    // 5. Clasificar y construir respuesta
    const salida = { codArea: areaRec.codArea, primary: [], secondary: [] };
  
    // 5.a. Grados regulares
    for (const { grado } of grados) {
      const isPrim = grado.ciclo === 'PRIMARIA';
      const suf = isPrim ? 'Primaria' : 'Secundaria';
      const gradeLabel = `${grado.numero}ro ${suf}`;
      const levelCode = `${grado.numero}${isPrim ? 'P' : 'S'}`;
      const price = mapaCostos.get(gestion) ?? 0;
      const bucket = isPrim ? 'primary' : 'secondary';
  
      salida[bucket].push({
        codGrado: grado.codGrado,
        grade: gradeLabel,
        level: levelCode,
        price
      });
    }
  
    // 5.b. Niveles especiales
    for (const ne of niveles) {
      const isPrim = ne.gradoRange.toLowerCase().includes('primaria');
      const price = mapaCostos.get(gestion) ?? 0;
      const bucket = isPrim ? 'primary' : 'secondary';
  
      salida[bucket].push({
        codNivel: ne.codNivel,
        grade: ne.nombreNivel,
        level: ne.nombreNivel,
        price,
        rango: ne.gradoRange
      });
    }
  
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