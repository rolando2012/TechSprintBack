const prisma = require('../base/db');

async function generarNombreCompetenciaUnico(prisma, prefijoBase) {
    // 1) Traemos todos los nombres que empiecen con el prefijoBase
    const existentes = await prisma.competencia.findMany({
      where: {
        nombreCompet: {
          startsWith: prefijoBase
        }
      },
      select: { nombreCompet: true }
    });
  
    if (existentes.length === 0) {
      // no hay ninguno: usamos el prefijo tal cual
      return prefijoBase;
    }
  
    // 2) Extraemos sufijos -N
    const sufijos = existentes.map(({ nombreCompet }) => {
      const match = nombreCompet.match(new RegExp(`^${prefijoBase}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : 1;
    });
  
    // 3) Calculamos el siguiente contador
    const maxSuffix = Math.max(...sufijos);
    const next = maxSuffix + 1;
  
    // 4) Devolvemos con sufijo
    return `${prefijoBase}-${next}`;
  }
  

const regCompetencia = async (req, res) => {
    try {
        const {
          selectedAreas,
          nivelesMap,
          categoriasMap,
          costoConfirmado,
          stages
        } = req.body

        const gestion = new Date().getFullYear();
        const prefijo = `Competencia ${gestion}`;
    
        // Genera un nombre único para pruebas
        const nombreCompet = await generarNombreCompetenciaUnico(prisma, prefijo);
    
        // 1) Crear Competencia
        const competencia = await prisma.competencia.create({
          data: {
            nombreCompet: nombreCompet, // o lo que necesites
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

const getCompetencias = async (req, res) => {
    const competencias = await prisma.competencia.findMany({
        select:{
            codCompet: true,
            nombreCompet: true,
            gestion: true,
            fechaIni: true,
            fechaFin: true,
            costo:true
        }
    })
    res.json(competencias);
}

module.exports ={
    regCompetencia,
    getCompetencias
}