const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/products/categories - Obtener lista de categorias
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT id_categoria AS id, nombre FROM categorias ORDER BY id_categoria ASC');
    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error en GET /api/products/categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las categorias.',
      error: error.message,
    });
  }
});

// GET /api/products - Listar productos (con soporte de busqueda y categoria)
router.get('/', async (req, res) => {
  try {
    const { categoria_id, search } = req.query;

    let query = `
      SELECT 
        p.id_producto AS id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.imagen_url,
        p.id_categoria AS categoria_id,
        COALESCE(c.nombre, 'General') AS categoria_nombre,
        true AS activo,
        p.fecha_creacion AS creado_en
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE 1=1
    `;
    const params = [];

    if (categoria_id && categoria_id !== 'all') {
      params.push(parseInt(categoria_id, 10));
      query += ` AND p.id_categoria = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      query += ` AND (LOWER(p.nombre) LIKE LOWER($${params.length}) OR LOWER(p.descripcion) LIKE LOWER($${params.length}))`;
    }

    query += ` ORDER BY p.id_producto DESC`;

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error en GET /api/products:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el listado de productos.',
      error: error.message,
    });
  }
});

// GET /api/products/:id - Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.id_producto AS id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.imagen_url,
        p.id_categoria AS categoria_id,
        COALESCE(c.nombre, 'General') AS categoria_nombre,
        true AS activo,
        p.fecha_creacion AS creado_en
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error en GET /api/products/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el producto.',
      error: error.message,
    });
  }
});

// POST /api/products - Registrar nuevo producto en inventario (Admin/ERP)
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, imagen_url, categoria_id } = req.body;

    if (!nombre || precio === undefined || stock === undefined || !categoria_id) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio, stock y categoria son campos obligatorios.',
      });
    }

    if (parseFloat(precio) < 0 || parseInt(stock, 10) < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio y el stock deben ser valores positivos.',
      });
    }

    const defaultImg = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500';

    const insertQuery = `
      INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, id_categoria)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_producto AS id, nombre, descripcion, precio, stock, imagen_url, id_categoria AS categoria_id
    `;

    const result = await db.query(insertQuery, [
      nombre.trim(),
      descripcion ? descripcion.trim() : '',
      parseFloat(precio),
      parseInt(stock, 10),
      imagen_url && imagen_url.trim() !== '' ? imagen_url.trim() : defaultImg,
      parseInt(categoria_id, 10),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Producto registrado exitosamente en el inventario.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error en POST /api/products:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar el producto en la base de datos.',
      error: error.message,
    });
  }
});

// PUT /api/products/:id - Actualizar stock y datos de producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, imagen_url, categoria_id } = req.body;

    const current = await db.query('SELECT * FROM productos WHERE id_producto = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El producto a actualizar no existe.',
      });
    }

    const item = current.rows[0];

    const updatedQuery = `
      UPDATE productos
      SET 
        nombre = $1,
        descripcion = $2,
        precio = $3,
        stock = $4,
        imagen_url = $5,
        id_categoria = $6
      WHERE id_producto = $7
      RETURNING id_producto AS id, nombre, descripcion, precio, stock, imagen_url, id_categoria AS categoria_id
    `;

    const result = await db.query(updatedQuery, [
      nombre !== undefined ? nombre.trim() : item.nombre,
      descripcion !== undefined ? descripcion.trim() : item.descripcion,
      precio !== undefined ? parseFloat(precio) : item.precio,
      stock !== undefined ? parseInt(stock, 10) : item.stock,
      imagen_url !== undefined ? imagen_url.trim() : item.imagen_url,
      categoria_id !== undefined ? parseInt(categoria_id, 10) : item.id_categoria,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Producto actualizado con exito.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error en PUT /api/products/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto.',
      error: error.message,
    });
  }
});

// DELETE /api/products/:id - Eliminar o vaciar stock
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('UPDATE productos SET stock = 0 WHERE id_producto = $1 RETURNING id_producto AS id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stock del producto puesto en 0.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error en DELETE /api/products/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto.',
      error: error.message,
    });
  }
});

module.exports = router;
