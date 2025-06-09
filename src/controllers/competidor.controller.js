
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
    nombre:         true,
    apellidoPaterno:true,
    carnet:         true,
    competidor: {
      select: {
        codComp: true,
        colegio: true,
        // si no necesitas “nivel” dentro del objeto final, puedes quitarlo:
        // nivel:   true,
        inscripciones: {
          where: {
            codTutor: idTutor.codTut
          },
          orderBy: { fechaInscripcion: 'desc' },
          take: 1,
          select: {
            codIns: true,
            estadoInscripcion: true,
            fechaInscripcion:  true,
            modalidad: {
              select: {
                area: {
                  select: { nombreArea: true }
                },
                grado: {
                  select: {
                    numero: true,
                    ciclo:  true
                  }
                },
                nivelEspecial: {
                  select: {
                    nombreNivel:  true,
                    gradoRange:   true
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
                codIns = persona.competidor.inscripciones[0].codIns;
                colegio = persona.competidor.colegio;
                estadoInscripcion = persona.competidor.inscripciones[0].estadoInscripcion;
                fechaInscripcion = persona.competidor.inscripciones[0].fechaInscripcion;
                area = persona.competidor.inscripciones[0].modalidad.area.nombreArea;
                return {
                codComp,
                codIns,
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

const VALID_ESTADOS = ['Pendiente', 'Aceptado', 'Rechazado', 'Verificado'];

const actualizarEstado = async (req, res) => {
  const codIns = parseInt(req.params.id, 10);
  const { estado, motivoRechazo } = req.body;

  // 1. Validaciones básicas
  if (isNaN(codIns)) {
    return res.status(400).json({ message: 'El ID de inscripción debe ser un número entero.' });
  }
  if (!VALID_ESTADOS.includes(estado)) {
    return res.status(400).json({
      message: `Estado inválido. Debe ser uno de: ${VALID_ESTADOS.join(', ')}.`
    });
  }

  // 2. Validación extra si el estado es "Rechazado"
  if (estado === 'Rechazado') {
    if (!motivoRechazo || typeof motivoRechazo !== 'string' || motivoRechazo.trim() === '') {
      return res.status(400).json({
        message: 'Cuando el estado es "Rechazado", debe proporcionarse un motivo de rechazo no vacío.'
      });
    }
  }

  try {
    // 3. Preparamos el objeto `data` para el update
    const dataToUpdate = {
      estadoInscripcion: estado
      // No agregamos `motivoRechazo` aquí todavía
    };

    if (estado === 'Rechazado') {
      // Solo agregamos motivoRechazo cuando el estado es Rechazado
      dataToUpdate.motivoRechazo = motivoRechazo.trim();
    } else {
      dataToUpdate.motivoRechazo = null; 
    }

    // 4. Ejecutamos el update
    const updated = await prisma.inscripcion.update({
      where: { codIns },
      data: dataToUpdate,
    });

    return res.json({
      message: 'Estado de inscripción actualizado correctamente.',
      inscripcion: updated
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Inscripción no encontrada.' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar la inscripción.' });
  }
};


const getComptByEmailCarnet = async (req, res) => {
  const { carnet, email } = req.body;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
      return res.status(400).json({ message: 'El tutor debe ser un número entero.' });
      }

  try {
    const persona = await prisma.persona.findFirst({
      where: {
        carnet: carnet,
        email: email,
        competidor:{
          is:{
            inscripciones:{
              some: {
                tutor:{
                  codPer: id
                }
            }
          }
          }
        }
      },
      select: {
        nombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        email: true,
        carnet: true,
        celular: true,
        competidor: {
          select: {
            codComp: true,
            colegio: true,
            nivel: true,
            fechaNac: true,
            municipio: {
              select: {
                nombreMun: true,
                departamento: {
                  select: { nombreDept: true }
                }
              }
            },
            inscripciones: {
              select: {
                estadoInscripcion: true,
                fechaInscripcion: true,
                motivoRechazo: true,
                tutor: {
                  select: {
                    persona: {
                      select: {
                        nombre: true,
                        apellidoPaterno: true,
                        apellidoMaterno: true,
                        email: true,
                      }
                    }
                  }
                },
                modalidad: {
                  select: {
                    area: {
                      select: { nombreArea: true },
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
                },
                pagos:{
                  select: {
                    estadoPago: true,
                  }
                },
              },
              take: 1 // solo la primera inscripción relevante
            }
          }
        }
      }
    });

    if (!persona) {
      return res.status(404).json({ message: 'Competidor no encontrado.' });
    }

    const inscripcion = persona.competidor?.inscripciones[0];
    const modalidad = inscripcion?.modalidad;
    

    const response = {
      codComp: persona.competidor.codComp,
      estadoInscripcion: inscripcion?.estadoInscripcion || null,
      nombre: `${persona.nombre} ${persona.apellidoPaterno}`,
      carnet: persona.carnet,
      email: persona.email,
      fechaNac: persona.competidor.fechaNac,
      celular: persona.celular,
      emailContacto: inscripcion?.tutor?.persona?.email || null,
      tutorNombre: inscripcion?.tutor?.persona ? 
        `${inscripcion.tutor.persona.nombre} ${inscripcion.tutor.persona.apellidoPaterno} ${inscripcion.tutor.persona.apellidoMaterno}` : null,
      colegio: persona.competidor.colegio,
      gradoRange: modalidad?.nivelEspecial?.gradoRange || null,
      fechaInscripcion: inscripcion?.fechaInscripcion || null,
      area: modalidad?.area?.nombreArea || null,
      departamento: persona.competidor.municipio?.departamento?.nombreDept || null,
      municipio: persona.competidor.municipio?.nombreMun || null,
      estadoPago: inscripcion.pagos[0].estadoPago || null,
      motivoRechazo: inscripcion?.motivoRechazo || null,
    };

    res.json(response);
  } catch (error) {
    console.error('Error al obtener competidor:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
    getCompetidores,
    getComptByTutor,
    getEstadoCompetidores,
    actualizarEstado,
    getComptByEmailCarnet,
}