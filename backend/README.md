# 🗄️ Backend - API Intelligence Platform

Backend Node.js con Express, Prisma y PostgreSQL.

## 🚀 Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Copia `.env.example` a `.env` y configura tus variables:
```bash
cp .env.example .env
```

Edita `.env` y agrega:
- `DATABASE_URL`: Tu URL de PostgreSQL desde Render
- `GEMINI_API_KEY`: Tu API key de Google AI Studio
- `CLAUDE_API_KEY`: Tu API key de Anthropic
- `JWT_SECRET`: Un secreto seguro para JWT

### 3. Configurar Base de Datos

**Opción A: Script Automático (Recomendado)**
```bash
.\setup-database.ps1
```

**Opción B: Comandos Manuales**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Iniciar Servidor
```bash
npm run dev    # Desarrollo con nodemon
npm start      # Producción
```

## 📁 Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   └── migrations/         # Migraciones de Prisma
├── routes/
│   ├── documents.js        # Rutas para documentos
│   ├── apis.js             # Rutas para APIs descubiertas
│   ├── endpoints.js        # Rutas para endpoints
│   ├── executions.js       # Rutas para ejecuciones
│   ├── insights.js         # Rutas para insights
│   └── reports.js          # Rutas para reportes
├── services/
│   ├── ai.js               # Servicios de IA (Gemini, Claude)
│   └── analyzer.js         # Análisis de documentos
├── server.js               # Punto de entrada
├── .env                    # Variables de entorno (no subir a git)
├── .env.example            # Ejemplo de variables
└── package.json
```

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Iniciar con nodemon (desarrollo)
npm run migrate    # Ejecutar migraciones
npm run studio     # Abrir Prisma Studio
npm run seed       # Poblar base de datos (si existe)
```

## 🗄️ Modelos de Base de Datos

- **Document**: Documentos cargados (PDF o URL)
- **Api**: APIs descubiertas
- **Endpoint**: Endpoints de cada API
- **Credential**: Credenciales para ejecutar APIs
- **ApiExecution**: Historial de ejecuciones
- **Insight**: Insights generados por IA
- **Report**: Reportes generados
- **AiModelConfig**: Configuración de modelos de IA

## 🔌 API Endpoints

### Documentos
- `POST /api/documents/upload` - Subir PDF
- `POST /api/documents/url` - Analizar URL
- `GET /api/documents` - Listar documentos
- `GET /api/documents/:id` - Obtener documento

### APIs
- `GET /api/apis` - Listar APIs descubiertas
- `GET /api/apis/:id` - Obtener API
- `POST /api/apis/:id/credentials` - Configurar credenciales

### Endpoints
- `GET /api/endpoints` - Listar endpoints
- `POST /api/endpoints/:id/execute` - Ejecutar endpoint

### Insights
- `GET /api/insights` - Listar insights
- `GET /api/insights/:id` - Obtener insight

### Reportes
- `GET /api/reports` - Listar reportes
- `POST /api/reports/generate` - Generar reporte

## 🤖 Modelos de IA Soportados

### Gemini (Google)
- `gemini-2.0-flash-exp` (Recomendado)
- `gemini-1.5-pro`

### Claude (Anthropic)
- `claude-3-5-sonnet-20241022` (Recomendado)
- `claude-3-opus-20240229`

### OpenAI (Opcional)
- `gpt-4-turbo-preview`
- `gpt-3.5-turbo`

## 🔒 Seguridad

- Las credenciales se almacenan encriptadas
- JWT para autenticación
- CORS configurado para frontend
- Variables sensibles en `.env` (no en git)

## 🐛 Solución de Problemas

### Error: "Table does not exist"
Ver: [../FIX_DATABASE_ERROR.md](../FIX_DATABASE_ERROR.md)

### Error: "Can't reach database"
- Verifica DATABASE_URL en `.env`
- Asegúrate de incluir `?sslmode=require`
- Verifica que la base de datos esté activa

### Error: "API key invalid"
- Verifica tus API keys en `.env`
- Asegúrate de que no tengan espacios
- Verifica que no hayan expirado

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com/)
- [Gemini API](https://ai.google.dev/)
- [Claude API](https://docs.anthropic.com/)

## 🚀 Despliegue en Render

Ver: [../DEPLOYMENT.md](../DEPLOYMENT.md)

Build Command:
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

Start Command:
```bash
npm start
```

## 📝 Notas

- El servidor corre en el puerto definido en `PORT` (default: 8000)
- Los archivos subidos se guardan en `./uploads/`
- Prisma Studio está disponible en desarrollo: `npm run studio`
