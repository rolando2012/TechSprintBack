-- CreateEnum
CREATE TYPE "Ciclo" AS ENUM ('PRIMARIA', 'SECUNDARIA');

-- CreateTable
CREATE TABLE "Departamento" (
    "codDept" SERIAL NOT NULL,
    "nombreDept" VARCHAR(50) NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("codDept")
);

-- CreateTable
CREATE TABLE "Municipio" (
    "codMun" SERIAL NOT NULL,
    "nombreMun" VARCHAR(50) NOT NULL,
    "codDept" INTEGER NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("codMun")
);

-- CreateTable
CREATE TABLE "Persona" (
    "codPer" SERIAL NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,
    "apellidoPaterno" VARCHAR(30) NOT NULL,
    "apellidoMaterno" VARCHAR(30),
    "celular" VARCHAR(8),
    "email" VARCHAR(89),
    "carnet" VARCHAR(10) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("codPer")
);

-- CreateTable
CREATE TABLE "Administrador" (
    "codAdm" SERIAL NOT NULL,
    "codPer" INTEGER NOT NULL,

    CONSTRAINT "Administrador_pkey" PRIMARY KEY ("codAdm")
);

-- CreateTable
CREATE TABLE "Cajero" (
    "codCaj" SERIAL NOT NULL,
    "codPer" INTEGER NOT NULL,

    CONSTRAINT "Cajero_pkey" PRIMARY KEY ("codCaj")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "codTut" SERIAL NOT NULL,
    "codPer" INTEGER NOT NULL,
    "institucion" VARCHAR(100) NOT NULL,
    "codMun" INTEGER NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("codTut")
);

-- CreateTable
CREATE TABLE "UserN" (
    "codUserN" SERIAL NOT NULL,
    "codPer" INTEGER NOT NULL,
    "passwUser" VARCHAR(60) NOT NULL,
    "codSis" VARCHAR(10) NOT NULL,

    CONSTRAINT "UserN_pkey" PRIMARY KEY ("codUserN")
);

-- CreateTable
CREATE TABLE "Rol" (
    "codRol" SERIAL NOT NULL,
    "nombreRol" VARCHAR(20) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("codRol")
);

-- CreateTable
CREATE TABLE "UserNRol" (
    "codUserN" INTEGER NOT NULL,
    "codRol" INTEGER NOT NULL,

    CONSTRAINT "UserNRol_pkey" PRIMARY KEY ("codUserN","codRol")
);

-- CreateTable
CREATE TABLE "Area" (
    "codArea" SERIAL NOT NULL,
    "nombreArea" VARCHAR(30) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("codArea")
);

-- CreateTable
CREATE TABLE "Grado" (
    "codGrado" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "ciclo" "Ciclo" NOT NULL,

    CONSTRAINT "Grado_pkey" PRIMARY KEY ("codGrado")
);

-- CreateTable
CREATE TABLE "AreaGrado" (
    "codArea" INTEGER NOT NULL,
    "codGrado" INTEGER NOT NULL,

    CONSTRAINT "AreaGrado_pkey" PRIMARY KEY ("codArea","codGrado")
);

-- CreateTable
CREATE TABLE "NivelEspecial" (
    "codNivel" SERIAL NOT NULL,
    "nombreNivel" VARCHAR(30) NOT NULL,
    "codArea" INTEGER NOT NULL,

    CONSTRAINT "NivelEspecial_pkey" PRIMARY KEY ("codNivel")
);

-- CreateTable
CREATE TABLE "Competencia" (
    "codCompet" SERIAL NOT NULL,
    "nombreCompet" VARCHAR(100) NOT NULL,
    "fechaIni" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "horaIniIns" TIME NOT NULL,
    "horaFinIns" TIME NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL,
    "gestion" INTEGER NOT NULL,

    CONSTRAINT "Competencia_pkey" PRIMARY KEY ("codCompet")
);

-- CreateTable
CREATE TABLE "ModalidadCompetencia" (
    "codModal" SERIAL NOT NULL,
    "codCompet" INTEGER NOT NULL,
    "codArea" INTEGER NOT NULL,
    "codGrado" INTEGER,
    "codNivelEspecial" INTEGER,

    CONSTRAINT "ModalidadCompetencia_pkey" PRIMARY KEY ("codModal")
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "codIns" SERIAL NOT NULL,
    "codModal" INTEGER NOT NULL,
    "codTutor" INTEGER NOT NULL,
    "codCompet" INTEGER NOT NULL,
    "estadoInscripcion" VARCHAR(10) NOT NULL,
    "fechaInscripcion" DATE NOT NULL,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("codIns")
);

