# 🚀 API Intelligence Platform

Plataforma inteligente que descubre, analiza y ejecuta APIs automáticamente desde documentación PDF o web.

## ✨ Características

- 📄 **Análisis de PDFs**: Sube documentación en PDF y extrae APIs automáticamente
- 🌐 **Análisis Web**: Analiza sitios de documentación de APIs
- 🤖 **IA Múltiple**: Soporte para Gemini 3, Claude 4.5 y GPT-5.2 (modelos vigentes dic 2025)
- ⚡ **Ejecución Automática**: Ejecuta endpoints con parámetros generados por IA
- 📊 **Dashboard**: Visualiza métricas y estadísticas
- 💡 **Insights**: Genera análisis accionables en lenguaje humano
- 📝 **Reportes Ejecutivos**: Crea reportes para nivel gerencial

## 🏗️ Arquitectura

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: Next.js + Tailwind CSS
- **Base de Datos**: PostgreSQL en Render
- **Despliegue**: Backend en Render, Frontend en Vercel

---

## 📋 INSTRUCCIONES DE DESPLIEGUE PASO A PASO

### PARTE 1: BASE DE DATOS EN RENDER

1. **Ir a Render.com**
   - Visita https://render.com
   - Crea una cuenta o inicia sesión

2. **Crear PostgreSQL Database**
   - Click en "New +" → "PostgreSQL"
   - Nombre: `api-intelligence-db`
   - Region: `Oregon (US West)`
   - PostgreSQL Version: `16`
   - Plan: `Free` (o el que prefieras)
   - Click en "Create Database"

3. **Copiar DATABASE_URL**
   - Una vez creada, ve a la pestaña "Connect"
   - Copia el "External Database URL"
   - Guárdala, la necesitarás más adelante

### PARTE 2: BACKEND EN RENDER

1. **Subir Código a GitHub**
   - Crea un repositorio en GitHub
   - Sube SOLO la carpeta `backend/` al repositorio

2. **Crear Web Service en Render**
   - En Render, click en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Configuración:
     - Name: `api-intelligence-backend`
     - Region: `Oregon (US West)`
     - Branch: `main`
     - Root Directory: `backend` (si pusiste el backend en una subcarpeta)
     - Runtime: `Node`
     - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
     - Start Command: `npm start`
     - Plan: `Free`

3. **Configurar Variables de Entorno**
   Click en "Environment" y agrega:

   ```
   DATABASE_URL=postgresql://usuario:password@host/database (la que copiaste antes)
   PORT=8000
   JWT_SECRET=tu_secreto_super_seguro_cambiar_esto_123456
   GEMINI_API_KEY=tu_api_key_de_gemini_aqui
   CLAUDE_API_KEY=tu_api_key_de_claude_aqui
   OPENAI_API_KEY=tu_api_key_de_openai_aqui
   FRONTEND_URL=https://tu-app.vercel.app
   MAX_FILE_SIZE=50000000
   UPLOAD_DIR=./uploads
   ```

4. **Deploy**
   - Click en "Create Web Service"
   - Espera a que termine el despliegue
   - Copia la URL del backend (ej: `https://api-intelligence-backend.onrender.com`)

### PARTE 3: FRONTEND EN VERCEL

1. **Subir Frontend a GitHub**
   - Sube la carpeta `frontend/` a un repositorio (puede ser el mismo o diferente)

2. **Importar a Vercel**
   - Ve a https://vercel.com
   - Click en "Add New..." → "Project"
   - Importa tu repositorio de GitHub

3. **Configurar Proyecto**
   - Framework Preset: `Next.js`
   - Root Directory: `frontend` (si está en subcarpeta)
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Variables de Entorno**
   En "Environment Variables" agrega:

   ```
   NEXT_PUBLIC_API_URL=https://api-intelligence-backend.onrender.com
   ```

5. **Deploy**
   - Click en "Deploy"
   - Espera a que termine
   - ¡Tu app estará lista!

### PARTE 4: OBTENER API KEYS

#### Gemini API (Google)
1. Ve a https://ai.google.dev/
2. Click en "Get API key"
3. Crea un proyecto en Google Cloud
4. Copia tu API key

#### Claude API (Anthropic)
1. Ve a https://console.anthropic.com/
2. Crea una cuenta
3. Ve a "API Keys"
4. Genera una nueva API key
5. Cópiala

#### OpenAI API (Opcional)
1. Ve a https://platform.openai.com/
2. Crea una cuenta
3. Ve a "API keys"
4. Crea una nueva key
5. Cópiala

---

## 🎯 CÓMO USAR LA PLATAFORMA

### Paso 1: Cargar Documentación
1. Abre la app en tu navegador
2. En la pestaña "Cargar Documentos":
   - Sube un PDF de documentación de API, O
   - Ingresa una URL de documentación web
3. Selecciona el modelo de IA (recomendado: Gemini 3 Flash)
4. Click en "Subir y Analizar" o "Analizar Sitio Web"

### Paso 2: Ver APIs Descubiertas
1. Ve a la pestaña "APIs Descubiertas"
2. Verás todas las APIs encontradas automáticamente
3. Expande una API para ver sus endpoints
4. Click en "Ejecutar" para ejecutar un endpoint

### Paso 3: Dashboard
1. Ve a la pestaña "Dashboard"
2. Visualiza métricas:
   - Total de documentos procesados
   - APIs descubiertas
   - Ejecuciones realizadas
   - Tasa de éxito

### Paso 4: Ver Insights
1. Ve a la pestaña "Insights"
2. Filtra por categoría:
   - Tendencias
   - Anomalías
   - Oportunidades
   - Riesgos
3. Cada insight está en lenguaje humano simple

### Paso 5: Generar Reportes
1. Ve a la pestaña "Reportes"
2. Click en "Nuevo Reporte"
3. La IA generará un reporte ejecutivo con:
   - Resumen ejecutivo
   - Hallazgos clave
   - Recomendaciones
   - Datos destacados

---

## 🔧 DESARROLLO LOCAL

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🎨 MODELOS DE IA SOPORTADOS (Diciembre 2025)

### Gemini (Google)
- `gemini-3-flash-preview` ⭐ Recomendado - Más reciente (17 dic 2025)
- `gemini-3-pro` - Máxima capacidad
- `gemini-3-deep-think` - Razonamiento profundo
- `gemini-2.5-pro` - Estable
- `gemini-2.5-flash` - Balance precio-rendimiento
- `gemini-2.5-flash-lite` - Ultra rápido

### Claude (Anthropic)
- `claude-sonnet-4-5-20250929` ⭐ Recomendado - Más inteligente
- `claude-haiku-4-5-20251001` - Ultra rápido
- `claude-opus-4-1` - Máxima capacidad

### OpenAI (Opcional)
- `gpt-5.2` ⭐ Más reciente (11 dic 2025)
- `gpt-4-turbo`
- `gpt-4`

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to database"
- Verifica que DATABASE_URL esté correctamente configurada
- Asegúrate de haber ejecutado las migraciones: `npx prisma migrate deploy`

### Error: "API key invalid"
- Verifica que las API keys estén correctas
- Revisa que no tengan espacios al principio/final

### Error: "CORS error"
- Verifica que FRONTEND_URL en el backend apunte a tu dominio de Vercel

### PDFs no se procesan
- Verifica que el PDF sea texto (no imagen escaneada)
- Máximo 50MB por archivo

---

## 📧 SOPORTE

Creado por: Alquimia Datalive
Contacto: cesar@alquimiadatalive.com

## 📄 LICENCIA

© 2025 Alquimia Datalive - Todos los derechos reservados
