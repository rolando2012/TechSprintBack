const prisma = require('../base/db');

const getComptAprobados = async (req, res) => {
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
                    estadoPago: 'Pagado'
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
                fechaInscripcion: true,
                pagos:{
                    take: 1,
                    select:{
                        monto: true,
                        estadoPago: true
                    }
                },
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

      const pago = inscrip.pagos[0] || {};
      return {
        codComp: persona.competidor.codComp,
        nombre,
        apellidoPaterno,
        carnet,
        colegio: persona.competidor.colegio,
        gradoRange,
        fechaInscripcion: inscrip.fechaInscripcion || null,
        area: inscrip.modalidad?.area?.nombreArea || null,
        monto: pago.monto || null,
        estadoPago: pago.estadoPago || null ,
      };
    });

    res.json(flattenedCompetidores);
  } catch (error) {
    console.error('Error al obtener competidor:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getPagoStats = async (req, res) => {
  try {
    // 1) Total de registros en Pago
    const totalRegistros = await prisma.pago.count();

    // 2) Cantidad de pagos exitosos
    //    Aquí asumimos que “exitoso” es cuando estadoPago === "Exitoso".
    //    Cámbialo por "Pagado" o la cadena que uses en tu BD si fuera distinto.
    const pagosExitosos = await prisma.pago.count({
      where: {
        estadoPago: "Pagado",
      },
    });

    // 3) Suma de montos de los pagos exitosos
    const sumaExitosos = await prisma.pago.aggregate({
      where: {
        estadoPago: "Pagado",
      },
      _sum: {
        monto: true,
      },
    });

    // _sum.monto vendrá como null si no hay registros; le asignamos 0 en ese caso
    const totalRecaudado = sumaExitosos._sum.monto ?? 0;

    // Formateamos el output para que muestre dos decimales y el “Bs.”
    const totalRecaudadoFormateado = totalRecaudado.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return res.json({
      totalRegistros,                        // e.g. 10
      pagosExitosos,                         // e.g. 9
      totalRecaudado: `Bs. ${totalRecaudadoFormateado}` // e.g. "Bs. 1390.00"
    });
  } catch (error) {
    console.error("Error al calcular estadísticas de Pago:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

module.exports ={
    getComptAprobados,
    getComptHabilitados,
    getPagoStats,
}