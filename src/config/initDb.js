const db = require('./db');

async function autoMigrateAndSeed() {
  try {
    console.log(' [DB] Verificando y sincronizando esquema de base de datos Memory Kings...');

    // 1. TABLA ROLES (id_rol, nombre)
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

    // 2. TABLA USUARIOS (id_usuario, nombre_completo, correo, password, id_rol, fecha_registro)
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

    // 3. TABLA CATEGORIAS (id_categoria, nombre)
    await db.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id_categoria SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL
      );
    `);

    const seedCategories = [
      'Procesadores',
      'Tarjetas de Video',
      'Memorias RAM',
      'Almacenamiento',
      'Laptops',
      'Perifericos',
      'Monitores',
      'Placas Madre',
      'Fuentes y Cases',
      'Refrigeracion'
    ];

    for (const catName of seedCategories) {
      const catCheck = await db.query('SELECT id_categoria FROM categorias WHERE LOWER(nombre) = LOWER($1)', [catName]);
      if (catCheck.rows.length === 0) {
        await db.query('INSERT INTO categorias (nombre) VALUES ($1)', [catName]);
      }
    }
    console.log(' [DB] Categorías verificadas y sincronizadas.');

    // Mapeo de nombres de categorías a sus IDs reales
    const catRows = await db.query('SELECT id_categoria, nombre FROM categorias');
    const catMap = {};
    catRows.rows.forEach(r => {
      catMap[r.nombre.toLowerCase()] = r.id_categoria;
    });

    // 4. TABLA PRODUCTOS (id_producto, nombre, descripcion, precio, stock, imagen_url, id_categoria, fecha_creacion)
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

    // Catálogo extenso de productos reales de Hardware y Tecnología
    const seedProducts = [
      // --- PROCESADORES ---
      {
        nombre: 'Procesador AMD Ryzen 7 7800X3D',
        descripcion: '8 núcleos, 16 hilos, 4.2GHz base, 5.0GHz boost, 96MB L3 3D V-Cache, Socket AM5.',
        precio: 1799.00,
        stock: 15,
        imagen_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80',
        categoria: 'procesadores'
      },
      {
        nombre: 'Procesador Intel Core i7-14700K',
        descripcion: '20 núcleos (8P + 12E), 28 hilos, hasta 5.6 GHz, LGA1700, 33MB Intel Smart Cache.',
        precio: 1680.00,
        stock: 12,
        imagen_url: 'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=600&auto=format&fit=crop&q=80',
        categoria: 'procesadores'
      },
      {
        nombre: 'Procesador AMD Ryzen 5 7600X',
        descripcion: '6 núcleos, 12 hilos, 4.7GHz a 5.3GHz Turbo, Socket AM5, PCIe 5.0 listo para Gaming.',
        precio: 940.00,
        stock: 20,
        imagen_url: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80',
        categoria: 'procesadores'
      },
      {
        nombre: 'Procesador Intel Core i9-14900KS',
        descripcion: 'Edición Especial 24 núcleos (8P + 16E), hasta 6.2 GHz, máxima velocidad entusiasta.',
        precio: 2890.00,
        stock: 5,
        imagen_url: 'https://images.unsplash.com/photo-1591799265444-d66432b91588?w=600&auto=format&fit=crop&q=80',
        categoria: 'procesadores'
      },

      // --- TARJETAS DE VIDEO ---
      {
        nombre: 'Tarjeta de Video ASUS ROG Strix RTX 4070 Ti SUPER 16GB',
        descripcion: '16GB GDDR6X, DLSS 3, Ray Tracing, Triple Fan OC Edition con Aura Sync.',
        precio: 4150.00,
        stock: 8,
        imagen_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
        categoria: 'tarjetas de video'
      },
      {
        nombre: 'Tarjeta de Video MSI GeForce RTX 4060 Ventus 2X 8GB',
        descripcion: '8GB GDDR6, Dual Fan TORX 4.0, arquitectura Ada Lovelace y NVENC 8va Gen.',
        precio: 1399.00,
        stock: 25,
        imagen_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        categoria: 'tarjetas de video'
      },
      {
        nombre: 'Tarjeta de Video Gigabyte AORUS RTX 4090 Master 24GB',
        descripcion: '24GB GDDR6X 384-bit, WINDFORCE Cooling, Pantalla LCD Edge View integrada.',
        precio: 8490.00,
        stock: 3,
        imagen_url: 'https://images.unsplash.com/photo-1624705009806-6da7a4ed596e?w=600&auto=format&fit=crop&q=80',
        categoria: 'tarjetas de video'
      },
      {
        nombre: 'Tarjeta de Video Sapphire PURE AMD Radeon RX 7800 XT 16GB',
        descripcion: '16GB GDDR6, Arquitectura RDNA 3, Tri-X Cooling en elegante acabado blanco polar.',
        precio: 2490.00,
        stock: 10,
        imagen_url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=600&auto=format&fit=crop&q=80',
        categoria: 'tarjetas de video'
      },

      // --- MEMORIAS RAM ---
      {
        nombre: 'Memoria RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
        descripcion: 'DDR5 CL30 Intel XMP y AMD EXPO compatible con disipador y tiras RGB dinámicas.',
        precio: 560.00,
        stock: 30,
        imagen_url: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=600&auto=format&fit=crop&q=80',
        categoria: 'memorias ram'
      },
      {
        nombre: 'Memoria RAM Kingston Fury Beast 16GB (2x8GB) DDR4 3200MHz',
        descripcion: 'DDR4 3200MHz CL16 con disipador térmico de perfil bajo en color negro mate.',
        precio: 210.00,
        stock: 45,
        imagen_url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80',
        categoria: 'memorias ram'
      },
      {
        nombre: 'Memoria RAM G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5 6400MHz',
        descripcion: 'Kit ultra rápido para creadores de contenido, renderizado 3D y edición de video 4K.',
        precio: 1090.00,
        stock: 14,
        imagen_url: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=600&auto=format&fit=crop&q=80',
        categoria: 'memorias ram'
      },
      {
        nombre: 'Memoria RAM Teamgroup T-Force Delta RGB 32GB (2x16GB) DDR5 5600MHz',
        descripcion: 'Diseño geométrico en blanco con ángulo ultra ancho RGB de 120 grados.',
        precio: 480.00,
        stock: 18,
        imagen_url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80',
        categoria: 'memorias ram'
      },

      // --- ALMACENAMIENTO ---
      {
        nombre: 'SSD Kingston NV2 1TB PCIe 4.0 NVMe M.2',
        descripcion: 'Velocidad de lectura hasta 3500 MB/s, escritura 2100 MB/s. Formato M.2 2280.',
        precio: 270.00,
        stock: 50,
        imagen_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
        categoria: 'almacenamiento'
      },
      {
        nombre: 'SSD Samsung 990 PRO 2TB PCIe 4.0 NVMe con Heatsink',
        descripcion: 'Lectura extrema 7450 MB/s, ideal para PlayStation 5 y PC Master Race de alto nivel.',
        precio: 799.00,
        stock: 12,
        imagen_url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&auto=format&fit=crop&q=80',
        categoria: 'almacenamiento'
      },
      {
        nombre: 'SSD Crucial T700 1TB Gen5 NVMe M.2',
        descripcion: 'PCIe 5.0 x4 de nueva generación con lectura secuencial de hasta 11,700 MB/s.',
        precio: 890.00,
        stock: 8,
        imagen_url: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80',
        categoria: 'almacenamiento'
      },
      {
        nombre: 'Disco Duro WD Black 4TB 3.5" SATA 7200 RPM',
        descripcion: 'Almacenamiento masivo para librerías de juegos, 256MB cache, máxima durabilidad.',
        precio: 520.00,
        stock: 20,
        imagen_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
        categoria: 'almacenamiento'
      },

      // --- LAPTOPS ---
      {
        nombre: 'Laptop Gamer ASUS TUF Gaming A15 15.6" 144Hz',
        descripcion: 'Ryzen 7 7735HS, RTX 4060 8GB GDDR6, 16GB DDR5, 512GB NVMe SSD, FHD 144Hz.',
        precio: 4299.00,
        stock: 7,
        imagen_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80',
        categoria: 'laptops'
      },
      {
        nombre: 'Laptop Gamer Lenovo Legion Pro 5 16" WQXGA 240Hz',
        descripcion: 'Intel Core i7-14650HX, RTX 4070 8GB, 32GB DDR5, 1TB SSD, Teclado RGB 4 zonas.',
        precio: 6890.00,
        stock: 4,
        imagen_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
        categoria: 'laptops'
      },
      {
        nombre: 'Laptop MSI Katana 15 B13VGK 15.6" 144Hz',
        descripcion: 'Intel Core i7-13620H, RTX 4070 8GB, 16GB DDR5, 1TB SSD NVMe M.2 Gen4.',
        precio: 5490.00,
        stock: 6,
        imagen_url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=80',
        categoria: 'laptops'
      },
      {
        nombre: 'Laptop Apple MacBook Pro 16" Chip M3 Max',
        descripcion: '16 núcleos CPU, 40 núcleos GPU, 48GB memoria unificada, 1TB SSD Liquid Retina XDR.',
        precio: 14990.00,
        stock: 3,
        imagen_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
        categoria: 'laptops'
      },

      // --- PERIFERICOS ---
      {
        nombre: 'Teclado Mecanico Redragon Kumara K552 RGB TKL',
        descripcion: 'Switches Outemu Blue táctiles y audibles, chasis metálico reforzado, iluminación RGB.',
        precio: 159.00,
        stock: 35,
        imagen_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
        categoria: 'perifericos'
      },
      {
        nombre: 'Mouse Gamer Logitech G502 HERO High Performance',
        descripcion: 'Sensor HERO 25K PPP, 11 botones programables, pesas de ajuste y rueda hiperrápida.',
        precio: 199.00,
        stock: 40,
        imagen_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
        categoria: 'perifericos'
      },
      {
        nombre: 'Audifonos Gamer HyperX Cloud III Wireless',
        descripcion: 'Sonido DTS Headphone:X Spatial Audio, hasta 120 horas de batería, micrófono 10mm.',
        precio: 499.00,
        stock: 16,
        imagen_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
        categoria: 'perifericos'
      },
      {
        nombre: 'Teclado Mecanico Corsair K70 RGB PRO Opto-Mecanico',
        descripcion: 'Teclas OPX ópticas con 1.0mm de punto de actuación, estructura de aluminio cepillado.',
        precio: 690.00,
        stock: 9,
        imagen_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80',
        categoria: 'perifericos'
      },

      // --- MONITORES ---
      {
        nombre: 'Monitor Gamer Samsung Odyssey G5 27" QHD 165Hz Curvo',
        descripcion: 'Panel VA Curvo 1000R, resolución 2K 2560x1440, 1ms de respuesta, AMD FreeSync Premium.',
        precio: 1150.00,
        stock: 10,
        imagen_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
        categoria: 'monitores'
      },
      {
        nombre: 'Monitor LG UltraGear 27" OLED 4K UHD 240Hz',
        descripcion: 'Panel OLED de 0.03ms GTG, DisplayHDR True Black 400, HDMI 2.1 y NVIDIA G-Sync.',
        precio: 3990.00,
        stock: 4,
        imagen_url: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=600&auto=format&fit=crop&q=80',
        categoria: 'monitores'
      },
      {
        nombre: 'Monitor Gigabyte M27Q 27" KVM IPS QHD 170Hz',
        descripcion: 'Resolución 2560x1440 Super Speed IPS, switch KVM integrado para controlar 2 PC.',
        precio: 1380.00,
        stock: 11,
        imagen_url: 'https://images.unsplash.com/photo-1551645120-d70bfe84c826?w=600&auto=format&fit=crop&q=80',
        categoria: 'monitores'
      },

      // --- PLACAS MADRE ---
      {
        nombre: 'Placa Madre ASUS ROG STRIX B650-A GAMING WIFI',
        descripcion: 'Socket AM5, PCIe 5.0 M.2, 12+2 etapas de potencia, WiFi 6E integrado, disipadores blancos.',
        precio: 1090.00,
        stock: 8,
        imagen_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
        categoria: 'placas madre'
      },
      {
        nombre: 'Placa Madre MSI MAG B760 TOMAHAWK WIFI',
        descripcion: 'Soporta procesadores Intel 12va, 13ra y 14ta Gen, DDR5 hasta 7000+MHz (OC), Lightning Gen 5.',
        precio: 890.00,
        stock: 14,
        imagen_url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80',
        categoria: 'placas madre'
      },
      {
        nombre: 'Placa Madre Gigabyte Z790 AORUS ELITE AX',
        descripcion: 'LGA 1700, Twin 16+1+2 VRM, PCIe 5.0, WiFi 6E, USB 3.2 Gen 2x2 Type-C.',
        precio: 1290.00,
        stock: 6,
        imagen_url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80',
        categoria: 'placas madre'
      },

      // --- FUENTES Y CASES ---
      {
        nombre: 'Fuente de Poder Corsair RM1000e 1000W 80 Plus Gold Modular',
        descripcion: 'Certificación 80+ Gold, PCIe 5.0 ATX 3.0 compatible con conector 12VHPWR.',
        precio: 720.00,
        stock: 12,
        imagen_url: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=600&auto=format&fit=crop&q=80',
        categoria: 'fuentes y cases'
      },
      {
        nombre: 'Case Gamer Lian Li O11 Dynamic EVO RGB Black',
        descripcion: 'Gabinete Torre Media con doble cámara, cristal templado lateral y frontal con tira RGB.',
        precio: 790.00,
        stock: 7,
        imagen_url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&auto=format&fit=crop&q=80',
        categoria: 'fuentes y cases'
      },

      // --- REFRIGERACION ---
      {
        nombre: 'Cooler Liquido NZXT Kraken Elite 360 RGB Black',
        descripcion: 'Refrigeración AIO 360mm con pantalla LCD circular de 2.36" personalizable.',
        precio: 1290.00,
        stock: 6,
        imagen_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
        categoria: 'refrigeracion'
      },
      {
        nombre: 'Cooler CPU Noctua NH-D15 Chromax.Black',
        descripcion: 'Doble torre de disipación de calor con dos ventiladores NF-A15 de 140mm en edición negra.',
        precio: 540.00,
        stock: 10,
        imagen_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        categoria: 'refrigeracion'
      }
    ];

    for (const prod of seedProducts) {
      const catId = catMap[prod.categoria.toLowerCase()] || catMap['procesadores'] || 1;
      
      const prodCheck = await db.query('SELECT id_producto FROM productos WHERE LOWER(nombre) = LOWER($1)', [prod.nombre]);
      if (prodCheck.rows.length === 0) {
        await db.query(`
          INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, id_categoria)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [prod.nombre, prod.descripcion, prod.precio, prod.stock, prod.imagen_url, catId]);
      } else {
        // Actualizar datos si el producto ya existe (para asegurar URLs de imágenes más reales y mejores descripciones)
        await db.query(`
          UPDATE productos 
          SET descripcion = $1, precio = $2, stock = $3, imagen_url = $4, id_categoria = $5
          WHERE id_producto = $6
        `, [prod.descripcion, prod.precio, prod.stock, prod.imagen_url, catId, prodCheck.rows[0].id_producto]);
      }
    }

    // Corregir cualquier URL de imagen antigua o local sin protocolo HTTP
    await db.query(`
      UPDATE productos 
      SET imagen_url = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80'
      WHERE imagen_url NOT LIKE 'http%' OR imagen_url IS NULL;
    `);

    console.log(` [DB] Catálogo de productos sincronizado (${seedProducts.length} productos simulados listos).`);

    // 5. TABLA PEDIDOS (id_pedido, id_usuario, total, estado, fecha_pedido)
    await db.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id_pedido SERIAL PRIMARY KEY,
        id_usuario INT NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        estado VARCHAR(50) DEFAULT 'Pendiente',
        fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. TABLA DETALLE_PEDIDOS (id_detalle, id_pedido, id_producto, cantidad, precio_unitario)
    await db.query(`
      CREATE TABLE IF NOT EXISTS detalle_pedidos (
        id_detalle SERIAL PRIMARY KEY,
        id_pedido INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario NUMERIC(10, 2) NOT NULL
      );
    `);

    console.log(' [DB OK] Base de datos sincronizada exitosamente con todos los productos y categorías.');
  } catch (error) {
    console.error(' [DB ERROR] Error al verificar/sincronizar el esquema:', error.message);
  }
}

module.exports = autoMigrateAndSeed;
