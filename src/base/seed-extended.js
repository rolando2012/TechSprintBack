// src/base/seed-extended.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function seedAcademicCatalog() {
  // Grados y niveles académicos
  const mapping = {
    Primaria: ['3ro Primaria', '4to Primaria', '5to Primaria', '6to Primaria'],
    Secundaria: [
      '1ro Secundaria', '2do Secundaria', '3ro Secundaria',
      '4to Secundaria', '5to Secundaria', '6to Secundaria'
    ]
  };

  for (const areaName of Object.keys(mapping)) {
    // Área académica
    await prisma.area.upsert({
      where: { nombreArea: areaName },
      update: {},
      create: { nombreArea: areaName }
    });

    // Grado correspondiente
    await prisma.grado.upsert({
      where: { nombreGrado: areaName },
      update: {},
      create: { nombreGrado: areaName }
    });

    // Niveles bajo ese grado
    const gradosRecord = await prisma.grado.findUnique({ where: { nombreGrado: areaName } });
    for (const nivelName of mapping[areaName]) {
      const nivelRecord = await prisma.nivel.upsert({
        where: { nombreNivel: nivelName },
        update: {},
        create: { nombreNivel: nivelName }
      });
      // Asociación GradoNivel
      await prisma.gradoNivel.upsert({
        where: { codGrado_codNivel: { codGrado: gradosRecord.codGrado, codNivel: nivelRecord.codNivel } },
        update: {},
        create: { codGrado: gradosRecord.codGrado, codNivel: nivelRecord.codNivel }
      });
    }
  }
}

async function main() {
  // 0) Seed catálogo académico (área, grado, nivel)
  await seedAcademicCatalog();

  // 1) Crear roles
  const rolesMap = {};
  for (const tipo of ['Administrador', 'Cajero', 'Tutor', 'Competidor']) {
    const rol = await prisma.rol.upsert({
      where: { nombreRol: tipo }, update: {}, create: { nombreRol: tipo }
    });
    rolesMap[tipo] = rol.codRol;
  }

  // 2) Seed Administradores y Cajeros
  const data = JSON.parse(
    await fs.readFile(path.join(__dirname, '../../data/initial.json'), 'utf8')
  );

  for (const u of data.users) {
    const per = await prisma.persona.upsert({
      where: { carnet: u.persona.carnet }, update: {}, create: u.persona
    });
    const hashed = await hashPassword('1234');
    const user = await prisma.userN.upsert({
      where: { codPer: per.codPer },
      update: { passwUser: hashed, codSis: u.codSis },
      create: { codPer: per.codPer, passwUser: hashed, codSis: u.codSis }
    });
    await prisma.userNRol.upsert({
      where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap[u.tipo] } },
      update: {}, create: { codUserN: user.codUserN, codRol: rolesMap[u.tipo] }
    });
    if (u.tipo === 'Administrador') {
      await prisma.administrador.upsert({
        where: { codPer: per.codPer }, update: {}, create: { codPer: per.codPer }
      });
    } else {
      await prisma.cajero.upsert({
        where: { codPer: per.codPer }, update: {}, create: { codPer: per.codPer }
      });
    }
  }

  // 3) Seed Tutores
  const tutorMap = {};
  for (const t of data.tutores) {
    const per = await prisma.persona.upsert({
      where: { carnet: t.persona.carnet }, update: {}, create: t.persona
    });
    const hashed = await hashPassword('1234');
    const user = await prisma.userN.upsert({
      where: { codPer: per.codPer },
      update: { passwUser: hashed, codSis: 'TS-TUT' },
      create: { codPer: per.codPer, passwUser: hashed, codSis: 'TS-TUT' }
    });
    await prisma.userNRol.upsert({
      where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap['Tutor'] } },
      update: {}, create: { codUserN: user.codUserN, codRol: rolesMap['Tutor'] }
    });
    const tut = await prisma.tutor.upsert({
      where: { codPer: per.codPer },
      update: { codMun: t.codMun },
      create: { codPer: per.codPer, institucion: 'Instituto X', codMun: t.codMun }
    });
    tutorMap[t.persona.email] = tut.codTut;
  }

  // 4) Seed Competencia
  const comp = await prisma.competencia.upsert({
    where: { nombreCompet: 'Olimpiada de Ciencia y Tecnología' },
    update: {},
    create: {
      nombreCompet: 'Olimpiada de Ciencia y Tecnología',
      fechaIni: new Date('2025-04-15'),
      fechaFin: new Date('2025-04-30'),
      horaIniIns: new Date('2025-04-15T00:00:00'),
      horaFinIns: new Date('2025-04-30T23:59:59'),
      costo: 16, gestion: 2025
    }
  });

  // 5) Seed ModalidadCompetencia (Primaria – 3ro Primaria)
  const area = await prisma.area.findUnique({ where: { nombreArea: 'Primaria' } });
  const grado = await prisma.grado.findUnique({ where: { nombreGrado: 'Primaria' } });
  const nivel = await prisma.nivel.findUnique({ where: { nombreNivel: '3ro Primaria' } });
  if (!area || !grado || !nivel) {
    throw new Error('Faltan registros de Área, Grado o Nivel');
  }
  let modal = await prisma.modalidadCompetencia.findFirst({
    where: { codCompet: comp.codCompet, codArea: area.codArea, codGrado: grado.codGrado, codNivel: nivel.codNivel }
  });
  if (!modal) {
    modal = await prisma.modalidadCompetencia.create({
      data: { codCompet: comp.codCompet, codArea: area.codArea, codGrado: grado.codGrado, codNivel: nivel.codNivel }
    });
  }

  // 6) Seed Competidores + Inscripciones
  for (const c of data.competidores) {
    const per = await prisma.persona.upsert({ where: { carnet: c.persona.carnet }, update: {}, create: c.persona });
    const hashed = await hashPassword('1234');
    const user = await prisma.userN.upsert({
      where: { codPer: per.codPer },
      update: { passwUser: hashed, codSis: 'TS-COMP' },
      create: { codPer: per.codPer, passwUser: hashed, codSis: 'TS-COMP' }
    });
    await prisma.userNRol.upsert({
      where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap['Competidor'] } },
      update: {}, create: { codUserN: user.codUserN, codRol: rolesMap['Competidor'] }
    });
    if (!c.colegio) throw new Error(`Falta colegio para competidor ${c.persona.carnet}`);
    const nivelRec = await prisma.nivel.findUnique({ where: { nombreNivel: c.nivel } });
    await prisma.competidor.upsert({
      where: { codPer: per.codPer },
      update: {
        fechaNac: new Date(c.fechaNac), codMun: c.codMun,
        colegio: c.colegio, grado: c.grado, nivel: nivelRec.codNivel
      },
      create: {
        codPer: per.codPer, fechaNac: new Date(c.fechaNac), codMun: c.codMun,
        colegio: c.colegio, grado: c.grado, nivel: nivelRec.codNivel
      }
    });
    const codTut = tutorMap[c.tutorEmail]; if (!codTut) throw new Error(`Tutor no encontrado: ${c.tutorEmail}`);
    await prisma.inscripcion.create({
      data: {
        codModal: modal.codModal, codTutor: codTut,
        codCompet: comp.codCompet, estadoInscripcion: 'Pendiente', fechaInscripcion: new Date()
      }
    });
  }

  console.log('✅ Seed completo con Competencia y Modalidad');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

