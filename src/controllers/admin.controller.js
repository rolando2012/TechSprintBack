const prisma = require('../base/db'); 
const { Prisma } = require('@prisma/client');
const bcrypt = require('bcrypt');

const regCompetencia = async (req, res) => {
  const { nombre, nivelesMap, categoriasMap, costoConfirmado, stages } = req.body;

  const fechaIni = new Date(stages[0].startDate);
  const fechaFin = new Date(stages[stages.length - 1].endDate);

  try {
    // Validar si alguna etapa se solapa con otra competencia ya registrada
    const conflictos = await prisma.competencia.findFirst({
      where: {
        OR: [
          {
            fechaIni: { lte: fechaFin },
            fechaFin: { gte: fechaIni }
          }
        ]
      }
    });

    if (conflictos) {
      return res.status(400).json({ error: 'El rango de fechas se solapa con otra competencia existente.' });
    }

    // Ejecutar todo como una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1) Crear competencia
      const competencia = await tx.competencia.create({
        data: {
          nombreCompet: nombre,
          fechaIni,
          fechaFin,
          horaIniIns: new Date(`1970-01-01T${stages[0].startTime}:00`),
          horaFinIns: new Date(`1970-01-01T${stages[stages.length - 1].endTime}:00`),
          costo: costoConfirmado,
          gestion: new Date().getFullYear()
        }
      });

      // 2) Crear etapas
      await Promise.all(stages.map(stage =>
        tx.etapaCompetencia.create({
          data: {
            codCompetencia: competencia.codCompet,
            nombreEtapa: stage.name,
            fechaInicio: new Date(stage.startDate),
            horaInicio: new Date(`1970-01-01T${stage.startTime}:00`),
            fechaFin: new Date(stage.endDate),
            horaFin: new Date(`1970-01-01T${stage.endTime}:00`),
            orden: stage.id,
            estado: 'ACTIVO'
          }
        })
      ));

      // 3) Insertar grados por área
      const gradosToInsert = [];

      for (const [nombreArea, gradoList] of Object.entries(nivelesMap)) {
        const area = await tx.area.findUnique({
          where: { nombreArea }
        });
        if (!area) continue;

        for (const gradoNumStr of gradoList) {
          const numero = parseInt(gradoNumStr, 10);
          if (isNaN(numero)) continue;
          const ciclo = numero <= 6 ? 'Primaria' : 'Secundaria';

          const grado = await tx.grado.findUnique({
            where: {
              numero_ciclo: { numero, ciclo }
            }
          });
          if (!grado) continue;

          gradosToInsert.push({
            codCompet: competencia.codCompet,
            codArea: area.codArea,
            codGrado: grado.codGrado
          });
        }
      }

      if (gradosToInsert.length) {
        await tx.competenciaGrado.createMany({
          data: gradosToInsert,
          skipDuplicates: true
        });
      }

      // 4) Guardar niveles especiales
      for (const [areaName, niveles] of Object.entries(categoriasMap)) {
        for (const nombreNivel of niveles) {
          const nivel = await tx.nivelEspecial.findUnique({
            where: { nombreNivel }
          });
          if (nivel) {
            await tx.competenciaNivelEspecial.create({
              data: {
                codCompet: competencia.codCompet,
                codNivel: nivel.codNivel
              }
            });
          }
        }
      }

      return competencia;
    });

    return res.status(201).json({ competencia: resultado });

  } catch (error) {
    console.error('[POST /competencia]', error);
    return res.status(500).json({ error: error.message });
  }
};

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