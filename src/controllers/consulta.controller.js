const prisma = require('../base/db');
const bcrypt = require('bcrypt');
const config = require('../config');

const getAreaByCompetidor = async (req, res) => {
    const id = parseInt(req.params.id, 10);

    const codComp = await prisma.competidor.findUnique({
        where: { codPer: id },
        select: { codComp: true }
    });

    try{
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
    // 6. En caso de excepción, devolvemos 500 y registramos el error
    console.error('Error en getAreaByCompetidor:', error);
    return res.status(500).json({
        error: 'Ocurrió un error inesperado al obtener las áreas del competidor.'
    });
    }
};

module.exports ={
    getAreaByCompetidor,
}