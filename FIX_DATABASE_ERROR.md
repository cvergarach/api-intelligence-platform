# 🎯 GUÍA VISUAL: Solucionar Error de Base de Datos

![Diagrama del Problema y Solución](C:/Users/cesar.vergara/.gemini/antigravity/brain/cf9855a5-cf2e-486e-b4f2-53f2f0c0fe77/database_migration_solution_1766785083916.png)

## 📊 Diagnóstico del Problema

```
❌ Error Actual:
The table `public.Document` does not exist in the current database.

🔍 Causa Raíz:
No existen archivos de migración en backend/prisma/migrations/

⚠️ Por qué falla Render:
El comando "npx prisma migrate deploy" no encuentra migraciones que aplicar
```

---

## 🛠️ SOLUCIÓN PASO A PASO

### **Opción A: Script Automático (Recomendado)** ⭐

#### 1️⃣ Obtener DATABASE_URL desde Render

1. Ve a: https://dashboard.render.com
2. Click en tu base de datos PostgreSQL
3. Pestaña **"Info"**
4. Copia **"External Database URL"**

```
Ejemplo:
postgresql://api_user:abc123xyz@dpg-xxxxx-a.oregon-postgres.render.com:5432/api_db
```

#### 2️⃣ Configurar archivo .env

1. Abre: `backend/.env`
2. Reemplaza la línea DATABASE_URL:

```env
DATABASE_URL="postgresql://api_user:abc123xyz@dpg-xxxxx-a.oregon-postgres.render.com:5432/api_db?sslmode=require"
```

> ⚠️ **IMPORTANTE**: Agrega `?sslmode=require` al final

3. Guarda el archivo

#### 3️⃣ Ejecutar el script de configuración

Abre PowerShell en la carpeta del proyecto:

```powershell
cd backend
.\setup-database.ps1
```

El script hará todo automáticamente:
- ✅ Instalar dependencias
- ✅ Generar cliente Prisma
- ✅ Crear migración inicial
- ✅ Aplicar migración a la base de datos
- ✅ Crear todas las tablas

#### 4️⃣ Subir cambios a GitHub

```bash
git add backend/prisma/migrations/
git add backend/.gitignore
git commit -m "Add initial database migration"
git push origin main
```

#### 5️⃣ Esperar redeploy automático

Render detectará el cambio y re-desplegará (5-10 minutos)

---

### **Opción B: Comandos Manuales**

Si prefieres ejecutar los comandos uno por uno:

```bash
# 1. Navegar a backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Generar cliente Prisma
npx prisma generate

# 4. Crear migración inicial
npx prisma migrate dev --name init

# 5. Verificar que funcionó
npx prisma studio

# 6. Subir a GitHub
git add prisma/migrations/
git commit -m "Add initial database migration"
git push origin main
```

---

### **Opción C: Solución Ultra-Rápida (db push)**

Si tienes prisa y quieres crear las tablas inmediatamente:

```bash
cd backend
npx prisma db push
```

> ⚠️ **Nota**: Después aún debes crear la migración para Render (Opción A o B)

---

## � Estructura Esperada Después

```
backend/
├── prisma/
│   ├── schema.prisma          ✅ (ya existe)
│   └── migrations/            ✅ (se creará)
│       └── 20251226_init/     ✅ (nueva)
│           └── migration.sql  ✅ (nueva)
├── .env                       ✅ (configurado)
├── .gitignore                 ✅ (creado)
└── setup-database.ps1         ✅ (creado)
```

---

## ✅ Verificación

### 1. Verificar Localmente

```bash
cd backend
npx prisma studio
```

Deberías ver 8 tablas:
- ✅ Document
- ✅ Api
- ✅ Endpoint
- ✅ Credential
- ✅ ApiExecution
- ✅ Insight
- ✅ Report
- ✅ AiModelConfig

### 2. Verificar en Producción

Después del redeploy de Render:

```
https://api-intelligence-platform.onrender.com/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T...",
  "message": "API Intelligence Platform - Backend funcionando correctamente"
}
```

### 3. Probar Subida de PDF

Ve a tu frontend y sube un PDF. El error debería desaparecer.

---

## 🐛 Solución de Problemas

### Error: "Environment variable not found: DATABASE_URL"

**Causa**: El archivo `.env` no existe o está mal configurado

**Solución**:
1. Verifica que `backend/.env` existe
2. Verifica que contiene `DATABASE_URL="..."`
3. Asegúrate de que la URL es real (no el placeholder)

---

### Error: "Can't reach database server"

**Causa**: Problemas de conexión a la base de datos

**Solución**:
1. Verifica que DATABASE_URL sea correcta
2. Asegúrate de incluir `?sslmode=require` al final
3. Verifica que tu base de datos esté activa en Render
4. Verifica tu conexión a internet

---

### Error: "Migration failed"

**Causa**: Problemas al aplicar la migración

**Solución rápida**:
```bash
# Usar db push en su lugar
npx prisma db push

# Luego crear la migración
npx prisma migrate dev --name init
```

---

### El error persiste después del redeploy

**Causa**: Las migraciones no se subieron a GitHub

**Verificar**:
```bash
git status
```

Deberías ver:
```
nothing to commit, working tree clean
```

Si ves archivos sin commit:
```bash
git add backend/prisma/migrations/
git commit -m "Add migrations"
git push origin main
```

---

## 📊 Diagrama de Flujo

```mermaid
graph TD
    A[Inicio] --> B{¿Existe .env?}
    B -->|No| C[Crear .env con DATABASE_URL]
    B -->|Sí| D{¿DATABASE_URL configurada?}
    C --> D
    D -->|No| E[Editar .env con URL real]
    D -->|Sí| F[Ejecutar setup-database.ps1]
    E --> F
    F --> G{¿Migración exitosa?}
    G -->|No| H[Verificar DATABASE_URL]
    G -->|Sí| I[git add migrations/]
    H --> F
    I --> J[git commit y push]
    J --> K[Esperar redeploy en Render]
    K --> L[Verificar /health endpoint]
    L --> M{¿Funciona?}
    M -->|No| N[Revisar logs de Render]
    M -->|Sí| O[✅ ¡Problema resuelto!]
```

---

## 🎯 Checklist Final

Antes de considerar el problema resuelto:

- [ ] Archivo `.env` configurado con DATABASE_URL real
- [ ] Ejecutado `npx prisma migrate dev --name init`
- [ ] Carpeta `backend/prisma/migrations/` existe
- [ ] Migraciones subidas a GitHub (`git push`)
- [ ] Render re-desplegado automáticamente
- [ ] Endpoint `/health` responde correctamente
- [ ] Subida de PDF funciona sin errores

---

## 📞 ¿Necesitas Ayuda?

Si algún paso falla, comparte:
1. El comando exacto que ejecutaste
2. El error completo que recibiste
3. El contenido de tu `.env` (sin mostrar la contraseña)

---

## 🚀 Tiempo Estimado

- **Configuración inicial**: 2-3 minutos
- **Ejecución del script**: 1-2 minutos
- **Git commit y push**: 1 minuto
- **Redeploy en Render**: 5-10 minutos

**Total**: ~15 minutos

---

¡Éxito! 🎉
