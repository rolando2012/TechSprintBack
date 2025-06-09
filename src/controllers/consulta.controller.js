const prisma = require('../base/db');
const bcrypt = require('bcrypt');
const config = require('../config');

const getAreaByCompetidor = async (req, res) => {
    const rawId = req.params.id;
    const id = Number(rawId);

    if (Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
        error: 'ID de competidor inválido. Debe ser un número entero positivo.',
        received: rawId
        });
    }
    try{
        const codComp = await prisma.competidor.findUnique({
            where: { codPer: id },
            select: { codComp: true }
        });

        if (!codComp) {
            return res.status(404).json({ error: 'Competidor no encontrado' });
        }

        const modalidades = await prisma.inscripcion.findMany({
            where: { codComp: codComp.codComp },
            select: {
                modalidad: {
                    select: {
                        area: {
                            select: {
                                nombreArea: true,
                                codArea: true
                            }
                        }
                    }
                }
            }
        })

        if (modalidades.length === 0) {
            return res.status(404).json({ error: 'No se encontraron modalidades para el competidor' });
        }

        res.json(modalidades.map(m => m.modalidad.area));
    } catch (error) {
    console.error('Error en al obtener areas:', error);
    return res.status(500).json({
        error: 'Ocurrió un error inesperado al obtener las áreas del competidor.'
    });
    }
};

