const path = require("path");
const fs = require("fs/promises");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function esNivelRegular(nivel) {
  return /^\d+[PS]$/.test(nivel);
}
function parsearNivelRegular(nivel) {
  const [, numStr, cicloSuf] = nivel.match(/^(\d+)([PS])$/);
  return {
    numero: +numStr,
    ciclo: cicloSuf === 'P' ? 'PRIMARIA' : 'SECUNDARIA'
  };
}

async function main() {
  const file = path.join(__dirname, '../../data/area-grado-nivel.json');
  const catalog = JSON.parse(await fs.readFile(file, 'utf8'));

  for (const { area, items } of catalog) {
    const areaRec = await prisma.area.upsert({
      where: { nombreArea: area },
      create: { nombreArea: area },
      update: {}
    });

    for (const { nivel, grado } of items) {
      if (esNivelRegular(nivel)) {
        // => Grados numéricos
        const { numero, ciclo } = parsearNivelRegular(nivel);
        const gradoRec = await prisma.grado.upsert({
          where: { numero_ciclo: { numero, ciclo } },
          create: { numero, ciclo },
          update: {}
        });
        await prisma.areaGrado.upsert({
          where: {
            codArea_codGrado: { codArea: areaRec.codArea, codGrado: gradoRec.codGrado }
          },
          create: { codArea: areaRec.codArea, codGrado: gradoRec.codGrado },
          update: {}
        });

      } else {
        // => Niveles especiales, guardo también el string de rango de grados
        await prisma.nivelEspecial.upsert({
          where: { nombreNivel: nivel },
          create: {
            nombreNivel: nivel,
            gradoRange: grado,       // <--- aquí
            codArea: areaRec.codArea
          },
          update: { gradoRange: grado } // actualizo por si cambió el texto
        });
      }
    }
  }

  console.log('Seed completado.');

  const competencias = await prisma.competencia.findMany({
    select: {
      codCompet: true, 
    },
  });

  const areas = await prisma.area.findMany({
    select: {
      codArea: true, 
    },
  });

  for (const competencia of competencias) {
    for (const area of areas) {
      await prisma.competenciaArea.create({
        data: {
          codCompet: competencia.codCompet, 
          codArea: area.codArea,

        },
      });
      console.log(`Asociado Competencia ${competencia.codCompet} con Área ${area.codArea}`);
    }
  }

  console.log('✔️ CompetenciaArea llenada exitosamente.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
