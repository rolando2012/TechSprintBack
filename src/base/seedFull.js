// seedFull.js
// Seed configurado para el nuevo esquema y creación de Modalidades sin depender de la clave area#nivel

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function esNivelRegular(nivel) {
  return /^\d+[PS]$/.test(nivel);
}

function parsearNivelRegular(nivel) {
  const match = nivel.match(/^(\d+)([PS])$/);
  if (!match) throw new Error(`Nivel inválido: ${nivel}`);
  return {
    numero: parseInt(match[1], 10),
    ciclo: match[2] === 'P' ? 'PRIMARIA' : 'SECUNDARIA'
  };
}

async function main() {
  // 1) Roles
  const tipos = ['Administrador','Cajero','Tutor','Competidor'];
  const rolesMap = {};
  for (const tipo of tipos) {
    const r = await prisma.rol.upsert({ where: { nombreRol: tipo }, create: { nombreRol: tipo }, update: {} });
    rolesMap[tipo] = r.codRol;
  }

  // 2) Datos iniciales
  const data = JSON.parse(await fs.readFile(path.join(__dirname, '../../data/initial.json'), 'utf8'));

  // 3) Administradores y Cajeros
  for (const u of data.users) {
    const per = await prisma.persona.upsert({ where: { carnet: u.persona.carnet }, create: u.persona, update: {} });
    const passw = await hashPassword('1234');
    const user = await prisma.userN.upsert({
      where: { codPer: per.codPer },
      create: { codPer: per.codPer, passwUser: passw, codSis: u.codSis },
      update: { passwUser: passw, codSis: u.codSis }
    });
    await prisma.userNRol.upsert({
      where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap[u.tipo] } },
      create: { codUserN: user.codUserN, codRol: rolesMap[u.tipo] },
      update: {}
    });
    if (u.tipo === 'Administrador') {
      await prisma.administrador.upsert({ where: { codPer: per.codPer }, create: { codPer: per.codPer }, update: {} });
    } else if (u.tipo === 'Cajero') {
      await prisma.cajero.upsert({ where: { codPer: per.codPer }, create: { codPer: per.codPer }, update: {} });
    }
  }

  // 4) Tutores
  const tutorMap = {};
  for (const t of data.tutores) {
    const per = await prisma.persona.upsert({ where: { carnet: t.persona.carnet }, create: t.persona, update: {} });
    const passw = await hashPassword('1234');
    const user = await prisma.userN.upsert({
      where: { codPer: per.codPer },
      create: { codPer: per.codPer, passwUser: passw, codSis: 'TS-TUT' },
      update: { passwUser: passw }
    });
    await prisma.userNRol.upsert({
      where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap['Tutor'] } },
      create: { codUserN: user.codUserN, codRol: rolesMap['Tutor'] },
      update: {}
    });
    const tut = await prisma.tutor.upsert({
      where: { codPer: per.codPer },
      create: { codPer: per.codPer, institucion: t.institucion || 'Instituto X', codMun: t.codMun },
      update: { codMun: t.codMun }
    });
    tutorMap[t.persona.email] = tut.codTut;
  }

  // 5) Competencia
  const comp = await prisma.competencia.upsert({
    where: { nombreCompet: 'Olimpiada de Ciencia y Tecnología' },
    create: {
      nombreCompet: 'Olimpiada de Ciencia y Tecnología',
      fechaIni: new Date('2025-04-15'), fechaFin: new Date('2025-04-30'),
      horaIniIns: new Date('2025-04-15T00:00:00'), horaFinIns: new Date('2025-04-30T23:59:59'),
      costo: 16, gestion: 2025
    },
    update: {}
  });

  // 6) Catálogo y Modalidades
  const catalog = JSON.parse(await fs.readFile(path.join(__dirname, '../../data/area-grado-nivel.json'), 'utf8'));
  for (const entry of catalog) {
    const areaRec = await prisma.area.upsert({ where: { nombreArea: entry.area }, create: { nombreArea: entry.area }, update: {} });
    for (const item of entry.items) {
      if (esNivelRegular(item.nivel)) {
        const { numero, ciclo } = parsearNivelRegular(item.nivel);
        const gradoRec = await prisma.grado.upsert({ where: { numero_ciclo: { numero, ciclo } }, create: { numero, ciclo }, update: {} });
        await prisma.areaGrado.upsert({ where: { codArea_codGrado: { codArea: areaRec.codArea, codGrado: gradoRec.codGrado } }, create: { codArea: areaRec.codArea, codGrado: gradoRec.codGrado }, update: {} });
        // Modalidad
        await prisma.modalidadCompetencia.findFirst() ||
        await prisma.modalidadCompetencia.create({ data: { codCompet: comp.codCompet, codArea: areaRec.codArea, codGrado: gradoRec.codGrado } });
      } else {
        const ne = await prisma.nivelEspecial.upsert({ where: { nombreNivel: item.nivel }, create: { nombreNivel: item.nivel, gradoRange: item.grado, codArea: areaRec.codArea }, update: { gradoRange: item.grado } });
        await prisma.modalidadCompetencia.findFirst() ||
        await prisma.modalidadCompetencia.create({ data: { codCompet: comp.codCompet, codArea: areaRec.codArea, codNivelEspecial: ne.codNivel } });
      }
    }
  }

  // 7) Competidores + Inscripciones
  for (const c of data.competidores) {
    const per = await prisma.persona.upsert({ where: { carnet: c.persona.carnet }, create: c.persona, update: {} });
    const passw = await hashPassword('1234');
    const user = await prisma.userN.upsert({ where: { codPer: per.codPer }, create: { codPer: per.codPer, passwUser: passw, codSis: 'TS-COMP' }, update: { passwUser: passw } });
    await prisma.userNRol.upsert({ where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap['Competidor'] } }, create: { codUserN: user.codUserN, codRol: rolesMap['Competidor'] }, update: {} });

    // Buscar modalidad según nivel
    let modalRec;
    if (esNivelRegular(c.nivel)) {
      const { numero, ciclo } = parsearNivelRegular(c.nivel);
      const gradoRec = await prisma.grado.findUnique({ where: { numero_ciclo: { numero, ciclo } } });
      modalRec = await prisma.modalidadCompetencia.findFirst({ where: { codCompet: comp.codCompet, codGrado: gradoRec.codGrado } });
    } else {
      const ne = await prisma.nivelEspecial.findUnique({ where: { nombreNivel: c.nivel } });
      modalRec = await prisma.modalidadCompetencia.findFirst({ where: { codCompet: comp.codCompet, codNivelEspecial: ne.codNivel } });
    }
    if (!modalRec) throw new Error(`No se encontró Modalidad para nivel ${c.nivel}`);
    const codModal = modalRec.codModal;

    // Competidor
    // Determinar valor numérico de nivel para tabla Competidor
    let nivelVal;
    if (esNivelRegular(c.nivel)) {
      const { numero } = parsearNivelRegular(c.nivel);
      nivelVal = numero;
    } else {
      const ne = await prisma.nivelEspecial.findUnique({ where: { nombreNivel: c.nivel } });
      nivelVal = ne.codNivel;
    }
    await prisma.competidor.upsert({
      where: { codPer: per.codPer },
      create: { 
        codPer: per.codPer, 
        fechaNac: new Date(c.fechaNac), 
        codMun: c.codMun, 
        colegio: c.colegio, 
        grado: c.grado, 
        nivel: nivelVal
      },
      update: { 
        fechaNac: new Date(c.fechaNac), 
        codMun: c.codMun, 
        colegio: c.colegio,
        nivel: nivelVal
      }
    });

    // Inscripciónón
    await prisma.inscripcion.create({ data: { codModal, codTutor: tutorMap[c.tutorEmail], codCompet: comp.codCompet, estadoInscripcion: 'Pendiente', fechaInscripcion: new Date() } });
  }

  console.log('✅ Seed completo con nuevo esquema y modalidades dinámicas');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
