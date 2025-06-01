const prisma = require('../base/db');

const getComptHabilitados = async (req, res) => {
  try {
    const competidores = await prisma.persona.findMany({
      where: {
        competidor: {
          is: {
            inscripciones: {
              some: {
                // 1) Filtrar estadoInscripcion en Verificado o Aprobado:
                estadoInscripcion: { in: ['Verificado', 'Aprobado'] },
                // 2) Y además que esa misma inscripción tenga algún pago Pendiente:
                pagos: {
                  some: {
                    estadoPago: 'Pendiente'
                  }
                }
              }
            }
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
              take: 1,
              select: {
                estadoInscripcion: true,
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
      const inscrip = persona.competidor.inscripciones[0] || {};
      let gradoRange = null;

      if (
        inscrip.modalidad &&
        inscrip.modalidad.nivelEspecial
      ) {
        gradoRange = inscrip.modalidad.nivelEspecial.gradoRange;
      }

      return {
        codComp: persona.competidor.codComp,
        nombre,
        apellidoPaterno,
        carnet,
        colegio: persona.competidor.colegio,
        gradoRange,
        estadoInscripcion: inscrip.estadoInscripcion || null,
        fechaInscripcion: inscrip.fechaInscripcion || null,
        area: inscrip.modalidad?.area?.nombreArea || null
      };
    });

    res.json(flattenedCompetidores);
  } catch (error) {
    console.error('Error al obtener competidor:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};


module.exports ={
    getComptHabilitados,
}