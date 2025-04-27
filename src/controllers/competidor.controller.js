const { get } = require('../app');
const prisma = require('../base/db');

const getCompetidores = async (req, res) => {
    const competidores = await prisma.persona.findMany({
        select: {
            codPer: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            celular: true,
            email: true,
            competidor:{
                select:{
                    codMun:true,
                    fechaNac: true,
                    colegio: true,
                }
            }
        }, where: {
            competidor: {
              isNot: null
            }
          }
    });
    res.json(competidores);
}

module.exports = {
    getCompetidores
}