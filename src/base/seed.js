const path = require("path");
const fs = require("fs/promises");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedPrimeraCompetencia() {
  // 3) Primera Competencia
  const comp = await prisma.competencia.upsert({
    where: { nombreCompet: "Olimpiada de Ciencia y Tecnología" },
    update: {},
    create: {
      nombreCompet: "Olimpiada de Ciencia y Tecnología",
      fechaIni: new Date("2025-04-15"),      // inicio de inscripciones
      fechaFin: new Date("2025-04-30"),      // fin de inscripciones
      horaIniIns: new Date("2025-04-15T00:00:00"),
      horaFinIns: new Date("2025-04-30T23:59:59"),
      costo: 16.0,
      gestion: 2025,
    },
  });

  // 4) Crear Etapas
  const etapas = [
    {
      nombreEtapa: "Etapa Clasificatoria",
      descripcion: "Pruebas presenciales. Lugar: Campus de la UMSS",
      fechaInicio: new Date("2025-05-31"),
      horaInicio: new Date("2025-05-31T09:00:00"),
      fechaFin: new Date("2025-05-31"),
      horaFin: new Date("2025-05-31T17:00:00"),
      orden: 1,
      estado: "Activo",
    },
    {
      nombreEtapa: "Etapa Final",
      descripcion: "Pruebas presenciales. Lugar: Campus de la UMSS",
      fechaInicio: new Date("2025-07-11"),
      horaInicio: new Date("2025-07-11T09:00:00"),
      fechaFin: new Date("2025-07-11"),
      horaFin: new Date("2025-07-11T17:00:00"),
      orden: 2,
      estado: "Activo",
    },
    {
      nombreEtapa: "Premiación",
      descripcion: "Ceremonia de entrega de diplomas y medallas. Lugar: Campus de la UMSS",
      fechaInicio: new Date("2025-07-11"),
      horaInicio: new Date("2025-07-11T15:00:00"),
      fechaFin: new Date("2025-07-11"),
      horaFin: new Date("2025-07-11T17:00:00"),
      orden: 3,
      estado: "Activo",
    },
  ];

  for (const e of etapas) {
    await prisma.etapaCompetencia.upsert({
      where: {
        codEtapa: {
          // no hay campo compueso en la PK, así que buscamos por nombre+competencia
        },
      },
      update: {},
      create: {
        codCompetencia: comp.codCompet,
        ...e,
      },
    }).catch(async () => {
      // fallback a create si upsert falla
      await prisma.etapaCompetencia.create({
        data: { codCompetencia: comp.codCompet, ...e },
      });
    });
  }
}


async function seedDepartamentos() {
  const data = JSON.parse(
    await fs.readFile(path.join(__dirname, "../../data/departamentos.json"), "utf8")
  );

  for (const { departamento, municipios } of data) {
    const dept = await prisma.departamento.upsert({
      where: { nombreDept: departamento },
      update: {},
      create: { nombreDept: departamento },
    });

    for (const nombreMun of municipios) {
      await prisma.municipio.upsert({
        where: {
          nombreMun_codDept: {
            nombreMun,
            codDept: dept.codDept,
          },
        },
        update: {},
        create: {
          nombreMun,
          codDept: dept.codDept,
        },
      });
    }
  }
}

async function main() {
  console.log("🌱 Seed de Departamentos y Municipios...");
  await seedDepartamentos();
  console.log("🌱 Seed de Primera Competencia y Etapas...");
  await seedPrimeraCompetencia();
  console.log("✅ Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
