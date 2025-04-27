const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
