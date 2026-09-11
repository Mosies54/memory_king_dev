const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/orders - Crear nuevo pedido con esquema pgAdmin
router.post('/', async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { usuario_id, items } = req.body;

    if (!usuario_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el usuario y al menos un producto en el carrito.',
      });
    }

    // Iniciar Transacción SQL
    await client.query('BEGIN');

    let totalCalculado = 0;
    const validatedItems = [];

    // Validar stock y precios actuales desde la base de datos
    for (const item of items) {
      const prodRes = await client.query(
        'SELECT id_producto, nombre, precio, stock FROM productos WHERE id_producto = $1 FOR UPDATE',
        [item.producto_id]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `El producto con ID ${item.producto_id} no existe.`,
        });
      }

      const prod = prodRes.rows[0];

      if (prod.stock < item.cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${prod.nombre}". Stock disponible: ${prod.stock}, solicitado: ${item.cantidad}.`,
        });
      }

      const subtotal = parseFloat(prod.precio) * parseInt(item.cantidad, 10);
      totalCalculado += subtotal;

      validatedItems.push({
        producto_id: prod.id_producto,
        cantidad: parseInt(item.cantidad, 10),
        precio_unitario: parseFloat(prod.precio),
        nuevo_stock: prod.stock - parseInt(item.cantidad, 10),
      });
    }

    // 1. Insertar Cabecera del Pedido (pedidos: id_usuario, total, estado, fecha_pedido)
    const orderInsertQuery = `
      INSERT INTO pedidos (id_usuario, total, estado)
      VALUES ($1, $2, 'Pendiente')
      RETURNING id_pedido AS id, id_usuario AS usuario_id, fecha_pedido AS fecha, total, estado
    `;
    const orderRes = await client.query(orderInsertQuery, [
      usuario_id,
      totalCalculado.toFixed(2),
    ]);

    const pedido = orderRes.rows[0];

    // 2. Insertar Detalle y Descontar Inventario
    for (const vItem of validatedItems) {
      await client.query(
        `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedido.id, vItem.producto_id, vItem.cantidad, vItem.precio_unitario]
      );

      await client.query(
        `UPDATE productos SET stock = $1 WHERE id_producto = $2`,
        [vItem.nuevo_stock, vItem.producto_id]
      );
    }

    // Confirmar Transacción
    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Pedido generado exitosamente.',
      data: {
        pedido_id: pedido.id,
        total: pedido.total,
        estado: pedido.estado,
        fecha: pedido.fecha,
        items_count: validatedItems.length,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el pedido en el servidor.',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// GET /api/orders - Listar pedidos para el ERP / Administrador
router.get('/', async (req, res) => {
  try {
    const { usuario_id, estado } = req.query;

    let query = `
      SELECT 
        p.id_pedido AS id,
        p.id_usuario AS usuario_id,
        COALESCE(u.nombre_completo, 'Cliente General') AS cliente_nombre,
        COALESCE(u.correo, 'cliente@email.com') AS cliente_email,
        'No registrado' AS cliente_telefono,
        p.fecha_pedido AS fecha,
        p.total,
        p.estado,
        'Entrega Regular' AS direccion_envio,
        'Tarjeta / Efectivo' AS metodo_pago,
        COUNT(dp.id_detalle) AS total_items,
        COALESCE(
          json_agg(
            json_build_object(
              'producto_id', prod.id_producto,
              'producto_nombre', prod.nombre,
              'cantidad', dp.cantidad,
              'precio_unitario', dp.precio_unitario,
              'subtotal', (dp.cantidad * dp.precio_unitario)
            )
          ) FILTER (WHERE dp.id_detalle IS NOT NULL), '[]'
        ) AS items
      FROM pedidos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
      LEFT JOIN productos prod ON dp.id_producto = prod.id_producto
      WHERE 1=1
    `;
    const params = [];

    if (usuario_id) {
      params.push(parseInt(usuario_id, 10));
      query += ` AND p.id_usuario = $${params.length}`;
    }

    if (estado && estado !== 'all') {
      params.push(estado);
      query += ` AND LOWER(p.estado) = LOWER($${params.length})`;
    }

    query += `
      GROUP BY p.id_pedido, p.id_usuario, u.nombre_completo, u.correo, p.fecha_pedido, p.total, p.estado
      ORDER BY p.fecha_pedido DESC
    `;

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error en GET /api/orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar los pedidos.',
      error: error.message,
    });
  }
});

// PUT /api/orders/:id/status - Actualizar estado del pedido (ERP Admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el nuevo estado.',
      });
    }

    const currentOrder = await db.query('SELECT * FROM pedidos WHERE id_pedido = $1', [id]);
    if (currentOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado.',
      });
    }

    const previousState = currentOrder.rows[0].estado;
    const newState = estado;

    // Si se cancela un pedido que no estaba cancelado, reponer stock
    if (newState.toUpperCase() === 'CANCELADO' && previousState.toUpperCase() !== 'CANCELADO') {
      const items = await db.query('SELECT id_producto, cantidad FROM detalle_pedidos WHERE id_pedido = $1', [id]);
      for (const it of items.rows) {
        await db.query('UPDATE productos SET stock = stock + $1 WHERE id_producto = $2', [it.cantidad, it.id_producto]);
      }
    }

    const result = await db.query(
      'UPDATE pedidos SET estado = $1 WHERE id_pedido = $2 RETURNING id_pedido AS id, estado',
      [newState, id]
    );

    return res.status(200).json({
      success: true,
      message: `Estado del pedido #${id} actualizado a ${newState}.`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error en PUT /api/orders/:id/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del pedido.',
      error: error.message,
    });
  }
});

module.exports = router;
