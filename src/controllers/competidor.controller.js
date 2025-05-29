
const prisma = require('../base/db');

const getComptByTutor = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'El tutor debe ser un número entero.' });
        }

    const idTutor = await prisma.tutor.findUnique({
        select:{
            codTut:true
        },where:{
            codPer: id
        }
    })
    
    const competidores = await prisma.persona.findMany({
        where: {
            competidor: {
            inscripciones: {
                some: { codTutor: idTutor.codTut }
            }
            }
        },
        select: {
            nombre: true,
            apellidoPaterno: true,
            carnet: true,
            competidor: {
            select: {
                codComp: true,
                colegio: true,
                nivel: true,
                inscripciones: {
                select: {
                    estadoInscripcion:true,
                    fechaInscripcion: true,
                    modalidad: {
                    select: {
                        area: {
                        select: { nombreArea: true }
                        },
                        grado: {
                        select: {
                            numero: true,
                            ciclo: true
                        }
                        },
                        nivelEspecial: {
                        select: {
                            nombreNivel: true,
                            gradoRange: true
                        }
                        }
                    }
                    }
                }
                }
            }
            }
        }
        });
        


        const flattenedCompetidores = competidores.map((persona) => {
            const { nombre, apellidoPaterno, carnet } = persona;
            let gradoRange = null;
        
            // Verificamos si existe la cadena de relaciones y que haya al menos una inscripción
            if (
                persona.competidor &&
                Array.isArray(persona.competidor.inscripciones) &&
                persona.competidor.inscripciones.length > 0 &&
                persona.competidor.inscripciones[0].modalidad &&
                persona.competidor.inscripciones[0].modalidad.nivelEspecial
                ) {
                gradoRange =
                    persona.competidor.inscripciones[0].modalidad.nivelEspecial.gradoRange;
                }
                codComp = persona.competidor.codComp;
                colegio = persona.competidor.colegio;
                estadoInscripcion = persona.competidor.inscripciones[0].estadoInscripcion;
                fechaInscripcion = persona.competidor.inscripciones[0].fechaInscripcion;
                area = persona.competidor.inscripciones[0].modalidad.area.nombreArea;
                return {
                codComp,
                nombre,
                apellidoPaterno,
                carnet,
                colegio,
                gradoRange,
                estadoInscripcion,
                fechaInscripcion,
                area,
                };
            });
            
        res.json(flattenedCompetidores)
};

const getEstadoCompetidores = async (req, res) =>{
    const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'El tutor debe ser un número entero.' });
  }

  // 1. Buscamos el código interno del tutor
  const tutor = await prisma.tutor.findUnique({
    select: { codTut: true },
    where:  { codPer: id }
  });
  if (!tutor) {
    return res.status(404).json({ message: 'Tutor no encontrado.' });
  }

  // 3. Agrupamos las inscripciones de ese tutor por estado
  const rawCounts = await prisma.inscripcion.groupBy({
    by: ['estadoInscripcion'],
    where: { codTutor: tutor.codTut },
    _count: { estadoInscripcion: true }
  });

  // 4. Construimos el array final de estados, garantizando los tres que nos interesan
  const estados = ['Pendiente', 'Verificado', 'Rechazado'].map(estado => {
    const entry = rawCounts.find(r => r.estadoInscripcion === estado);
    return {
      estado,
      total: entry?._count.estadoInscripcion ?? 0
    };
  });

  // 5. Devolvemos todo en un único JSON
  return res.json({
    estados
  });
};

const getCompetidores = async (req, res) => {
    const datosInscripcion = await prisma.inscripcion.findMany({
        select: {
            //codComp: true,
            fechaInscripcion: true,
            tutor: {
                select: {
                persona: {
                    select: {
                    nombre: true,
                    apellidoMaterno: true,
                    },
                },
                },
            },
            modalidad: {
                select: {
                area:{
                    select:{
                        nombreArea:true,
                    }
                }
                },
            },
            },
        });
        
    const competidores = await prisma.persona.findMany({
        select: {
            codPer: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            carnet: true,
            competidor:{
                select:{
                    codComp:true,
                    colegio: true,
                    nivel: true,
                }
            }
        }, where: {
            competidor: {
              isNot: null
            }
          }
    });
    
    res.json(datosInscripcion);
}

// Estados válidos
const VALID_ESTADOS = ['Pendiente', 'Aceptado', 'Rechazado', 'Verificado'];

const actualizarEstado = async (req, res) => {
  const codIns = parseInt(req.params.id, 10);
  const { estado } = req.body;

  // 1. Validaciones básicas
  if (isNaN(codIns)) {
    return res.status(400).json({ message: 'El ID de inscripción debe ser un número entero.' });
  }
  if (!VALID_ESTADOS.includes(estado)) {
    return res.status(400).json({
      message: `Estado inválido. Debe ser uno de: ${VALID_ESTADOS.join(', ')}.`
    });
  }

  try {
    // 2. Intentamos el update
    const updated = await prisma.inscripcion.update({
      where: { codIns },
      data: { estadoInscripcion: estado }
    });

    // 3. Si todo salió bien, devolvemos la inscripción actualizada
    return res.json({
      message: 'Estado de inscripción actualizado correctamente.',
      //inscripcion: updated
    });
  } catch (error) {
    // 4. Manejo de errores
    if (error.code === 'P2025') {
      // Prisma error: registro no encontrado
      return res.status(404).json({ message: 'Inscripción no encontrada.' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar la inscripción.' });
  }
};


module.exports = {
    getCompetidores,
    getComptByTutor,
    getEstadoCompetidores,
    actualizarEstado,
}