-- CreateTable
CREATE TABLE "Competidor" (
    "codComp" SERIAL NOT NULL,
    "codPer" INTEGER NOT NULL,
    "fechaNac" DATE NOT NULL,
    "codMun" INTEGER NOT NULL,
    "colegio" VARCHAR(100) NOT NULL,
    "grado" VARCHAR(10) NOT NULL,
    "nivel" INTEGER NOT NULL,

    CONSTRAINT "Competidor_pkey" PRIMARY KEY ("codComp")
);

-- CreateTable
CREATE TABLE "CamposObligatorios" (
    "codCamp" SERIAL NOT NULL,
    "nombreCampObl" VARCHAR(30) NOT NULL,

    CONSTRAINT "CamposObligatorios_pkey" PRIMARY KEY ("codCamp")
);

-- CreateTable
CREATE TABLE "CompCampObl" (
    "codCompet" INTEGER NOT NULL,
    "codCamp" INTEGER NOT NULL,

    CONSTRAINT "CompCampObl_pkey" PRIMARY KEY ("codCompet","codCamp")
);

-- CreateTable
CREATE TABLE "EtapaCompetencia" (
    "codEtapa" SERIAL NOT NULL,
    "codCompetencia" INTEGER NOT NULL,
    "nombreEtapa" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "fechaInicio" DATE NOT NULL,
    "horaInicio" TIME NOT NULL,
    "fechaFin" DATE NOT NULL,
    "horaFin" TIME NOT NULL,
    "orden" INTEGER NOT NULL,
    "estado" VARCHAR(10) NOT NULL,

    CONSTRAINT "EtapaCompetencia_pkey" PRIMARY KEY ("codEtapa")
);

-- CreateTable
CREATE TABLE "CompetenciaArea" (
    "codCompet" INTEGER NOT NULL,
    "codArea" INTEGER NOT NULL,

    CONSTRAINT "CompetenciaArea_pkey" PRIMARY KEY ("codCompet","codArea")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "codNot" SERIAL NOT NULL,
    "codPer" INTEGER NOT NULL,
    "titulo" VARCHAR(30) NOT NULL,
    "descripcion" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(10) NOT NULL,
    "tipoNot" VARCHAR(10) NOT NULL,
    "fechaEnvio" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("codNot")
);

-- CreateTable
CREATE TABLE "Pago" (
    "codPago" SERIAL NOT NULL,
    "codIns" INTEGER NOT NULL,
    "estadoPago" VARCHAR(10) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaPago" DATE NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("codPago")
);

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_nombreDept_key" ON "Departamento"("nombreDept");

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_nombreMun_codDept_key" ON "Municipio"("nombreMun", "codDept");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_email_key" ON "Persona"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_carnet_key" ON "Persona"("carnet");

-- CreateIndex
CREATE UNIQUE INDEX "Administrador_codPer_key" ON "Administrador"("codPer");

-- CreateIndex
CREATE UNIQUE INDEX "Cajero_codPer_key" ON "Cajero"("codPer");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_codPer_key" ON "Tutor"("codPer");

-- CreateIndex
CREATE UNIQUE INDEX "UserN_codPer_key" ON "UserN"("codPer");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombreRol_key" ON "Rol"("nombreRol");

-- CreateIndex
CREATE UNIQUE INDEX "Area_nombreArea_key" ON "Area"("nombreArea");

-- CreateIndex
CREATE UNIQUE INDEX "Grado_numero_ciclo_key" ON "Grado"("numero", "ciclo");

-- CreateIndex
CREATE UNIQUE INDEX "NivelEspecial_nombreNivel_key" ON "NivelEspecial"("nombreNivel");

-- CreateIndex
CREATE UNIQUE INDEX "Competencia_nombreCompet_key" ON "Competencia"("nombreCompet");

-- CreateIndex
CREATE INDEX "ModalidadCompetencia_codGrado_idx" ON "ModalidadCompetencia"("codGrado");

-- CreateIndex
CREATE INDEX "ModalidadCompetencia_codNivelEspecial_idx" ON "ModalidadCompetencia"("codNivelEspecial");

-- CreateIndex
CREATE UNIQUE INDEX "Competidor_codPer_key" ON "Competidor"("codPer");

