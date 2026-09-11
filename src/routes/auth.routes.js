const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/auth/login - Autenticacion de usuarios con esquema real
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione el correo electronico y la contrasena.',
      });
    }

    // Consulta adaptada a usuarios (id_usuario, nombre_completo, correo, password, id_rol) y roles (id_rol, nombre)
    const query = `
      SELECT 
        u.id_usuario AS id, 
        u.nombre_completo AS nombre, 
        u.correo AS email, 
        u.password, 
        u.id_rol AS rol_id, 
        COALESCE(r.nombre, 'CLIENTE') AS rol
      FROM usuarios u
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE LOWER(u.correo) = LOWER($1)
      LIMIT 1
    `;

    const result = await db.query(query, [email.trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas. El usuario no existe.',
      });
    }

    const user = result.rows[0];

    // Validacion de contrasena
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas. Contrasena incorrecta.',
      });
    }

    // No retornar la contrasena en la respuesta
    const { password: _, ...userSafe } = user;

    return res.status(200).json({
      success: true,
      message: `Bienvenido a Memory Kings, ${userSafe.nombre}`,
      data: {
        user: userSafe,
      },
    });
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar la autenticacion.',
      error: error.message,
    });
  }
});

// POST /api/auth/register - Registro de nuevos usuarios
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y contrasena son obligatorios.',
      });
    }

    // Verificar si ya existe
    const exists = await db.query('SELECT id_usuario FROM usuarios WHERE LOWER(correo) = LOWER($1)', [email.trim()]);
    if (exists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El correo electronico ya se encuentra registrado.',
      });
    }

    // Obtener id_rol de CLIENTE
    const rolRes = await db.query("SELECT id_rol FROM roles WHERE UPPER(nombre) LIKE '%CLIEN%' LIMIT 1");
    const clienteRolId = rolRes.rows.length > 0 ? rolRes.rows[0].id_rol : 2;

    const insertQuery = `
      INSERT INTO usuarios (nombre_completo, correo, password, id_rol)
      VALUES ($1, $2, $3, $4)
      RETURNING id_usuario AS id, nombre_completo AS nombre, correo AS email, id_rol AS rol_id
    `;

    const result = await db.query(insertQuery, [
      nombre.trim(),
      email.trim(),
      password,
      clienteRolId
    ]);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: {
        user: { ...result.rows[0], rol: 'CLIENTE' },
      },
    });
  } catch (error) {
    console.error('Error en /api/auth/register:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar usuario.',
      error: error.message,
    });
  }
});

module.exports = router;
