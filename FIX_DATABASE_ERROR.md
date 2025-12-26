# 🔧 Solución: Error "Table Document does not exist"

## 🎯 Problema
El error indica que las tablas de la base de datos no existen. Esto sucede porque las migraciones de Prisma no se han ejecutado en tu base de datos de producción.

```
Error: The table `public.Document` does not exist in the current database.
```

## ✅ Soluciones (Elige una)

---

### **Opción 1: Redeploy en Render (MÁS FÁCIL) ⭐**

Esta es la solución más simple y recomendada:

1. **Ve a Render Dashboard**: https://dashboard.render.com
2. **Selecciona tu servicio backend**: `api-intelligence-backend`
3. **Click en "Manual Deploy"**
4. **Selecciona "Deploy latest commit"**
5. **Espera 5-10 minutos** mientras se ejecuta el build command que incluye:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

Esto ejecutará automáticamente las migraciones y creará todas las tablas.

---

### **Opción 2: Ejecutar Migraciones Manualmente desde tu PC**

Si prefieres ejecutar las migraciones desde tu computadora local:

#### Paso 1: Crear archivo `.env` en la carpeta backend

Crea el archivo `backend/.env` con el siguiente contenido:

```env
# Copia tu DATABASE_URL desde Render
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Otras variables (opcional para migraciones)
PORT=8000
JWT_SECRET=cambiar_por_secreto_super_seguro_123456
```

**IMPORTANTE**: Reemplaza `DATABASE_URL` con tu URL real de Render:
- Ve a Render Dashboard
- Selecciona tu base de datos PostgreSQL
- Copia el "External Database URL" desde la pestaña "Info"

#### Paso 2: Crear la primera migración

Abre una terminal en la carpeta `backend` y ejecuta:

```bash
cd backend
npx prisma migrate dev --name init
```

Esto creará:
- Una carpeta `prisma/migrations/` con la migración inicial
- Todas las tablas en tu base de datos

#### Paso 3: Verificar que las tablas se crearon

```bash
npx prisma studio
```

Esto abrirá una interfaz web donde puedes ver todas tus tablas.

---

### **Opción 3: Usar Prisma DB Push (Desarrollo rápido)**

Si solo quieres crear las tablas sin generar archivos de migración:

```bash
cd backend
npx prisma db push
```

> ⚠️ **Advertencia**: `db push` es útil para desarrollo, pero para producción se recomienda usar migraciones (`migrate deploy`).

---

## 🔍 Verificar que funcionó

Después de ejecutar cualquiera de las opciones anteriores:

### 1. Verificar el Backend
Visita: `https://tu-backend.onrender.com/health`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T...",
  "message": "API Intelligence Platform - Backend funcionando correctamente"
}
```

### 2. Probar subir un PDF
Ve a tu frontend y sube un PDF de prueba. Ya no debería aparecer el error.

---

## 📋 Comandos Útiles de Prisma

```bash
# Ver el estado de las migraciones
npx prisma migrate status

# Generar el cliente de Prisma (después de cambios en schema.prisma)
npx prisma generate

# Aplicar migraciones pendientes en producción
npx prisma migrate deploy

# Abrir Prisma Studio para ver los datos
npx prisma studio

# Resetear la base de datos (⚠️ BORRA TODOS LOS DATOS)
npx prisma migrate reset
```

---

## 🐛 Problemas Comunes

### Error: "Environment variable not found: DATABASE_URL"
**Solución**: Crea el archivo `.env` en la carpeta `backend` con tu `DATABASE_URL`

### Error: "Can't reach database server"
**Solución**: 
- Verifica que tu `DATABASE_URL` sea correcta
- Asegúrate de incluir `?sslmode=require` al final
- Verifica que tu IP no esté bloqueada por Render

### Error: "Migration failed"
**Solución**:
- Verifica que tu base de datos esté activa en Render
- Revisa los logs en Render Dashboard
- Intenta con `npx prisma db push` primero

---

## 📝 Notas Importantes

1. **No subas el archivo `.env` a GitHub** - Ya está en `.gitignore`
2. **Las migraciones solo necesitan ejecutarse una vez** por cada cambio en `schema.prisma`
3. **En producción (Render)**, las migraciones se ejecutan automáticamente con el build command
4. **Si cambias `schema.prisma`**, debes crear una nueva migración:
   ```bash
   npx prisma migrate dev --name descripcion_del_cambio
   ```

---

## 🎯 Recomendación

**Para resolver tu error actual**: Usa la **Opción 1** (Redeploy en Render) - es la más simple y segura.

**Para desarrollo futuro**: Configura el archivo `.env` local para poder ejecutar migraciones desde tu PC.

---

¿Necesitas más ayuda? Revisa la documentación de Prisma: https://www.prisma.io/docs/concepts/components/prisma-migrate
