# 🚀 Script de Configuración de Base de Datos
# Este script crea las migraciones y configura la base de datos

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACIÓN DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Host "❌ Error: Debes ejecutar este script desde la carpeta 'backend'" -ForegroundColor Red
    Write-Host "   Ejecuta: cd backend" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Copia tu DATABASE_URL desde Render Dashboard" -ForegroundColor Yellow
    Write-Host "2. Edita el archivo backend/.env" -ForegroundColor Yellow
    Write-Host "3. Reemplaza DATABASE_URL con tu URL real" -ForegroundColor Yellow
    Write-Host "4. Vuelve a ejecutar este script" -ForegroundColor Yellow
    exit 1
}

# Verificar que DATABASE_URL esté configurada
$envContent = Get-Content ".env" -Raw
if ($envContent -match 'DATABASE_URL="postgresql://user:password') {
    Write-Host "⚠️  Advertencia: DATABASE_URL parece ser un placeholder" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Abre backend/.env" -ForegroundColor Yellow
    Write-Host "2. Reemplaza DATABASE_URL con tu URL real desde Render" -ForegroundColor Yellow
    Write-Host "3. Vuelve a ejecutar este script" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "¿Quieres continuar de todas formas? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 0
    }
}

Write-Host ""
Write-Host "📦 Paso 1: Instalando dependencias..." -ForegroundColor Green
npm install

Write-Host ""
Write-Host "🔧 Paso 2: Generando cliente de Prisma..." -ForegroundColor Green
npx prisma generate

Write-Host ""
Write-Host "🗄️  Paso 3: Creando migración inicial..." -ForegroundColor Green
Write-Host "   (Esto creará las tablas en tu base de datos)" -ForegroundColor Gray

# Crear migración
npx prisma migrate dev --name init

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡Migración creada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Verifica las tablas con: npx prisma studio" -ForegroundColor White
    Write-Host "2. Sube las migraciones a GitHub:" -ForegroundColor White
    Write-Host "   git add prisma/migrations/" -ForegroundColor Gray
    Write-Host "   git commit -m 'Add initial database migration'" -ForegroundColor Gray
    Write-Host "   git push origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Render detectará el cambio y re-desplegará automáticamente" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Error al crear la migración" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Verifica que DATABASE_URL sea correcta en .env" -ForegroundColor White
    Write-Host "2. Asegúrate de incluir ?sslmode=require al final de la URL" -ForegroundColor White
    Write-Host "3. Verifica que tu base de datos esté activa en Render" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternativa rápida:" -ForegroundColor Yellow
    Write-Host "   npx prisma db push" -ForegroundColor Gray
}
