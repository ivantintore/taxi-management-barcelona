# 🚕 Sistema de Gestión de Taxis Barcelona

Sistema completo de gestión y cierre mensual para 3 taxis en Barcelona. Permite el registro de jornadas laborales, liquidaciones diarias y cierres mensuales automatizados.

## 📋 Características

### Para Conductores:
- ✅ **Registro de Jornadas Laborales** con validación de 8h máximo
- ✅ **Liquidación Diaria** con cálculo automático según condiciones contractuales
- ✅ **Firma Digital** para cumplimiento legal
- ✅ **Interfaz Móvil** optimizada para tablets y smartphones

### Para Administración (Elena Fontelles):
- ✅ **Dashboard Completo** con estadísticas en tiempo real
- ✅ **Consulta de Jornadas** de todos los conductores
- ✅ **Revisión de Liquidaciones** con filtros y detalles
- ✅ **Cierre Mensual Automatizado** con carga de Excel
- ✅ **Reportes y Estadísticas** personalizables
- ✅ **Gestión de Usuarios** completa

## 🚗 Taxis Configurados

| Licencia | Conductor | Propietario | Condiciones |
|----------|-----------|-------------|-------------|
| **361** | Raul Maraver | Elena Fontelles | 40%/45% si >€300/día + comisión Freenow proporcional |
| **1061** | Ivan Alsina | Ivan Tintoré | 45% fijo - paga comisiones Freenow y Uber |
| **092** | Salvador Carmona | Ivan Tintoré | 40%/45% si >€300/día sin comisión Freenow |

## 🛠️ Instalación

### Requisitos Previos
- **Node.js** 16.0 o superior
- **NPM** (incluido con Node.js)
- Navegador web moderno

### Pasos de Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/ivantintore/taxi-management-barcelona.git
cd taxi-management-barcelona
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Crear directorios necesarios:**
```bash
mkdir uploads
```

4. **Iniciar el servidor:**
```bash
npm start
```

5. **Acceder a la aplicación:**
   - Abrir navegador en: `http://localhost:3000`

## 👥 Usuarios por Defecto

### Conductores:
- **Raul Maraver (361):** DNI: `12345678A` | Password: `taxi361`
- **Ivan Alsina (1061):** DNI: `87654321B` | Password: `taxi1061`  
- **Salvador Carmona (092):** DNI: `11223344C` | Password: `taxi092`

### Administración:
- **Elena Fontelles:** DNI: `99887766D` | Password: `admin2025`

> ⚠️ **IMPORTANTE:** Cambiar las contraseñas y DNIs por los reales antes de usar en producción.

## 🗄️ Base de Datos

La aplicación usa **SQLite** como base de datos local. Se crea automáticamente en el archivo `taxi_management.db` al iniciar por primera vez.

### Tablas Principales:
- `usuarios` - Información de conductores y administradores
- `jornadas` - Registro de jornadas laborales diarias
- `liquidaciones` - Liquidaciones económicas diarias
- `cierres_mensuales` - Datos de cierres mensuales

## 📱 Uso de la Aplicación

### Para Conductores:

1. **Acceder:** Introducir DNI/NIE con letra + contraseña
2. **Registrar Jornada:** 
   - Horario de inicio y fin
   - Descansos (se pueden añadir múltiples)
   - Validación automática de máximo 8h efectivas
   - Firma digital obligatoria
3. **Liquidación Diaria:**
   - Datos del servicio (carreras, kilómetros, tickets)
   - Ingresos (recaudación, visas, abonados, etc.)
   - Gastos (combustible, gas, otros)
   - Cálculo automático según condiciones contractuales

### Para Administración:

1. **Dashboard:** Estadísticas generales y resumen por taxista
2. **Jornadas:** Consulta todas las jornadas con filtros
3. **Liquidaciones:** Revisión de liquidaciones con detalles
4. **Cierre Mensual:** 
   - Seleccionar taxista, mes y año
   - Subir archivos Excel (banco, Freenow, Uber)
   - Procesamiento automático según condiciones de cada taxista
5. **Reportes:** Generación de informes personalizados

## 📄 Archivos para Cierre Mensual

El sistema requiere estos archivos Excel para el cierre:

- **📊 Banco:** Extractos bancarios con movimientos
- **🚕 Freenow:** Datos de carreras y comisiones de Freenow  
- **🚗 Uber:** Datos de carreras y comisiones de Uber
- **📱 Prima:** Datos del taxímetro (se extraen de la app)

## ⚖️ Cumplimiento Legal

- ✅ **Registro Horario:** Cumple la legislación española sobre registro de jornadas
- ✅ **Firma Digital:** Validación legal de las jornadas registradas
- ✅ **Máximo 8h:** Control automático del límite de horas efectivas
- ✅ **Trazabilidad:** Todos los registros son inmutables una vez guardados

## 🔧 Configuración Avanzada

### Variables de Entorno (Opcional)
Crear archivo `.env` para configuración personalizada:

```bash
PORT=3000
NODE_ENV=production
DB_NAME=taxi_management.db
SESSION_SECRET=taxi-bcn-secret-2025
```

### Backup de Base de Datos
```bash
# Crear copia de seguridad
cp taxi_management.db backup_$(date +%Y%m%d).db

# Restaurar desde backup
cp backup_20250115.db taxi_management.db
```

## 🚀 Despliegue en Producción

### Opción 1: Servidor Local
1. Configurar servidor con Node.js
2. Instalar aplicación según instrucciones
3. Configurar proxy reverso (Nginx recomendado)
4. Configurar SSL/HTTPS

### Opción 2: Plataformas Cloud
- **Heroku:** `git push heroku main`
- **Railway:** Conectar repositorio GitHub
- **DigitalOcean App Platform:** Deploy automático

## 🛡️ Seguridad

- 🔐 **Autenticación:** Sistema de sesiones seguro
- 🔒 **Contraseñas:** Hasheadas con bcrypt
- 👥 **Roles:** Separación clara entre conductores y administración
- 📝 **Validaciones:** Datos validados en frontend y backend
- 🚫 **Inmutabilidad:** Los registros no se pueden modificar tras guardar

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port already in use"
```bash
# Cambiar puerto en package.json o:
PORT=3001 npm start
```

### Error: Base de datos corrupta
```bash
rm taxi_management.db
npm start  # Se recreará automáticamente
```

## 📞 Soporte

Para soporte técnico o dudas sobre el sistema:

- **📧 Email:** elena.fontelles@example.com
- **📱 WhatsApp:** +34 XXX XXX XXX
- **🐛 Issues:** [GitHub Issues](https://github.com/ivantintore/taxi-management-barcelona/issues)

## 📊 Roadmap Futuro

- [ ] **App Móvil Nativa** (iOS/Android)
- [ ] **Integración API Taxímetros** automática
- [ ] **Notificaciones Push** para recordatorios
- [ ] **Dashboard Analytics** avanzado con gráficos
- [ ] **Exportación PDF** de reportes
- [ ] **Integración Contable** con software externo

## 📜 Licencia

Este proyecto es propiedad de **Elena Fontelles** y está destinado exclusivamente para la gestión de sus taxis en Barcelona.

---

**Desarrollado por:** Claude AI  
**Fecha:** Enero 2025  
**Versión:** 1.0.0

---

*Sistema diseñado específicamente para las necesidades de gestión de taxis en Barcelona, cumpliendo con toda la normativa laboral y fiscal vigente.*
