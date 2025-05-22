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
    ciclo: cicloSuf === 'P' ? 'Primaria' : 'Secundaria'
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
        // Grados numéricos regulares
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

      } else if (['Informática', 'Robótica'].includes(area)) {
        // Niveles especiales (solo Informática y Robótica)
        await prisma.nivelEspecial.upsert({
          where: { nombreNivel: nivel },
          create: {
            nombreNivel: nivel,
            gradoRange: grado,
            codArea: areaRec.codArea
          },
          update: { gradoRange: grado }
        });
      }
      // Otros niveles especiales (antes Matemáticas) se omiten
    }
  }

  console.log('Seed completado.');

  // Asociación masiva Competencia <-> Área, idempotente
  const competencias = await prisma.competencia.findMany({ select: { codCompet: true } });
  const areas = await prisma.area.findMany({ select: { codArea: true } });

  const upserts = [];
  for (const c of competencias) {
    for (const a of areas) {
      upserts.push(
        prisma.competenciaArea.upsert({
          where: { codCompet_codArea: { codCompet: c.codCompet, codArea: a.codArea } },
          create: { codCompet: c.codCompet, codArea: a.codArea },
          update: {}
        })
      );
    }
  }
  await prisma.$transaction(upserts);

  console.log('✔️ CompetenciaArea llenada exitosamente (idempotente).');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());