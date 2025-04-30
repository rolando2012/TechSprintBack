# TechSprint

Una aplicación web construida con **Express**, **Prisma** y **PostgreSQL**, diseñada para gestionar departamentos, municipios, áreas, niveles y grados académicos.

---

## 📋 Contenido

1. [Descripción](#descripción)
2. [Requisitos](#requisitos)
3. [Instalación](#instalación)
4. [Configuración de la base de datos](#configuración-de-la-base-de-datos)
5. [Prisma](#prisma)
6. [Semilla (Seed)](#semilla-seed)
7. [Ejecución de la aplicación](#ejecución-de-la-aplicación)

---

## 📄 Descripción

TechSprint es una API REST que permite:

- Gestionar **Departamentos** y sus **Municipios**.
- Catalogar **Áreas**, **Niveles** y **Grados** tal como se definen en la imagen de especificaciones.
- Ofrecer un endpoint de semilla para cargar datos iniciales.

La aplicación usa **Prisma** como ORM y **PostgreSQL** como base de datos.

---

## ⚙️ Requisitos

- Node.js ≥ 16
- npm o yarn
- PostgreSQL ≥ 12

---

## 🚀 Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/rolando2012/TechSprintBack.git
   cd TechSprintBack
   ```

2. Instalar dependencias:

   ```bash
   npm install
   # o
   yarn install
   ```

3. Crear archivo de variables de entorno `.env` en la carpeta raíz:

   ```ini
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   ```

---

## 🗄️ Configuración de la base de datos

1. Iniciar PostgreSQL y crear la base de datos:

   ```sql
   CREATE DATABASE bdtechsprint;
   ```

2. Asegurarse de que el `DATABASE_URL` en `.env` apunte a la base recién creada.

---

## 🔧 Prisma

1. Generar el cliente y ejecutar migraciones:

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

2. Revisar `prisma/schema.prisma` para ver el modelo de datos.

---

## 🌱 Semilla (Seed)

Usamos un script para poblar tablas:

- **Departamentos** (9 de Bolivia) con sus municipios.
- **Área**, **Nivel** y **Grado** según la imagen de especificaciones.

### Comandos

```bash
# Ejecutar migraciones (si no se han aplicado aún)
npx prisma migrate deploy

# Ejecutar semilla manualmente	
```


```
node ./src/base/seed.js
node ./src/base/seedAcademicCatalog.js
node ./src/base/seed-extended.js
node ./src/base/seed-last.js

```
## Reiniciar base de datos
```
 npx prisma migrate reset
```
---

## ▶️ Ejecución de la aplicación

```bash
npm run dev     
```

La API estará disponible en `http://localhost:4000`.

---

