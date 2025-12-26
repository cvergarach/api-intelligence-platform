# 🚀 GUÍA DE DESPLIEGUE - API Intelligence Platform

## ORDEN DE DESPLIEGUE (IMPORTANTE)

1. Base de Datos PostgreSQL en Render
2. Backend en Render
3. Frontend en Vercel

---

## 1️⃣ BASE DE DATOS POSTGRESQL EN RENDER

### Pasos:
1. Ve a https://render.com
2. Crea cuenta / Inicia sesión
3. Click "New +" → "PostgreSQL"
4. Configuración:
   - **Name**: `api-intelligence-db`
   - **Database**: `api_intelligence`
   - **User**: `api_intelligence_user`
   - **Region**: Oregon (US West)
   - **PostgreSQL Version**: 16
   - **Datadog API Key**: (dejar vacío)
   - **Plan**: Free

5. Click "Create Database"
6. **IMPORTANTE**: Copia el "External Database URL" desde la pestaña "Info"
   - Formato: `postgresql://user:password@host:5432/database`
   - Guárdalo en un lugar seguro

---

## 2️⃣ BACKEND EN RENDER

### A. Preparar Repositorio GitHub

1. Crea un nuevo repositorio en GitHub
2. Sube la carpeta `backend/` completa
3. Asegúrate de que el archivo `.gitignore` esté incluido

### B. Configurar en Render

1. En Render, click "New +" → "Web Service"
2. Conecta tu cuenta de GitHub
3. Selecciona el repositorio del backend
4. Configuración:
   - **Name**: `api-intelligence-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: (vacío si el backend está en la raíz, o `backend` si está en subcarpeta)
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     npm install && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**: 
     ```
     npm start
     ```
   - **Plan**: Free (o el que prefieras)

5. Click "Advanced" → "Add Environment Variable"

### C. Variables de Entorno del Backend

Agrega TODAS estas variables:

```
DATABASE_URL=postgresql://tu_conexion_completa_aqui
PORT=8000
JWT_SECRET=cambiar_por_secreto_super_seguro_123456
GEMINI_API_KEY=tu_gemini_api_key
CLAUDE_API_KEY=tu_claude_api_key
OPENAI_API_KEY=tu_openai_api_key
FRONTEND_URL=https://tu-frontend.vercel.app
MAX_FILE_SIZE=50000000
UPLOAD_DIR=./uploads
```

**IMPORTANTE**:
- Reemplaza `DATABASE_URL` con la que copiaste del paso anterior
- `FRONTEND_URL` actualízala después de desplegar el frontend

6. Click "Create Web Service"
7. Espera a que termine el despliegue (5-10 minutos)
8. **Copia la URL del backend** (ej: `https://api-intelligence-backend.onrender.com`)

---

## 3️⃣ FRONTEND EN VERCEL

### A. Preparar Repositorio

1. Sube la carpeta `frontend/` a GitHub (puede ser el mismo repo u otro)

### B. Configurar en Vercel

1. Ve a https://vercel.com
2. Crea cuenta / Inicia sesión con GitHub
3. Click "Add New..." → "Project"
4. Importa tu repositorio del frontend
5. Configuración:
   - **Framework Preset**: Next.js
   - **Root Directory**: (vacío si frontend está en raíz, o `frontend` si está en subcarpeta)
   - **Build Command**: `npm run build` (auto-detectado)
   - **Output Directory**: `.next` (auto-detectado)
   - **Install Command**: `npm install` (auto-detectado)

6. En "Environment Variables" agrega:

```
NEXT_PUBLIC_API_URL=https://api-intelligence-backend.onrender.com
```

(Usa la URL del backend que copiaste)

7. Click "Deploy"
8. Espera a que termine (2-5 minutos)
9. **Copia la URL del frontend** (ej: `https://api-intelligence.vercel.app`)

### C. Actualizar Backend con URL del Frontend

1. Vuelve a Render
2. Ve a tu servicio del backend
3. En "Environment", actualiza:
   ```
   FRONTEND_URL=https://api-intelligence.vercel.app
   ```
4. El backend se re-desplegará automáticamente

---

## 4️⃣ OBTENER API KEYS

### Gemini (Google) - REQUERIDO

1. Ve a https://aistudio.google.com/
2. Crea/Inicia sesión en tu cuenta Google
3. Click "Get API key"
4. Copia la API key

### Claude (Anthropic) - REQUERIDO

1. Ve a https://console.anthropic.com/
2. Crea cuenta
3. Ve a "API Keys"
4. Click "Create Key"
5. Copia la API key

### OpenAI - OPCIONAL

1. Ve a https://platform.openai.com/
2. Crea cuenta
3. Ve a "API keys"
4. Click "Create new secret key"
5. Copia la key

---

## ✅ VERIFICAR INSTALACIÓN

### 1. Verificar Backend
Visita: `https://tu-backend.onrender.com/health`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T...",
  "message": "API Intelligence Platform - Backend funcionando correctamente"
}
```

### 2. Verificar Frontend
Visita: `https://tu-frontend.vercel.app`

Deberías ver la aplicación cargando correctamente

### 3. Probar Funcionalidad

1. Sube un PDF de prueba o ingresa una URL
2. Verifica que se procese correctamente
3. Ve a "APIs Descubiertas"
4. Ejecuta un endpoint
5. Revisa Dashboard, Insights y Reportes

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Backend no despliega

**Error: "Database connection failed"**
- Verifica DATABASE_URL
- Asegúrate de que incluya `?sslmode=require` al final

**Error: "Prisma migration failed"**
- El build command debe ser: `npm install && npx prisma generate && npx prisma migrate deploy`

### Frontend no conecta con Backend

**Error: "CORS Error"**
- Verifica que FRONTEND_URL en backend sea correcta
- Verifica que NEXT_PUBLIC_API_URL en frontend sea correcta
- Ambas URLs deben ser HTTPS (no HTTP)

### APIs no se descubren

**PDF no se procesa**
- Verifica que el PDF sea texto (no imagen escaneada)
- Máximo 50MB por archivo
- Verifica que GEMINI_API_KEY o CLAUDE_API_KEY estén correctas

**URL no se analiza**
- Verifica que la URL sea accesible públicamente
- Debe ser HTTPS

---

## 📱 ACTUALIZAR LA APLICACIÓN

### Actualizar Backend

1. Push cambios a GitHub
2. Render detectará automáticamente y re-desplegará

### Actualizar Frontend

1. Push cambios a GitHub
2. Vercel detectará automáticamente y re-desplegará

---

## 💰 COSTOS

### Plan Free (Recomendado para pruebas)
- **Render PostgreSQL**: GRATIS (límite: 1GB)
- **Render Web Service**: GRATIS (dormir después de 15 min inactivo)
- **Vercel**: GRATIS (100GB bandwidth/mes)
- **Gemini API**: GRATIS hasta cierto límite
- **Claude API**: $5 USD de crédito inicial

**Total**: $0 USD para empezar

### Plan Paid (Recomendado para producción)
- **Render PostgreSQL**: $7/mes
- **Render Web Service**: $7/mes
- **Vercel Pro**: $20/mes
- **APIs**: Según uso

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Desplegar aplicación
2. ✅ Obtener API keys
3. ✅ Probar funcionalidad
4. 📊 Subir documentación de tu API favorita
5. 🚀 Generar insights y reportes
6. 💡 Compartir con tu equipo

---

¿Necesitas ayuda? Revisa README.md o contacta a cesar@alquimiadatalive.com
