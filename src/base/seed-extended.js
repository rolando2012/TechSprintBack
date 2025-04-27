// src/base/seed-extended.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Genera el hash de la contraseña
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Seed del catálogo académico: Area, Grado, Nivel y relaciones AreaGrado, GradoNivel
async function seedAcademicCatalog() {
  const file = path.join(__dirname, '../../data/area-grado-nivel.json');
  const catalog = JSON.parse(await fs.readFile(file, 'utf8'));

  for (const { area, items } of catalog) {
    // Upsert de Área
    const areaRec = await prisma.area.upsert({
      where: { nombreArea: area },
      update: {},
      create: { nombreArea: area }
    });

    for (const { nivel, grado } of items) {
      // Upsert de Nivel
      const nivelRec = await prisma.nivel.upsert({
        where: { nombreNivel: nivel },
        update: {},
        create: { nombreNivel: nivel }
      });

      // Upsert de Grado
      const gradoRec = await prisma.grado.upsert({
        where: { nombreGrado: grado },
        update: {},
        create: { nombreGrado: grado }
      });

      // Relación AreaGrado
      await prisma.areaGrado.upsert({
        where: { codArea_codGrado: { codArea: areaRec.codArea, codGrado: gradoRec.codGrado } },
        update: {},
        create: { codArea: areaRec.codArea, codGrado: gradoRec.codGrado }
      });

      // Relación GradoNivel
      await prisma.gradoNivel.upsert({
        where: { codGrado_codNivel: { codGrado: gradoRec.codGrado, codNivel: nivelRec.codNivel } },
        update: {},
        create: { codGrado: gradoRec.codGrado, codNivel: nivelRec.codNivel }
      });
    }
  }
}

async function main() {
  // 0) Seed catálogo académico
  await seedAcademicCatalog();

  // 1) Crear roles
  const rolesMap = {};
  for (const tipo of ['Administrador','Cajero','Tutor','Competidor']) {
    const rol = await prisma.rol.upsert({
      where: { nombreRol: tipo },
      update: {},
      create: { nombreRol: tipo }
    });
    rolesMap[tipo] = rol.codRol;
  }

  // 2) Leer datos iniciales
  const dataPath = path.join(__dirname, '../../data/initial.json');
  const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

  // 3) Seed Administradores y Cajeros
  for (const u of data.users) {
    const per = await prisma.persona.upsert({ where: { carnet: u.persona.carnet }, update: {}, create: u.persona });
    const hashed = await hashPassword('1234');
    const user = await prisma.userN.upsert({
      where: { codPer: per.codPer },
      update: { passwUser: hashed, codSis: u.codSis },
      create: { codPer: per.codPer, passwUser: hashed, codSis: u.codSis }
    });
    await prisma.userNRol.upsert({
      where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap[u.tipo] } },
      update: {},
      create: { codUserN: user.codUserN, codRol: rolesMap[u.tipo] }
    });
    if (u.tipo === 'Administrador') {
      await prisma.administrador.upsert({ where: { codPer: per.codPer }, update: {}, create: { codPer: per.codPer } });
    } else {
      await prisma.cajero.upsert({ where: { codPer: per.codPer }, update: {}, create: { codPer: per.codPer } });
    }
  }

  // 4) Seed Tutores
  const tutorMap = {};
  for (const t of data.tutores) {
    const per = await prisma.persona.upsert({ where: { carnet: t.persona.carnet }, update: {}, create: t.persona });
    const hashed = await hashPassword('1234');
    const user = await prisma.userN.upsert({
      where: { codPer: per.codPer },
      update: { passwUser: hashed, codSis: 'TS-TUT' },
      create: { codPer: per.codPer, passwUser: hashed, codSis: 'TS-TUT' }
    });
    await prisma.userNRol.upsert({
      where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap['Tutor'] } },
      update: {},
      create: { codUserN: user.codUserN, codRol: rolesMap['Tutor'] }
    });
    const tut = await prisma.tutor.upsert({ where: { codPer: per.codPer }, update: { codMun: t.codMun }, create: { codPer: per.codPer, institucion: 'Instituto X', codMun: t.codMun } });
    tutorMap[t.persona.email] = tut.codTut;
  }

  // 5) Seed Competencia y Modalidad dinámica
  const comp = await prisma.competencia.upsert({
    where: { nombreCompet: 'Olimpiada de Ciencia y Tecnología' },
    update: {},
    create: {
      nombreCompet: 'Olimpiada de Ciencia y Tecnología',
      fechaIni: new Date('2025-04-15'), fechaFin: new Date('2025-04-30'),
      horaIniIns: new Date('2025-04-15T00:00:00'), horaFinIns: new Date('2025-04-30T23:59:59'),
      costo: 16, gestion: 2025
    }
  });

  // Leer catálogo para ASTRONOMÍA - ASTROFÍSICA
  const catFile = path.join(__dirname, '../../data/area-grado-nivel.json');
  const catalog = JSON.parse(await fs.readFile(catFile, 'utf8'));
  const astroEntry = catalog.find(entry => entry.area === 'ASTRONOMÍA - ASTROFÍSICA');
  if (!astroEntry) throw new Error('No se encontró el área ASTRONOMÍA - ASTROFÍSICA en el catálogo');
  const { nivel: nivelName, grado: gradoName } = astroEntry.items[0];

  //console.log({ area: astroEntry.area, gradoName, nivelName });

  // Obtener registros dinámicos
  const areaRec = await prisma.area.findUnique({ where: { nombreArea: astroEntry.area } });
  const nivelRec = await prisma.nivel.findUnique({ where: { nombreNivel: nivelName.trim() } });
