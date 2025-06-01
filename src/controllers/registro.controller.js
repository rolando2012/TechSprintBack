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

const getMunicipiosByName = async (req, res) => {
    const name = req.params.nombre;

    const id = await prisma.departamento.findFirst({
        where: {
            nombreDept: name
        },
        select:{
            codDept:true
        }
    })
    
    const municipios = await prisma.municipio.findMany({
        select:{
            codMun:true,
            nombreMun:true,
        },
        where: {
            codDept: id.codDept
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
    const {
      persona,
      fechaNac,
      codMun,
      colegio,
      grado,
      tutorId,
      areas, // arreglo de { area: string, nivel: string }
    } = req.body;

    if (!Array.isArray(areas) || areas.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un área para inscripción.' });
    }

    // Iniciamos la transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // ──── 1) Hacemos UPSERT de Persona based en email ────
      // Convertimos el email a minúsculas para evitar problemas de colación
      const emailNormalizado = persona.email.toLowerCase();

      const per = await tx.persona.upsert({
        where: { email: emailNormalizado },
        update: {
          nombre:           persona.nombre,
          apellidoPaterno:  persona.apellidoPaterno,
          apellidoMaterno:  persona.apellidoMaterno,
          celular:          persona.celular,
          carnet:           persona.carnet,
          // (si tienes más campos en Persona, agréguelos aquí)
        },
        create: {
          email:             emailNormalizado,
          nombre:            persona.nombre,
          apellidoPaterno:   persona.apellidoPaterno,
          apellidoMaterno:   persona.apellidoMaterno,
          celular:           persona.celular,
          carnet:            persona.carnet
          // (y cualquier otro campo obligatorio en Persona)
        }
      });

      // ──── 2) Upsert UserN y asignar rol “Competidor” (codRol = 4) ────
      const passwHash = await bcrypt.hash('1234', 10);
      const user = await tx.userN.upsert({
        where: { codPer: per.codPer },
        update: { passwUser: passwHash },
        create: { codPer: per.codPer, passwUser: passwHash }
      });

      await tx.userNRol.upsert({
        where: {
          codUserN_codRol: {
            codUserN: user.codUserN,
            codRol: 4
          }
        },
        update: {},
        create: {
          codUserN: user.codUserN,
          codRol: 4
        }
      });

      // ──── 3) Obtenemos la competencia activa para la gestión actual ────
      const gestion = new Date().getFullYear(); // e.g. 2025
      const comp = await tx.competencia.findFirst({
        where: { gestion },
        select: { codCompet: true, costo: true }
      });
      if (!comp) {
        throw new Error(`No hay competencia activa para la gestión ${gestion}.`);
      }

      // ──── 4) Verificamos que el tutor exista ────
      const tutorRec = await tx.tutor.findUnique({
        where: { codTut: tutorId },
        select: { codTut: true }
      });
      if (!tutorRec) {
        throw new Error(`Tutor no encontrado (codTut: ${tutorId}).`);
      }

      // ──── 5) Por cada { area, nivel } en el arreglo, hacemos: 
      //      a) buscar modalId, b) upsert en Competidor, c) crear Inscripción, d) crear Pago ────
      const inscripcionesCreadas = [];

      for (const { area: nombreArea, nivel } of areas) {
        // 5.a) Buscar el área
        const areaRec = await tx.area.findUnique({
          where: { nombreArea }
        });
        if (!areaRec) {
          throw new Error(`Área no encontrada: ${nombreArea}`);
        }

        // 5.b) Determinar codModal y nivelVal (misma lógica del código original)
        let codModal = null;
        let nivelVal = null;

        // 5.b.i) Intentamos modalidad “regular” (Primaria / Secundaria)
        const m = nivel.match(/^(\d+)(?:ro|to)?\s+(Primaria|Secundaria)$/i);
        if (m) {
          const numero = parseInt(m[1], 10);
          const ciclo = m[2].toUpperCase();
          nivelVal = numero;

          const gradoRec = await tx.grado.findUnique({
            where: { numero_ciclo: { numero, ciclo } }
          });

          if (gradoRec) {
            const modalReg = await tx.modalidadCompetencia.findFirst({
              where: {
                codCompet: comp.codCompet,
                codArea: areaRec.codArea,
                codGrado: gradoRec.codGrado
              }
            });
            if (modalReg) {
              codModal = modalReg.codModal;
            }
          }
        }

        // 5.b.ii) Si no hallamos modalidad “regular”, buscamos nivel especial
        if (!codModal) {
          // Primero intentamos un findExacto
          let ne = await tx.nivelEspecial.findUnique({
            where: { nombreNivel: nivel }
          });
          if (!ne) {
            // Si no hay match exacto, filtramos todos los de esa área y buscamos coincidencias
            const especiales = await tx.nivelEspecial.findMany({
              where: { codArea: areaRec.codArea }
            });
            ne = especiales.find(e => {
              const nombreMin = e.nombreNivel.toLowerCase();
              const buscadoMin = nivel.toLowerCase();
              return (
                nombreMin === buscadoMin ||
                e.gradoRange.toLowerCase().includes(buscadoMin)
              );
            });
          }
          if (!ne) {
            throw new Error(`No existe nivelEspecial para '${nivel}' en el área ${nombreArea}`);
          }

          nivelVal = ne.codNivel;
          let modalEsp = await tx.modalidadCompetencia.findFirst({
            where: {
              codCompet: comp.codCompet,
              codArea: areaRec.codArea,
              codNivelEspecial: ne.codNivel
            }
          });
          if (!modalEsp) {
            modalEsp = await tx.modalidadCompetencia.create({
              data: {
                codCompet: comp.codCompet,
                codArea: areaRec.codArea,
                codNivelEspecial: ne.codNivel
              }
            });
          }
          codModal = modalEsp.codModal;
        }

        if (!codModal) {
          throw new Error(`No se pudo determinar la modalidad para inscripción en área ${nombreArea}`);
        }

        // 5.c) Upsert en Competidor (basado en codPer)
        const compRec = await tx.competidor.upsert({
          where: { codPer: per.codPer },
          update: {
            fechaNac: new Date(fechaNac),
            codMun,
            colegio,
            nivel: nivelVal
          },
          create: {
            codPer: per.codPer,
            fechaNac: new Date(fechaNac),
            codMun,
            colegio,
            grado,
            nivel: nivelVal
          }
        });

        // 5.d) Crear Inscripción
        const ins = await tx.inscripcion.create({
          data: {
            codModal: codModal,
            codTutor: tutorRec.codTut,
            codCompet: comp.codCompet,
            codComp: compRec.codComp,
            estadoInscripcion: 'Pendiente',
            fechaInscripcion: new Date()
          }
        });

        // 5.e) Crear Pago asociado
        await tx.pago.create({
          data: {
            codIns: ins.codIns,
            monto: comp.costo,
            estadoPago: 'Pendiente',
            fechaPago: new Date()
          }
        });

        inscripcionesCreadas.push({
          codIns: ins.codIns,
          codModal,
          codComp: compRec.codComp,
        });
      }

      // 6) Retornamos un objeto con todos los datos de inscripciones
      return {
        persona: {
          codPer: per.codPer,
          email: per.email
        },
        inscripciones: inscripcionesCreadas,
        mensaje: `Se inscribió correctamente en ${areas.length} área(s).`
      };
    }); // fin $transaction

    // Si todo salió bien, devolvemos 201 + resultado
    return res.status(201).json(resultado);

  } catch (error) {
    console.error('[regCompetidorMultiple]', error);
    // Si es Error lanzado con throw new Error(…) en lógica, lo capturamos aquí y devolvemos 400
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
    getMunicipiosByName,
}