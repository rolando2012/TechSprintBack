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
      emailContacto: tutorPersona?.email || null,
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


module.exports ={
    getAreaByCompetidor,
    getCompByPersonaAndArea,
}