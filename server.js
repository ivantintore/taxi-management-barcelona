const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuración de sesiones
app.use(session({
  secret: 'taxi-bcn-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Cambiar a true en producción con HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Configuración multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Inicializar base de datos
const db = new sqlite3.Database('taxi_management.db');

// Crear tablas si no existen
db.serialize(() => {
  // Tabla usuarios
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dni TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre TEXT NOT NULL,
    licencia TEXT NOT NULL,
    propietario TEXT NOT NULL,
    tipo TEXT DEFAULT 'taxista',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla jornadas laborales
  db.run(`CREATE TABLE IF NOT EXISTS jornadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    fecha DATE NOT NULL,
    inicio_jornada TIME NOT NULL,
    fin_jornada TIME NOT NULL,
    descansos TEXT, -- JSON con array de descansos
    horas_efectivas DECIMAL(4,2),
    firma_digital TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    UNIQUE(usuario_id, fecha)
  )`);

  // Tabla liquidaciones diarias
  db.run(`CREATE TABLE IF NOT EXISTS liquidaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    fecha DATE NOT NULL,
    licencia TEXT NOT NULL,
    empresa TEXT DEFAULT 'PROVETAXI',
    turno_realizado TEXT NOT NULL,
    num_cierre INTEGER,
    carreras DECIMAL(10,2) DEFAULT 0,
    kilometros DECIMAL(10,2) DEFAULT 0,
    num_tickets INTEGER DEFAULT 0,
    prima TEXT DEFAULT 'Básica',
    recaudacion DECIMAL(10,2) DEFAULT 0,
    servicios_internos DECIMAL(10,2) DEFAULT 0,
    peajes_incidencias DECIMAL(10,2) DEFAULT 0,
    visas DECIMAL(10,2) DEFAULT 0,
    abonados DECIMAL(10,2) DEFAULT 0,
    combustible DECIMAL(10,2) DEFAULT 0,
    gas DECIMAL(10,2) DEFAULT 0,
    otros_gastos DECIMAL(10,2) DEFAULT 0,
    regulacion_salarial DECIMAL(10,2) DEFAULT 0,
    embargo DECIMAL(10,2) DEFAULT 0,
    entregar_empresa DECIMAL(10,2) DEFAULT 0,
    conductor DECIMAL(10,2) DEFAULT 0,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    UNIQUE(usuario_id, fecha)
  )`);

  // Tabla cierres mensuales
  db.run(`CREATE TABLE IF NOT EXISTS cierres_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    mes INTEGER NOT NULL,
    año INTEGER NOT NULL,
    archivo_banco TEXT,
    archivo_freenow TEXT,
    archivo_uber TEXT,
    datos_procesados TEXT, -- JSON con resultados
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    UNIQUE(usuario_id, mes, año)
  )`);

  // Insertar usuarios iniciales si no existen
  const usuarios = [
    {
      dni: '12345678A', // Cambiar por DNI real de Raul
      password: 'taxi361',
      nombre: 'Raul Maraver',
      licencia: '361',
      propietario: 'Elena Fontelles'
    },
    {
      dni: '87654321B', // Cambiar por DNI real de Ivan
      password: 'taxi1061',
      nombre: 'Ivan Alsina',
      licencia: '1061',
      propietario: 'Ivan Tintoré'
    },
    {
      dni: '11223344C', // Cambiar por DNI real de Salvador
      password: 'taxi092',
      nombre: 'Salvador Carmona',
      licencia: '092',
      propietario: 'Ivan Tintoré'
    },
    {
      dni: '99887766D', // DNI de Elena (administradora)
      password: 'admin2025',
      nombre: 'Elena Fontelles',
      licencia: 'ADMIN',
      propietario: 'Elena Fontelles',
      tipo: 'admin'
    }
  ];

  usuarios.forEach(usuario => {
    const hashedPassword = bcrypt.hashSync(usuario.password, 10);
    db.run(`INSERT OR IGNORE INTO usuarios (dni, password, nombre, licencia, propietario, tipo) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
           [usuario.dni, hashedPassword, usuario.nombre, usuario.licencia, usuario.propietario, usuario.tipo || 'taxista']);
  });
});

// RUTAS DE LA API

// Página principal - login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login
app.post('/api/login', (req, res) => {
  const { dni, password } = req.body;
  
  if (!dni || !password) {
    return res.status(400).json({ error: 'DNI y contraseña son requeridos' });
  }

  db.get('SELECT * FROM usuarios WHERE dni = ?', [dni.toUpperCase()], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error de base de datos' });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Guardar sesión
    req.session.userId = user.id;
    req.session.userType = user.tipo;
    req.session.licencia = user.licencia;
    req.session.nombre = user.nombre;

    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        licencia: user.licencia,
        tipo: user.tipo
      }
    });
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
};

// Middleware para verificar admin
const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.userType !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado - solo administradores' });
  }
  next();
};

// Dashboard - obtener datos del usuario
app.get('/api/dashboard', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.session.userId,
      nombre: req.session.nombre,
      licencia: req.session.licencia,
      tipo: req.session.userType
    }
  });
});

// Registrar jornada laboral
app.post('/api/jornada', requireAuth, (req, res) => {
  const {
    fecha,
    inicio_jornada,
    fin_jornada,
    descansos,
    horas_efectivas,
    firma_digital
  } = req.body;

  // Validar máximo 8 horas efectivas
  if (horas_efectivas > 8) {
    return res.status(400).json({ 
      error: 'No se pueden registrar más de 8 horas efectivas de trabajo'
    });
  }

  db.run(`INSERT OR REPLACE INTO jornadas 
          (usuario_id, fecha, inicio_jornada, fin_jornada, descansos, horas_efectivas, firma_digital)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [req.session.userId, fecha, inicio_jornada, fin_jornada, 
          JSON.stringify(descansos), horas_efectivas, firma_digital],
         function(err) {
           if (err) {
             console.error(err);
             return res.status(500).json({ error: 'Error al guardar jornada' });
           }
           res.json({ success: true, id: this.lastID });
         });
});

// Registrar liquidación diaria
app.post('/api/liquidacion', requireAuth, (req, res) => {
  const liquidacionData = { ...req.body };
  liquidacionData.usuario_id = req.session.userId;
  liquidacionData.licencia = req.session.licencia;

  const campos = Object.keys(liquidacionData);
  const valores = Object.values(liquidacionData);
  const placeholders = campos.map(() => '?').join(',');

  db.run(`INSERT OR REPLACE INTO liquidaciones (${campos.join(',')})
          VALUES (${placeholders})`,
         valores,
         function(err) {
           if (err) {
             console.error(err);
             return res.status(500).json({ error: 'Error al guardar liquidación' });
           }
           res.json({ success: true, id: this.lastID });
         });
});

// Obtener jornadas (solo admin puede ver todas)
app.get('/api/jornadas', requireAuth, (req, res) => {
  let query = 'SELECT j.*, u.nombre, u.licencia FROM jornadas j JOIN usuarios u ON j.usuario_id = u.id';
  let params = [];

  if (req.session.userType !== 'admin') {
    query += ' WHERE j.usuario_id = ?';
    params.push(req.session.userId);
  }

  query += ' ORDER BY j.fecha DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener jornadas' });
    }
    res.json(rows);
  });
});