const getCompByPersonaAndArea = async (req, res) => {
  // 1. Extraer y validar parámetros
  const rawId = req.params.id;
  const id = Number(rawId);
  const { nombreArea } = req.body;

  if (Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "El parámetro ‘id’ debe ser un número entero positivo.",
      received: rawId,
    });
  }

  try {
    // 2. Buscar la persona (competidor) por codPer = id
    const persona = await prisma.persona.findUnique({
      where: { codPer: id },
      select: {
        nombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        carnet: true,
        celular: true,
        email: true,
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
                  select: { nombreDept: true },
                },
              },
            },
            // 3. Filtrar inscripciones en las que la modalidad → área tenga el nombre igual a nombreArea
            inscripciones: {
              where: {
                modalidad: {
                  area: {
                    nombreArea: nombreArea.trim(),
                  },
                },
              },
              take: 1, // tomamos solo la primera coincidencia
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
                      },
                    },
                  },
                },
                modalidad: {
                  select: {
                    area: {
                      select: {
                        nombreArea: true,
                        codArea: true,
                      },
                    },
                    grado: {
                      select: {
                        numero: true,
                        ciclo: true,
                      },
                    },
                    nivelEspecial: {
                      select: {
                        nombreNivel: true,
                        gradoRange: true,
                      },
                    },
                  },
                },
                pagos: {
                  select: {
                    estadoPago: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 4. Controles de existencia
    if (!persona) {
      return res.status(404).json({ error: `No se encontró ninguna persona con id ${id}.` });
    }

    if (!persona.competidor) {
      return res
        .status(404)
        .json({ error: `La persona con id ${id} no está registrada como competidor.` });
    }

    const competidor = persona.competidor;
    const inscripciones = competidor.inscripciones;

    if (!Array.isArray(inscripciones) || inscripciones.length === 0) {
      return res.status(404).json({
        error: `No se encontraron inscripciones para el competidor codComp=${competidor.codComp} en el área '${nombreArea}'.`,
      });
    }

    // 5. Tomar la primera inscripcion filtrada
    const inscripcion = inscripciones[0];
    const modalidad = inscripcion.modalidad;
    const tutorPersona = inscripcion.tutor?.persona || null;
    const pago = Array.isArray(inscripcion.pagos) && inscripcion.pagos.length > 0
      ? inscripcion.pagos[0]
      : null;

    // 6. Armar la respuesta con los mismos campos requeridos
    const response = {
      codComp: competidor.codComp,
      estadoInscripcion: inscripcion.estadoInscripcion || null,
      nombreCompetidor: `${persona.nombre} ${persona.apellidoPaterno}${
        persona.apellidoMaterno ? " " + persona.apellidoMaterno : ""
      }`,
      carnet: persona.carnet,
      fechaNac: competidor.fechaNac,
      celular: persona.celular || null,
      emailContacto: persona?.email || null,
      tutorNombre: tutorPersona
        ? `${tutorPersona.nombre} ${tutorPersona.apellidoPaterno}${
            tutorPersona.apellidoMaterno ? " " + tutorPersona.apellidoMaterno : ""
          }`
        : null,
      colegio: competidor.colegio,
      gradoRange: modalidad?.nivelEspecial?.gradoRange || null,
      fechaInscripcion: inscripcion.fechaInscripcion || null,
      area: modalidad?.area?.nombreArea || null,
      departamento: competidor.municipio?.departamento?.nombreDept || null,
      municipio: competidor.municipio?.nombreMun || null,
      estadoPago: pago?.estadoPago || null,
      motivoRechazo: inscripcion.motivoRechazo || null,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error en getCompByPersonaAndArea:", error);
    return res.status(500).json({
      error: "Ocurrió un error interno al procesar la solicitud.",
    });
  }
};

const getEtapaPago = async (req, res) => {
  try {
    // Eliminar la validación de fechas de competencia que causaba el problema
    const comp = await prisma.competencia.findFirst({
      include: {
        etapas: {
          where: { nombreEtapa: "Pago de Inscripciones" },
          take: 1,
        },
      },
    });

    if (!comp || comp.etapas.length === 0) {
      return res.status(404).json({ error: "No hay etapa de Pago de Inscripciones disponible." });
    }

    // Solo nos interesa la primera etapa "Pago de Inscripciones"
    const pagoEtapa = comp.etapas[0];
    return res.status(200).json({
      competenciaNombre: comp.nombreCompet,
      pagoEtapa: {
        fechaInicio: pagoEtapa.fechaInicio.toISOString(),  // e.g. "2025-07-15T00:00:00.000Z"
        horaInicio:  pagoEtapa.horaInicio.toISOString(),   // e.g. "1970-01-01T04:00:00.000Z"
        fechaFin:    pagoEtapa.fechaFin.toISOString(),
        horaFin:     pagoEtapa.horaFin.toISOString(),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getEtapaValidacion = async (req, res) => {
  try {
    // Eliminar la validación de fechas de competencia que causaba el problema
    const comp = await prisma.competencia.findFirst({
      include: {
        etapas: {
          where: { nombreEtapa: "Validación de Requisitos" },
          take: 1,
        },
      },
    });

    if (!comp || comp.etapas.length === 0) {
      return res
        .status(404)
        .json({ error: "No hay etapa de Validación de Requisitos disponible." });
    }

    const etapa = comp.etapas[0];
    return res.json({
      competenciaNombre: comp.nombreCompet,
      validacionEtapa: {
        fechaInicio: etapa.fechaInicio.toISOString(),
        horaInicio: etapa.horaInicio.toISOString(),
        fechaFin: etapa.fechaFin.toISOString(),
        horaFin: etapa.horaFin.toISOString(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getEtapaInscripciones = async (req, res) => {
  try {
    // Eliminar la validación de fechas de competencia que causaba el problema
    const comp = await prisma.competencia.findFirst({
      include: {
        etapas: {
          where: { nombreEtapa: "Inscripciones" },
          take: 1,
        },
      },
    });

    if (!comp || comp.etapas.length === 0) {
      return res
        .status(404)
        .json({ error: "No hay etapa de Inscripciones disponible." });
    }

    const etapa = comp.etapas[0];
    res.json({
      competenciaNombre: comp.nombreCompet,
      inscripcionEtapa: {
        fechaInicio: etapa.fechaInicio.toISOString(),
        horaInicio: etapa.horaInicio.toISOString(),
        fechaFin: etapa.fechaFin.toISOString(),
        horaFin: etapa.horaFin.toISOString(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener competencia específica con sus etapas
async function getCompetenciaById(req, res) {
  try {
    const { codComp } = req.params;
    
    const competencia = await prisma.competencia.findUnique({
      where: { codCompet: parseInt(codComp) },
      include: {
        etapas: {
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!competencia) {
      return res.status(404).json({ error: 'Competencia no encontrada' });
    }

    // Formatear respuesta
    const response = {
      codCompet: competencia.codCompet.toString(),
      nombreCompet: competencia.nombreCompet,
      costo: competencia.costo.toString(),
      fechaIni: competencia.fechaIni.toISOString().split('T')[0],
      fechaFin: competencia.fechaFin.toISOString().split('T')[0],
      gestion: competencia.gestion,
      etapas: competencia.etapas.map(etapa => ({
        codEtapa: etapa.codEtapa,
        nombreEtapa: etapa.nombreEtapa,
        fechaInicio: etapa.fechaInicio.toISOString().split('T')[0],
        fechaFin: etapa.fechaFin.toISOString().split('T')[0],
        orden: etapa.orden,
        estado: etapa.estado
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error al obtener competencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Actualizar competencia
async function updateCompetencia(req, res) {
  try {
    const { codComp } = req.params;
    const { nombreCompet, costo, etapas } = req.body;

    // Validar que la competencia existe
    const competenciaExistente = await prisma.competencia.findUnique({
      where: { codCompet: parseInt(codComp) },
      include: {
        etapas: {
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!competenciaExistente) {
      return res.status(404).json({ error: 'Competencia no encontrada' });
    }

    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    // Verificar si alguna etapa ya comenzó o está en curso
    const etapaEnCursoOPasada = competenciaExistente.etapas.some(etapa => {
      const fechaInicio = new Date(etapa.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      return fechaInicio <= fechaActual;
    });

    // Si hay etapas en curso o pasadas, no permitir editar fechas
    let puedeEditarFechas = !etapaEnCursoOPasada;

    // Validar que las fechas de etapas no se sobrepongan (solo si se pueden editar fechas)
    if (puedeEditarFechas && etapas && etapas.length > 0) {
      const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden);
      
      for (let i = 0; i < etapasOrdenadas.length - 1; i++) {
        const etapaActual = etapasOrdenadas[i];
        const etapaSiguiente = etapasOrdenadas[i + 1];
        
        const finActual = new Date(etapaActual.fechaFin);
        const inicioSiguiente = new Date(etapaSiguiente.fechaInicio);
        
        if (finActual >= inicioSiguiente) {
          return res.status(400).json({
            error: 'Las fechas de las etapas se sobrelapan',
            detalles: `La etapa "${etapaActual.nombreEtapa}" termina después de que inicie "${etapaSiguiente.nombreEtapa}"`
          });
        }
      }
    }

    // Actualizar competencia
    const dataToUpdate = {
      nombreCompet,
      costo: parseFloat(costo)
    };

    // Solo actualizar fechas si es permitido
    if (puedeEditarFechas && etapas && etapas.length > 0) {
      const primeraEtapa = etapas.find(e => e.orden === 1);
      const ultimaEtapa = etapas.reduce((max, etapa) => 
        etapa.orden > max.orden ? etapa : max, etapas[0]);
      
      if (primeraEtapa && ultimaEtapa) {
        dataToUpdate.fechaIni = new Date(primeraEtapa.fechaInicio);
        dataToUpdate.fechaFin = new Date(ultimaEtapa.fechaFin);
      }
    }

    await prisma.$transaction(async (tx) => {
      // Actualizar competencia
      await tx.competencia.update({
        where: { codCompet: parseInt(codComp) },
        data: dataToUpdate
      });

      // Actualizar etapas solo si se pueden editar fechas
      if (puedeEditarFechas && etapas && etapas.length > 0) {
        for (const etapa of etapas) {
          await tx.etapaCompetencia.update({
            where: { codEtapa: etapa.codEtapa },
            data: {
              fechaInicio: new Date(etapa.fechaInicio),
              fechaFin: new Date(etapa.fechaFin)
            }
          });
        }
      }
    });

    res.json({ 
      message: 'Competencia actualizada exitosamente',
      puedeEditarFechas 
    });

  } catch (error) {
    console.error('Error al actualizar competencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports ={
    getAreaByCompetidor,
    getCompByPersonaAndArea,
    getEtapaPago,
    getEtapaValidacion,
    getEtapaInscripciones,
    getCompetenciaById,
    updateCompetencia,
}