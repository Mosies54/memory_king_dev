const db = require('./db');

async function autoMigrateAndSeed() {
  try {
    console.log(' [DB] Verificando tablas con el esquema exacto de pgAdmin...');

    // 1. ROLES (id_rol, nombre)
    await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id_rol SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL
      );
    `);

    // Sembrar roles basicos si no existen
    const rolesCount = await db.query('SELECT COUNT(*) FROM roles');
    if (parseInt(rolesCount.rows[0].count, 10) === 0) {
      await db.query(`
        INSERT INTO roles (nombre) VALUES 
        ('ADMINISTRADOR'), 
        ('CLIENTE'), 
        ('ALMACENERO');
      `);
      console.log(' [DB] Roles creados: ADMINISTRADOR, CLIENTE, ALMACENERO');
    }

    // Obtener IDs reales de los roles
    const adminRolRes = await db.query("SELECT id_rol FROM roles WHERE UPPER(nombre) LIKE '%ADMIN%' LIMIT 1");
    const adminRolId = adminRolRes.rows.length > 0 ? adminRolRes.rows[0].id_rol : 1;

    const clienteRolRes = await db.query("SELECT id_rol FROM roles WHERE UPPER(nombre) LIKE '%CLIEN%' LIMIT 1");
    const clienteRolId = clienteRolRes.rows.length > 0 ? clienteRolRes.rows[0].id_rol : 2;

    // 2. USUARIOS (id_usuario, nombre_completo, correo, password, id_rol, fecha_registro)
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario SERIAL PRIMARY KEY,
        nombre_completo VARCHAR(150) NOT NULL,
        correo VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        id_rol INT NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Asegurar usuario Administrador
    const adminExists = await db.query(
      "SELECT id_usuario FROM usuarios WHERE LOWER(correo) = 'admin@memorykings.com.pe'"
    );
    if (adminExists.rows.length === 0) {
      await db.query(`
        INSERT INTO usuarios (nombre_completo, correo, password, id_rol) 
        VALUES ('Administrador Memory Kings', 'admin@memorykings.com.pe', 'admin123', $1);
      `, [adminRolId]);
      console.log(' [DB] Usuario Admin creado: admin@memorykings.com.pe / admin123');
    }

    // Asegurar usuario Cliente
    const clienteExists = await db.query(
      "SELECT id_usuario FROM usuarios WHERE LOWER(correo) = 'cliente@gmail.com'"
    );
    if (clienteExists.rows.length === 0) {
      await db.query(`
        INSERT INTO usuarios (nombre_completo, correo, password, id_rol) 
        VALUES ('Cliente Preferencial', 'cliente@gmail.com', 'cliente123', $1);
      `, [clienteRolId]);
      console.log(' [DB] Usuario Cliente creado: cliente@gmail.com / cliente123');
    }

    // 3. CATEGORIAS (id_categoria, nombre)
    await db.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id_categoria SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL
      );
    `);

    const catCount = await db.query('SELECT COUNT(*) FROM categorias');
    if (parseInt(catCount.rows[0].count, 10) === 0) {
      await db.query(`
        INSERT INTO categorias (nombre) VALUES 
        ('Procesadores'),
        ('Tarjetas de Video'),
        ('Memorias RAM'),
        ('Almacenamiento'),
        ('Laptops'),
        ('Perifericos');
      `);
      console.log(' [DB] Categorias iniciales insertadas.');
    }

    // 4. PRODUCTOS (id_producto, nombre, descripcion, precio, stock, imagen_url, id_categoria, fecha_creacion)
    await db.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id_producto SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        descripcion TEXT,
        precio NUMERIC(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        imagen_url VARCHAR(255),
        id_categoria INT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const prodCount = await db.query('SELECT COUNT(*) FROM productos');
    if (parseInt(prodCount.rows[0].count, 10) === 0) {
      const firstCat = await db.query('SELECT id_categoria FROM categorias ORDER BY id_categoria ASC');
      const cats = firstCat.rows.map(c => c.id_categoria);
      const c1 = cats[0] || 1;
      const c2 = cats[1] || c1;
      const c3 = cats[2] || c1;
      const c4 = cats[3] || c1;
      const c5 = cats[4] || c1;
      const c6 = cats[5] || c1;

      await db.query(`
        INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, id_categoria) VALUES 
        ('Procesador AMD Ryzen 7 7800X3D', '8 nucleos, 16 hilos, 4.2GHz base, 5.0GHz boost con 3D V-Cache', 1780.00, 15, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500', ${c1}),
        ('Procesador Intel Core i7-14700K', '20 nucleos (8P + 12E), hasta 5.6 GHz, LGA1700, 33MB Cache', 1650.00, 12, 'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=500', ${c1}),
        ('Tarjeta de Video ASUS ROG Strix RTX 4070 Ti SUPER', '16GB GDDR6X, DLSS 3, Ray Tracing, Triple Fan OC Edition', 3990.00, 8, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500', ${c2}),
        ('Tarjeta de Video MSI GeForce RTX 4060 Ventus 2X', '8GB GDDR6, Dual Fan, arquitectura Ada Lovelace', 1450.00, 20, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', ${c2}),
        ('Memoria RAM Corsair Vengeance RGB 32GB (2x16GB)', 'DDR5 6000MHz CL30 Intel XMP y AMD EXPO compatible', 540.00, 25, 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=500', ${c3}),
        ('Memoria RAM Kingston Fury Beast 16GB (2x8GB)', 'DDR4 3200MHz CL16 con disipador termico negro', 220.00, 30, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500', ${c3}),
        ('SSD Kingston NV2 1TB PCIe 4.0 NVMe M.2', 'Lectura hasta 3500 MB/s, Escritura hasta 2100 MB/s', 280.00, 40, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500', ${c4}),
        ('SSD Samsung 990 PRO 2TB PCIe 4.0 NVMe', 'Lectura extrema 7450 MB/s, ideal para PS5 y PC Master Race', 790.00, 10, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500', ${c4}),
        ('Laptop ASUS TUF Gaming A15', 'Ryzen 7 7735HS, RTX 4060 8GB, 16GB RAM, 512GB SSD, 144Hz FHD', 4399.00, 6, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500', ${c5}),
        ('Teclado Mecanico Redragon Kumara K552 RGB', 'Switches Outemu Blue, estructura reforzada, iluminacion RGB', 160.00, 18, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', ${c6}),
        ('Mouse Gamer Logitech G502 HERO', 'Sensor HERO 25K, 11 botones programables, pesas ajustables', 210.00, 22, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', ${c6}),
        ('Monitor Gamer Samsung Odyssey G5 27" 165Hz', 'Panel VA Curvo 1000R, QHD 2K (2560x1440), 1ms FreeSync', 1190.00, 7, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', ${c6});
      `);
      console.log(' [DB] Productos iniciales insertados en el catalogo.');
    }

    // 5. PEDIDOS (id_pedido, id_usuario, total, estado, fecha_pedido)
    await db.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id_pedido SERIAL PRIMARY KEY,
        id_usuario INT NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        estado VARCHAR(50) DEFAULT 'Pendiente',
        fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. DETALLE_PEDIDOS (id_detalle, id_pedido, id_producto, cantidad, precio_unitario)
    await db.query(`
      CREATE TABLE IF NOT EXISTS detalle_pedidos (
        id_detalle SERIAL PRIMARY KEY,
        id_pedido INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario NUMERIC(10, 2) NOT NULL
      );
    `);

    console.log(' [DB OK] Base de datos sincronizada con la estructura de pgAdmin exitosamente.');
  } catch (error) {
    console.error(' [DB ERROR] Error al verificar/sincronizar el esquema:', error.message);
  }
}

module.exports = autoMigrateAndSeed;