// Obtener liquidaciones (solo admin puede ver todas)
app.get('/api/liquidaciones', requireAuth, (req, res) => {
  let query = 'SELECT l.*, u.nombre FROM liquidaciones l JOIN usuarios u ON l.usuario_id = u.id';
  let params = [];

  if (req.session.userType !== 'admin') {
    query += ' WHERE l.usuario_id = ?';
    params.push(req.session.userId);
  }

  query += ' ORDER BY l.fecha DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener liquidaciones' });
    }
    res.json(rows);
  });
});

// Subir archivos para cierre mensual (solo admin)
app.post('/api/cierre-mensual/upload', requireAdmin, upload.array('archivos', 10), (req, res) => {
  const { usuario_id, mes, año } = req.body;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No se subieron archivos' });
  }

  // Procesar archivos subidos
  const archivos = {};
  req.files.forEach(file => {
    const nombre = file.originalname.toLowerCase();
    if (nombre.includes('banco')) archivos.banco = file.filename;
    else if (nombre.includes('freenow')) archivos.freenow = file.filename;
    else if (nombre.includes('uber')) archivos.uber = file.filename;
  });

  // Guardar en base de datos
  db.run(`INSERT OR REPLACE INTO cierres_mensuales 
          (usuario_id, mes, año, archivo_banco, archivo_freenow, archivo_uber)
          VALUES (?, ?, ?, ?, ?, ?)`,
         [usuario_id, mes, año, archivos.banco, archivos.freenow, archivos.uber],
         function(err) {
           if (err) {
             return res.status(500).json({ error: 'Error al guardar cierre mensual' });
           }
           res.json({ success: true, archivos });
         });
});

// Procesar cierre mensual (solo admin)
app.post('/api/cierre-mensual/procesar', requireAdmin, (req, res) => {
  const { usuario_id, mes, año } = req.body;
  
  // Aquí iría la lógica compleja de procesamiento según las condiciones de cada taxista
  // Por ahora, devolvemos un placeholder
  res.json({ 
    success: true, 
    mensaje: 'Cierre mensual procesado correctamente',
    // Aquí incluirías los cálculos específicos de cada taxista
  });
});

// Obtener usuarios (solo admin)
app.get('/api/usuarios', requireAdmin, (req, res) => {
  db.all('SELECT id, dni, nombre, licencia, propietario, tipo FROM usuarios', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
    res.json(rows);
  });
});

// Crear directorio uploads si no existe
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚕 Servidor de Gestión de Taxis Barcelona ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Acceso: http://localhost:${PORT}`);
});

module.exports = app;