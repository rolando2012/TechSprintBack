const prisma = require('../base/db');
const bcrypt = require('bcrypt');

const getCosto = async (req, res) => {
    const gestion = parseInt(req.params.gestion, 10);
    if (isNaN(gestion)) { 
        return res.status(400).json({ message: 'La gestión debe ser un número entero.' });
    }          
    const costo = await prisma.competencia.findMany({
        where: { gestion: gestion },
        select: { costo: true }
    });
    res.json(costo);
}

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
            area: {
                select:{
                    nombreArea: true,
                }
            },
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
    const flattenedTutores = tutores.map(({ codPer, codTut, area, persona }) => ({
        codPer,
        codTut,
        ...area,
        ...persona
    }));

    res.json(flattenedTutores);
};

const regCompetidor = async (req, res) => {
    try {
        // 0) Recuperar la competencia (puedes filtrar por gestión o por nombre)
    const comp = await prisma.competencia.findUnique({
        where: { nombreCompet: 'Olimpiada de Ciencia y Tecnología' }
        // o bien: where: { gestion: 2025 }
      });
      if (!comp) throw new Error('Competencia no encontrada');
  
      // 1) Desestructurar body
        const { persona, fechaNac, codMun, colegio, grado, nivel, tutorId, area: nombreArea } = req.body;
    
        // 2) Crear o actualizar Persona
        const per = await prisma.persona.upsert({
          where: { carnet: persona.carnet },
          update: { ...persona },
          create: persona
        });
    
        // 3) Crear usuario (UserN) con contraseña por defecto y rol Competidor
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
    
        // 3) Find area
    const areaRec = await prisma.area.findUnique({ where: { nombreArea } });
    if (!areaRec) throw new Error(`Área no encontrada: ${nombreArea}`);
    let codModal;    // <— IMPORTANTE: declarar antes de usar
    let nivelVal;
// 1. Extraer número y ciclo de nivel (p.ej. "3ro Primaria")
const mMatch = nivel.match(/^(\d+)(?:ro|to)?\s+(Primaria|Secundaria)$/i);
if (mMatch) {
  const numero = parseInt(mMatch[1], 10);
  const ciclo  = mMatch[2].toUpperCase(); // "PRIMARIA" o "SECUNDARIA"
  nivelVal = numero;

  // 1.a) Intento modalidad regular
  const gradoRec = await prisma.grado.findUnique({
    where: { numero_ciclo: { numero, ciclo } }
  });
  if (gradoRec) {
    const modalReg = await prisma.modalidadCompetencia.findFirst({
      where: {
        codCompet: comp.codCompet,
        codArea:   areaRec.codArea,
        codGrado:  gradoRec.codGrado
      }
    });
    if (modalReg) codModal = modalReg.codModal;
  }

  // 1.b) Si no hay regular, fallback a rango
  if (!codModal) {
    const especiales = await prisma.nivelEspecial.findMany({
      where: { codArea: areaRec.codArea }
    });
    for (const e of especiales) {
      const r = e.gradoRange.match(/^(\d+)\D*a\D*(\d+)\D*(Primaria|Secundaria)$/i);
      if (!r) continue;
      const [_, lowS, highS, catRange] = r;
      const low  = parseInt(lowS, 10);
      const high = parseInt(highS, 10);
      if (numero >= low && numero <= high && catRange.toUpperCase() === ciclo) {
        nivelVal = e.codNivel;
        const modalEsp = await prisma.modalidadCompetencia.findFirst({
          where: {
            codCompet:        comp.codCompet,
            codArea:          areaRec.codArea,
            codNivelEspecial: e.codNivel
          }
        });
        codModal = modalEsp?.codModal;
        break;
      }
    }
    if (!codModal) {
      throw new Error(`No se encontró modalidad para ${nivel} en ${areaRec.nombreArea}`);
    }
  }

} else {
  throw new Error(`Formato de nivel inválido: ${nivel}`);
}

// ... luego usas nivelVal y codModal para upsert Competidor e Inscripcion


    // 5) Upsert Competidor
    const compRec = await prisma.competidor.upsert({
      where: { codPer: per.codPer },
      create: {
        codPer:   per.codPer,
        fechaNac: new Date(fechaNac),
        codMun,
        colegio,
        grado,
        nivel: nivelVal
      },
      update: {
        fechaNac: new Date(fechaNac),
        codMun,
        colegio,
        nivel: nivelVal
      }
    });

    // 6) Crear Inscripción con el codModal encontrado
    const ins = await prisma.inscripcion.create({
      data: {
        codModal,
        codTutor:          tutorId,
        codCompet:         comp.codCompet,
        estadoInscripcion: 'Pendiente',
        fechaInscripcion:  new Date()
      }
    });

    return res.status(201).json({ competidor: compRec, inscripcion: ins });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
    getDepartamentos,
    getMunicipios,
    getAreas,
    getGradosNivel,
    getTutores,
    regCompetidor,
    getCosto,
}