const gradoRec = await prisma.grado.findUnique({ where: { nombreGrado: gradoName.trim() } });

  if (!areaRec || !gradoRec || !nivelRec) throw new Error(`Faltan registros: areaRec ${areaRec}, gradoRec ${gradoRec}, nivelRec ${nivelRec}`);

  // Upsert ModalidadCompetencia
  let modal = await prisma.modalidadCompetencia.findFirst({
    where: { codCompet: comp.codCompet, codArea: areaRec.codArea, codGrado: gradoRec.codGrado, codNivel: nivelRec.codNivel }
  });
  if (!modal) {
    modal = await prisma.modalidadCompetencia.create({ data: { codCompet: comp.codCompet, codArea: areaRec.codArea, codGrado: gradoRec.codGrado, codNivel: nivelRec.codNivel } });
  }

  // 6) Seed Competidores + Inscripciones
  for (const c of data.competidores) {
    const per = await prisma.persona.upsert({ where: { carnet: c.persona.carnet }, update: {}, create: c.persona });
    const hashed = await hashPassword('1234');
    const user = await prisma.userN.upsert({ where: { codPer: per.codPer }, update: { passwUser: hashed, codSis: 'TS-COMP' }, create: { codPer: per.codPer, passwUser: hashed, codSis: 'TS-COMP' } });
    await prisma.userNRol.upsert({ where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap['Competidor'] } }, update: {}, create: { codUserN: user.codUserN, codRol: rolesMap['Competidor'] } });
    const nivelC = await prisma.nivel.findUnique({ where: { nombreNivel: c.nivel } });
    await prisma.competidor.upsert({
      where: { codPer: per.codPer },
      update: { fechaNac: new Date(c.fechaNac), codMun: c.codMun, colegio: c.colegio, grado: c.grado, nivel: nivelC.codNivel },
      create: { codPer: per.codPer, fechaNac: new Date(c.fechaNac), codMun: c.codMun, colegio: c.colegio, grado: c.grado, nivel: nivelC.codNivel }
    });
    const codTut = tutorMap[c.tutorEmail];
    await prisma.inscripcion.create({ data: { codModal: modal.codModal, codTutor: codTut, codCompet: comp.codCompet, estadoInscripcion: 'Pendiente', fechaInscripcion: new Date() } });
  }

  console.log('✅ Seed completo con catálogo académico, usuarios y competidores.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