-- CreateIndex
CREATE UNIQUE INDEX "CamposObligatorios_nombreCampObl_key" ON "CamposObligatorios"("nombreCampObl");

-- AddForeignKey
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_codDept_fkey" FOREIGN KEY ("codDept") REFERENCES "Departamento"("codDept") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administrador" ADD CONSTRAINT "Administrador_codPer_fkey" FOREIGN KEY ("codPer") REFERENCES "Persona"("codPer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cajero" ADD CONSTRAINT "Cajero_codPer_fkey" FOREIGN KEY ("codPer") REFERENCES "Persona"("codPer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_codPer_fkey" FOREIGN KEY ("codPer") REFERENCES "Persona"("codPer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_codMun_fkey" FOREIGN KEY ("codMun") REFERENCES "Municipio"("codMun") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserN" ADD CONSTRAINT "UserN_codPer_fkey" FOREIGN KEY ("codPer") REFERENCES "Persona"("codPer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNRol" ADD CONSTRAINT "UserNRol_codUserN_fkey" FOREIGN KEY ("codUserN") REFERENCES "UserN"("codUserN") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNRol" ADD CONSTRAINT "UserNRol_codRol_fkey" FOREIGN KEY ("codRol") REFERENCES "Rol"("codRol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaGrado" ADD CONSTRAINT "AreaGrado_codArea_fkey" FOREIGN KEY ("codArea") REFERENCES "Area"("codArea") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaGrado" ADD CONSTRAINT "AreaGrado_codGrado_fkey" FOREIGN KEY ("codGrado") REFERENCES "Grado"("codGrado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NivelEspecial" ADD CONSTRAINT "NivelEspecial_codArea_fkey" FOREIGN KEY ("codArea") REFERENCES "Area"("codArea") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModalidadCompetencia" ADD CONSTRAINT "ModalidadCompetencia_codCompet_fkey" FOREIGN KEY ("codCompet") REFERENCES "Competencia"("codCompet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModalidadCompetencia" ADD CONSTRAINT "ModalidadCompetencia_codArea_fkey" FOREIGN KEY ("codArea") REFERENCES "Area"("codArea") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModalidadCompetencia" ADD CONSTRAINT "ModalidadCompetencia_codGrado_fkey" FOREIGN KEY ("codGrado") REFERENCES "Grado"("codGrado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModalidadCompetencia" ADD CONSTRAINT "ModalidadCompetencia_codNivelEspecial_fkey" FOREIGN KEY ("codNivelEspecial") REFERENCES "NivelEspecial"("codNivel") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_codModal_fkey" FOREIGN KEY ("codModal") REFERENCES "ModalidadCompetencia"("codModal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_codTutor_fkey" FOREIGN KEY ("codTutor") REFERENCES "Tutor"("codTut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_codCompet_fkey" FOREIGN KEY ("codCompet") REFERENCES "Competencia"("codCompet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competidor" ADD CONSTRAINT "Competidor_codPer_fkey" FOREIGN KEY ("codPer") REFERENCES "Persona"("codPer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competidor" ADD CONSTRAINT "Competidor_codMun_fkey" FOREIGN KEY ("codMun") REFERENCES "Municipio"("codMun") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompCampObl" ADD CONSTRAINT "CompCampObl_codCompet_fkey" FOREIGN KEY ("codCompet") REFERENCES "Competencia"("codCompet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompCampObl" ADD CONSTRAINT "CompCampObl_codCamp_fkey" FOREIGN KEY ("codCamp") REFERENCES "CamposObligatorios"("codCamp") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaCompetencia" ADD CONSTRAINT "EtapaCompetencia_codCompetencia_fkey" FOREIGN KEY ("codCompetencia") REFERENCES "Competencia"("codCompet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenciaArea" ADD CONSTRAINT "CompetenciaArea_codCompet_fkey" FOREIGN KEY ("codCompet") REFERENCES "Competencia"("codCompet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenciaArea" ADD CONSTRAINT "CompetenciaArea_codArea_fkey" FOREIGN KEY ("codArea") REFERENCES "Area"("codArea") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_codPer_fkey" FOREIGN KEY ("codPer") REFERENCES "Persona"("codPer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_codIns_fkey" FOREIGN KEY ("codIns") REFERENCES "Inscripcion"("codIns") ON DELETE RESTRICT ON UPDATE CASCADE;
