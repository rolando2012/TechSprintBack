const path = require("path");
const fs = require("fs/promises");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedDepartamentos() {
  const data = JSON.parse(
    await fs.readFile(path.join(__dirname, "../data/departamentos.json"), "utf8")
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

async function seedCatalogo() {
  const catalogo = JSON.parse(
    await fs.readFile(path.join(__dirname, "../data/catalogo.json"), "utf8")
  );

  for (const nombreArea of catalogo.areas) {
    await prisma.area.upsert({
      where: { nombreArea },
      update: {},
      create: { nombreArea },
    });
  }
  for (const nombreNivel of catalogo.niveles) {
    await prisma.nivel.upsert({
      where: { nombreNivel },
      update: {},
      create: { nombreNivel },
    });
  }
  for (const nombreGrado of catalogo.grados) {
    await prisma.grado.upsert({
      where: { nombreGrado },
      update: {},
      create: { nombreGrado },
    });
  }
}

async function main() {
  console.log("🌱 Seed de Departamentos y Municipios...");
  await seedDepartamentos();
  console.log("🌱 Seed de Área, Nivel y Grado...");
  await seedCatalogo();
  console.log("✅ Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
