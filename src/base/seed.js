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
      fechaIni: new Date("2025-05-15"),      // inicio de inscripciones
      fechaFin: new Date("2025-06-29"),      // fin de última etapa (Competición)
      horaIniIns: new Date("2025-05-15T00:00:00"),
      horaFinIns: new Date("2025-06-29T23:59:59"),
      costo: 16.0,
      gestion: 2025,
    },
  });

  // 4) Crear Nuevas Etapas
  const etapas = [
    {
      nombreEtapa: "Inscripciones",
      descripcion: "Periodo de inscripciones de competidores",
      fechaInicio: new Date("2025-06-05"),
      horaInicio: new Date("2025-06-05T00:00:00"),
      fechaFin: new Date("2025-06-13"),
      horaFin: new Date("2025-06-13T23:59:59"),
      orden: 1,
      estado: "active",
    },
    {
      nombreEtapa: "Validación de Requisitos",
      descripcion: "Validación de requisitos y aceptación por tutores",
      fechaInicio: new Date("2025-06-14"),
      horaInicio: new Date("2025-06-14T00:00:00"),
      fechaFin: new Date("2025-06-18"),
      horaFin: new Date("2025-06-18T23:59:59"),
      orden: 2,
      estado: "pending",
    },
    {
      nombreEtapa: "Pago de Inscripciones",
      descripcion: "Periodo de pago de inscripciones",
      fechaInicio: new Date("2025-06-19"),
      horaInicio: new Date("2025-06-19T00:00:00"),
      fechaFin: new Date("2025-06-23"),
      horaFin: new Date("2025-06-23T23:59:59"),
      orden: 3,
      estado: "pending",
    },
    {
      nombreEtapa: "Competición",
      descripcion: "Periodo de competición",
      fechaInicio: new Date("2025-06-24"),
      horaInicio: new Date("2025-06-24T00:00:00"),
      fechaFin: new Date("2025-06-29"),
      horaFin: new Date("2025-06-29T23:59:59"),
      orden: 4,
      estado: "pending",
    },
  ];

  for (const e of etapas) {
    await prisma.etapaCompetencia.upsert({
      where: {
        nombreEtapa_codCompetencia: {
          nombreEtapa: e.nombreEtapa,
          codCompetencia: comp.codCompet,
        }
      },
      update: {},
      create: {
        codCompetencia: comp.codCompet,
        ...e,
      },
    }).catch(async () => {
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
