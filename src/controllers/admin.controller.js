const prisma = require('../base/db'); 
const { Prisma } = require('@prisma/client');
const bcrypt = require('bcrypt');

const regCompetencia = async (req, res) => {
  try {
    const { nombre, nivelesMap, categoriasMap, costoConfirmado, stages } = req.body

    // 1) Crear Competencia (sin áreas ya que las quitaste)
    const competencia = await prisma.competencia.create({
      data: {
        nombreCompet: nombre,
        fechaIni:     new Date(stages[0].startDate),
        fechaFin:     new Date(stages[stages.length - 1].endDate),
        horaIniIns:   new Date(`1970-01-01T${stages[0].startTime}:00`),
        horaFinIns:   new Date(`1970-01-01T${stages[stages.length - 1].endTime}:00`),
        costo:        costoConfirmado,
        gestion:      new Date().getFullYear(),
      }
    })

    // 2) Crear Etapas...
    await Promise.all(stages.map(s =>
      prisma.etapaCompetencia.create({
        data: {
          codCompetencia: competencia.codCompet,
          nombreEtapa:    s.name,
          fechaInicio:    new Date(s.startDate),
          horaInicio:     new Date(`1970-01-01T${s.startTime}:00`),
          fechaFin:       new Date(s.endDate),
          horaFin:        new Date(`1970-01-01T${s.endTime}:00`),
          orden:          s.id,
          estado:         'ACTIVO',
        }
      })
    ))

    // 3) Guardar Grados + Área con createMany y skipDuplicates
    const gradosToInsert = []

    for (const [nombreArea, gradoList] of Object.entries(nivelesMap)) {
      // 1) Busco el codArea para cada área
      const area = await prisma.area.findUnique({
        where: { nombreArea }
      })
      if (!area) continue

      for (const gradoNumStr of gradoList) {
        const numero = parseInt(gradoNumStr, 10)
        if (isNaN(numero)) continue
        const ciclo = numero <= 6 ? 'Primaria' : 'Secundaria'

        // 2) Busco el codGrado por la clave compuesta (numero, ciclo)
        const grado = await prisma.grado.findUnique({
          where: {
            numero_ciclo: { numero, ciclo }
          }
        })
        if (!grado) continue

        // 3) Acumulo la tupla (codCompet, codArea, codGrado)
        gradosToInsert.push({
          codCompet: competencia.codCompet,
          codArea:   area.codArea,
          codGrado:  grado.codGrado
        })
      }
    }

    if (gradosToInsert.length) {
      await prisma.competenciaGrado.createMany({
        data: gradosToInsert,
        skipDuplicates: true
      })
    }

    // 4) Guardar Niveles Especiales: CompetenciaNivelEspecial
    for (const [areaName, niveles] of Object.entries(categoriasMap)) {
      for (const nombreNivel of niveles) {
        const nivel = await prisma.nivelEspecial.findUnique({
          where: { nombreNivel }
        })
        if (nivel) {
          await prisma.competenciaNivelEspecial.create({
            data: {
              codCompet: competencia.codCompet,
              codNivel:  nivel.codNivel
            }
          })
        }
      }
    }

    return res.status(201).json({ competencia })

  } catch (error) {
    console.error('[POST /competencia]', error)
    return res.status(500).json({ error: error.message })
  }
}


const checkNombreUnico = async (req, res) => {
  try {
    const { nombre } = req.body
    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({ error: 'Nombre inválido' })
    }

    const existing = await prisma.competencia.findUnique({
      where: { nombreCompet: nombre }
    })

    // Si existe, unique = false; si no, true
    return res.status(200).json({ unique: existing ? false : true })
  } catch (error) {
    console.error('[POST /competencia/validar-nombre]', error)
    return res.status(500).json({ error: 'Error validando el nombre' })
  }
}

const getCompetencias = async (req, res) => {
    const competencias = await prisma.competencia.findMany({
        select:{
            codCompet: true,
            nombreCompet: true,
            gestion: true,
            fechaIni: true,
            fechaFin: true,
            costo:true
        }
    })
    res.json(competencias);
}

const getGrados = async (req, res) => {
  const grados = await prisma.area.findMany({
    where: {
      areaGrado: {
        some: {}              // “some” sin condiciones devuelve áreas con ≥1 areaGrado
      }
    },
    select: {
      nombreArea: true,
      areaGrado: {
        select: {
          grado: {
            select: {
              numero: true,
              ciclo: true,
            }
          }
        }
      }
    }
  });

  res.json(grados);
};

const getNiveles = async (req, res) => {
  const grados = await prisma.area.findMany({
    where: {
      nivelesEspeciales: {
        some: {}              // “some” sin condiciones devuelve áreas con ≥1 areaGrado
      }
    },
    select: {
      nombreArea: true,
      nivelesEspeciales: {
        select: {
          nombreNivel: true,
          gradoRange: true,
        }
      }
    }
  });

  res.json(grados);
};

const registrarTutor = async (req, res) => {
   const {
    nombres, apellidoPaterno, apellidoMaterno,
    celular, email, carnet, institucion,
    municipio, area
  } = req.body;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1) crea persona
      const persona = await tx.persona.create({
        data: {
          nombre:           nombres,
          apellidoPaterno,
          apellidoMaterno,
          celular,
          email,
          carnet,
        }
      });

      // 2) busca codMun
      const found = await tx.municipio.findFirst({
        where: { nombreMun: municipio },
        select: { codMun: true }
      });
      if (!found) {
        throw new Error(`Municipio \"${municipio}\" no existe`);
      }

      // 3) crea tutor
      const tutor = await tx.tutor.create({
        data: {
          codPer:      persona.codPer,
          institucion,
          codMun:      found.codMun,
          codArea:     parseInt(area, 10),
        }
      });

      // 4) Hashea la contraseña (usamos el carnet como pass)
      const hashed = await bcrypt.hash(carnet, 10);

      // 5) Crea el usuario en UserN
      const userN = await tx.userN.create({
        data: {
          codPer:      persona.codPer,
          passwUser:   hashed,
        }
      });

      // 6) Asigna el rol de tutor (codRol = 3)
      const userNRol = await tx.userNRol.create({
        data: {
          codUserN:    userN.codUserN,
          codRol:      3,
        }
      });

      return { persona, tutor, userN, userNRol };
    });

    return res.status(201).json({
      message: 'Tutor, usuario y rol creados con éxito',
      data: resultado
    });
  } catch (error) {
    console.error('Error registrando tutor:', error);

    // Constraint de email único
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      error.meta.target.includes('email')
    ) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Error de municipio no encontrado u otros
    return res.status(400).json({ error: error.message || 'Error en el registro' });
  }
}

const getCompetencia = async (req, res) =>{
const comp = await prisma.competencia.findFirst({ orderBy: { codCompet: 'asc' } });
  if (!comp) return res.status(404).json({ error: 'No hay competencias' });
  res.json(comp);
};

const getEtapas = async (req, res) =>{
  const id = Number(req.params.id);
  const etapas = await prisma.etapaCompetencia.findMany({
    where: { codCompetencia: id },
    orderBy: { orden: 'asc' },
  });
  res.json(etapas);
};

module.exports ={
    regCompetencia,
    getCompetencias,
    getGrados,
    getNiveles,
    checkNombreUnico,
    registrarTutor,
    getCompetencia,
    getEtapas,
}