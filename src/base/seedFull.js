const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
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

  // 4) Tutores (asignados por área con contacto)
  // Definimos tutores fijos para cada área
  const tutorInfos = [
    { area: 'Astronomía - astrofísica', nombre: 'Juan Carlos Terrazas Vargas', email: 'juan.terrazas@fcyt.umss.edu.bo' },
    { area: 'Biología', nombre: 'Erika Fernández', email: 'e.fernandez@umss.edu' },
    { area: 'Física', nombre: 'Marko Andrade', email: 'markoandrade.u@fcyt.umss.edu.bo' },
    { area: 'Informática', nombre: 'Vladimir Costas', email: 'vladimircostas.j@fcyt.umss.edu.bo' },
    { area: 'Matemáticas', nombre: 'Vidal Matias', email: 'v.matias@fcyt.umss.edu' },
    { area: 'Química', nombre: 'Boris Moreira', email: 'borismoreira.r@fcyt.umss.edu.bo' }
  ];

  const tutorMap = {};
  let codTut = 1; 
  for (const info of tutorInfos) {
    // Desglosar nombre completo en campos persona
    const [nombre, ...apellidos] = info.nombre.split(' ');
    const apellidoPaterno = apellidos.slice(0, apellidos.length-1).join(' ');
    const apellidoMaterno = apellidos.slice(-1)[0];
    const personaData = {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email: info.email,
      carnet: `TUT-${codTut}`
    };
    codTut++;
    // Upsert persona y usuario
    const per = await prisma.persona.upsert({ where: { carnet: personaData.carnet }, create: personaData, update: personaData });
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
    // Obtener área y municipio por defecto
    const areaRec = await prisma.area.findUnique({ where: { nombreArea: info.area }});
    const codMunDefault = 1; // cambiar si deseas municipio específico
    const tut = await prisma.tutor.upsert({
      where: { codPer: per.codPer },
      create: { codPer: per.codPer, institucion: 'FCyT UMSS', codMun: codMunDefault, codArea: areaRec.codArea },
      update: { codMun: codMunDefault, codArea: areaRec.codArea }
    });
    tutorMap[info.email] = tut.codTut;
  }

  // Seed Robótica: tutor aleatorio
  {
    const info = { area: 'Robótica', nombre: 'Alex Martinez', email: 'alex.martinez@fcyt.umss.edu.bo' };
    const [nombre, ...apellidos] = info.nombre.split(' ');
    const apellidoPaterno = apellidos.slice(0, apellidos.length-1).join(' ');
    const apellidoMaterno = apellidos.slice(-1)[0];
    const personaData = { nombre, apellidoPaterno, apellidoMaterno, email: info.email, carnet: `TUT-${codTut}` };
    const per = await prisma.persona.upsert({ where: { carnet: personaData.carnet }, create: personaData, update: personaData });
    const passw = await hashPassword('1234');
    const user = await prisma.userN.upsert({
      where: { codPer: per.codPer },
      create: { codPer: per.codPer, passwUser: passw, codSis: 'TS-TUT' },
      update: { passwUser: passw }
    });
    await prisma.userNRol.upsert({ where: { codUserN_codRol: { codUserN: user.codUserN, codRol: rolesMap['Tutor'] } }, create: { codUserN: user.codUserN, codRol: rolesMap['Tutor'] }, update: {} });
    const areaRec = await prisma.area.findUnique({ where: { nombreArea: 'Robótica' }});
    const codMunDefault = 1;
    const tut = await prisma.tutor.upsert({ where: { codPer: per.codPer }, create: { codPer: per.codPer, institucion: 'Facultad de Tecnología', codMun: codMunDefault, codArea: areaRec.codArea }, update: { codMun: codMunDefault, codArea: areaRec.codArea }});
    tutorMap[info.email] = tut.codTut;
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

  

  

  console.log('✅ Seed completo con nuevo esquema y modalidades dinámicas');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
