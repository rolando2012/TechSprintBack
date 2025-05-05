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
      // 0) Cargar la competencia activa
      const comp = await prisma.competencia.findFirst({
        where: { gestion: 2025 }
      });
      if (!comp) throw new Error('Competencia no encontrada para gestión 2025');
  
      // 1) Desestructurar body
      const {
        persona,
        fechaNac,
        codMun,
        colegio,
        grado,
        nivel,
        tutorId,
        area: nombreArea
      } = req.body;
  
      // 2) Upsert Persona
      const per = await prisma.persona.upsert({
        where: { carnet: persona.carnet },
        update: { ...persona },
        create: { ...persona }
      });
  
      // 3) Upsert UserN y asignar rol Competidor
      const passwHash = await bcrypt.hash('1234', 10);
      const user = await prisma.userN.upsert({
        where: { codPer: per.codPer },
        update: { passwUser: passwHash, codSis: 'TS-COMP' },
        create: { codPer: per.codPer, passwUser: passwHash, codSis: 'TS-COMP' }
      });
      await prisma.userNRol.upsert({
        where: {
          codUserN_codRol: {
            codUserN: user.codUserN,
            codRol:   /* reemplaza con tu codRol de Competidor */ 4
          }
        },
        update: {},
        create: {
          codUserN: user.codUserN,
          codRol:   /* mismo codRol */ 4
        }
      });
  
      // 4) Buscar el área
      const areaRec = await prisma.area.findUnique({
        where: { nombreArea }
      });
      if (!areaRec) throw new Error(`Área no encontrada: ${nombreArea}`);
  
      // 5) Determinar codModal y nivelVal
      let codModal;
      let nivelVal;
  
      // 5.a) Intento modalidad regular (niveles tipo "3ro Primaria", "4to Secundaria" o códigos "3P","4S"...)
      const m = nivel.match(/^(\d+)(?:ro|to)?\s+(Primaria|Secundaria)$/i);
      if (m) {
        const numero = parseInt(m[1], 10);
        const ciclo  = m[2].toUpperCase(); // "PRIMARIA" | "SECUNDARIA"
        nivelVal = numero;
  
        // Buscar Grado
        const gradoRec = await prisma.grado.findUnique({
          where: { numero_ciclo: { numero, ciclo } }
        });
        if (gradoRec) {
          // Buscar ModalidadCompetencia regular
          const modalReg = await prisma.modalidadCompetencia.findFirst({
            where: {
              codCompet: comp.codCompet,
              codArea:   areaRec.codArea,
              codGrado:  gradoRec.codGrado
            }
          });
          if (modalReg) codModal = modalReg.codModal;
        }
      }
  
      // 5.b) Si no hay modalidad regular, fallback a nivelEspecial
      if (!codModal) {
        // Buscar nivelEspecial por nombre exacto
        let ne = await prisma.nivelEspecial.findUnique({
          where: { nombreNivel: nivel }
        });
  
        // Si no existe por nombre, buscar por rango en gradoRange
        if (!ne) {
          const especiales = await prisma.nivelEspecial.findMany({
            where: { codArea: areaRec.codArea }
          });
          ne = especiales.find(e => {
            // Compara insensiblemente y busca coincidencia
            return (
              e.nombreNivel.toLowerCase() === nivel.toLowerCase() ||
              e.gradoRange.toLowerCase().includes(nivel.toLowerCase())
            );
          });
        }
  
        if (!ne) {
          throw new Error(`No existe nivelEspecial para '${nivel}' en ${nombreArea}`);
        }
  
        nivelVal = ne.codNivel;
  
        // Buscar o crear ModalidadCompetencia para este nivelEspecial
        let modalEsp = await prisma.modalidadCompetencia.findFirst({
          where: {
            codCompet:        comp.codCompet,
            codArea:          areaRec.codArea,
            codNivelEspecial: ne.codNivel
          }
        });
        if (!modalEsp) {
          modalEsp = await prisma.modalidadCompetencia.create({
            data: {
              codCompet:        comp.codCompet,
              codArea:          areaRec.codArea,
              codNivelEspecial: ne.codNivel
            }
          });
        }
        codModal = modalEsp.codModal;
      }
  
      // 6) Upsert Competidor
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
  
      // 7) Crear Inscripción
      const ins = await prisma.inscripcion.create({
        data: {
          codModal,
          codTutor:          tutorId,
          codCompet:         comp.codCompet,
          codComp:           compRec.codComp,
          estadoInscripcion: 'Pendiente',
          fechaInscripcion:  new Date()
        }
      });
  
      return res.status(201).json({ competidor: compRec, inscripcion: ins });
    } catch (error) {
      console.error('[regCompetidor]', error);
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