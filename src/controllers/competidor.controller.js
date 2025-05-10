
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
                colegio: true,
                nivel: true,
                inscripciones: {
                select: {
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
                colegio = persona.competidor.colegio
            
                return {
                nombre,
                apellidoPaterno,
                carnet,
                colegio,
                gradoRange,
                };
            });
            
        res.json(flattenedCompetidores)
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

module.exports = {
    getCompetidores,
    getComptByTutor
}