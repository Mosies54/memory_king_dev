require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const autoMigrateAndSeed = require('./config/initDb');

// Rutas
const authRoutes = require('./routes/auth.routes');
const productsRoutes = require('./routes/products.routes');
const ordersRoutes = require('./routes/orders.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend (HTML5, CSS3, Vanilla JS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas de API REST
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

// Endpoint de verificacion de salud (Health check)
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT NOW() AS current_time');
    res.status(200).json({
      status: 'OK',
      timestamp: dbTest.rows[0].current_time,
      service: 'Memory Kings Perú S.A.C. E-Commerce & ERP API',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'No se pudo conectar a la base de datos PostgreSQL.',
      error: error.message,
    });
  }
});

// Fallback para SPA / Rutas HTML principales si se navega directamente
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta o recurso no encontrado en el servidor.',
  });
});

// Iniciar servidor, sincronizar BD PostgreSQL y desplegar escuchadores
app.listen(PORT, async () => {
  console.log('====================================================');
  console.log('  MEMORY KINGS PERU S.A.C. - SERVIDOR WEB & ERP     ');
  console.log('====================================================');
  console.log(` Servidor Express escuchando en: http://localhost:${PORT}`);
  console.log(` Catalogo Publico: http://localhost:${PORT}/index.html`);
  console.log(` Login Corporativo: http://localhost:${PORT}/login.html`);
  console.log(` Panel ERP / Admin: http://localhost:${PORT}/admin.html`);
  console.log('----------------------------------------------------');

  try {
    const res = await db.query('SELECT current_database() AS db_name, version()');
    console.log(` [DB OK] Conectado exitosamente a PostgreSQL: ${res.rows[0].db_name}`);
    
    // Auto migración y siembra de tablas en el arranque
    await autoMigrateAndSeed();

  } catch (err) {
    console.warn(` [DB AVISO] No se pudo conectar a PostgreSQL (${err.message}).`);
    console.warn('  Asegurate de ejecutar el script database.sql y configurar tu .env');
  }
  console.log('====================================================');
});
