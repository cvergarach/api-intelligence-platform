# ⚡ SOLUCIÓN RÁPIDA - 3 COMANDOS

## 🎯 El Problema
```
Error: The table `public.Document` does not exist
Causa: No hay migraciones en backend/prisma/migrations/
```

## ✅ La Solución

### 1. Configurar .env
Edita `backend/.env` y agrega tu DATABASE_URL desde Render:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 2. Ejecutar Script
```powershell
cd backend
.\setup-database.ps1
```

### 3. Subir a GitHub
```bash
git add backend/prisma/migrations/ backend/.gitignore
git commit -m "Add initial database migration"
git push origin main
```

## 🎉 ¡Listo!
Render re-desplegará automáticamente en 5-10 minutos.

---

## 📖 Guía Completa
Ver: [FIX_DATABASE_ERROR.md](./FIX_DATABASE_ERROR.md)
