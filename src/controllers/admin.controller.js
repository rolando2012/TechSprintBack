const prisma = require('../base/db');

const regCompetencia = async (req, res) => {
    try {
        const {
          selectedAreas,
          nivelesMap,
          categoriasMap,
          costoConfirmado,
          stages
        } = req.body
    
        // 1) Crear Competencia
        const competencia = await prisma.competencia.create({
          data: {
            nombreCompet: `Competencia ${new Date().getFullYear()}`, // o lo que necesites
            fechaIni: new Date(stages[0].startDate),
            fechaFin: new Date(stages[stages.length - 1].endDate),
            horaIniIns: new Date(`1970-01-01T${stages[0].startTime}:00`),
            horaFinIns: new Date(`1970-01-01T${stages[stages.length - 1].endTime}:00`),
            costo: costoConfirmado,
            gestion: new Date().getFullYear(),
            // Relaciones a áreas
            areas: {
              create: selectedAreas.map(nombreArea => ({
                area: { connect: { nombreArea } }
              }))
            },
            // Aquí podrías mapear nivelesMap y categoriasMap según tu lógica...
          }
        })
    
        // 2) Crear Etapas
        await Promise.all(stages.map(s =>
          prisma.etapaCompetencia.create({
            data: {
              codCompetencia: competencia.codCompet,
              nombreEtapa:    s.name,
              fechaInicio:    new Date(s.startDate),
              horaInicio:     new Date(`1970-01-01T${s.startTime}:00`),
              fechaFin:       new Date(s.endDate),
              horaFin:        new Date(`1970-01-01T${s.endTime}:00`),
              orden:          s.id,
              estado:         'ACTIVO'
            }
          })
        ))
    
        return res.status(201).json({ competencia })
      } catch (error) {
        console.error('[POST /competencia]', error)
        return res.status(500).json({ error: error.message })
      }

}

module.exports ={
    regCompetencia,

}