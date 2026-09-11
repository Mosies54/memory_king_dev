-- ==========================================================
-- SCRIPT DE BASE DE DATOS: MEMORY KINGS PERÚ S.A.C.
-- MOTOR: PostgreSQL
-- BASE DE DATOS: memory_king_db / memory_kings_db
-- ==========================================================

-- 1. TABLA ROLES
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- 2. TABLA USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL REFERENCES roles(id_rol),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- 4. TABLA PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen_url VARCHAR(255),
    id_categoria INT REFERENCES categorias(id_categoria),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario),
    total NUMERIC(10, 2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA DETALLE_PEDIDOS
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL REFERENCES pedidos(id_pedido),
    id_producto INT NOT NULL REFERENCES productos(id_producto),
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL
);

-- ==========================================================
-- INSERCIONES INICIALES (SEEDING)
-- ==========================================================

INSERT INTO roles (id_rol, nombre) VALUES 
(1, 'ADMINISTRADOR'),
(2, 'CLIENTE'),
(3, 'ALMACENERO')
ON CONFLICT (id_rol) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO usuarios (nombre_completo, correo, password, id_rol) VALUES 
('Administrador Memory Kings', 'admin@memorykings.com.pe', 'admin123', 1),
('Cliente Preferencial', 'cliente@gmail.com', 'cliente123', 2)
ON CONFLICT DO NOTHING;

INSERT INTO categorias (id_categoria, nombre) VALUES 
(1, 'Procesadores'),
(2, 'Tarjetas de Video'),
(3, 'Memorias RAM'),
(4, 'Almacenamiento'),
(5, 'Laptops'),
(6, 'Perifericos')
ON CONFLICT (id_categoria) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, id_categoria) VALUES 
('Procesador AMD Ryzen 7 7800X3D', '8 nucleos, 16 hilos, 4.2GHz base, 5.0GHz boost con 3D V-Cache', 1780.00, 15, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500', 1),
('Procesador Intel Core i7-14700K', '20 nucleos (8P + 12E), hasta 5.6 GHz, LGA1700, 33MB Cache', 1650.00, 12, 'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=500', 1),
('Tarjeta de Video ASUS ROG Strix RTX 4070 Ti SUPER', '16GB GDDR6X, DLSS 3, Ray Tracing, Triple Fan OC Edition', 3990.00, 8, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500', 2),
('Tarjeta de Video MSI GeForce RTX 4060 Ventus 2X', '8GB GDDR6, Dual Fan, arquitectura Ada Lovelace', 1450.00, 20, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', 2),
('Memoria RAM Corsair Vengeance RGB 32GB (2x16GB)', 'DDR5 6000MHz CL30 Intel XMP y AMD EXPO compatible', 540.00, 25, 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=500', 3),
('Memoria RAM Kingston Fury Beast 16GB (2x8GB)', 'DDR4 3200MHz CL16 con disipador termico negro', 220.00, 30, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500', 3),
('SSD Kingston NV2 1TB PCIe 4.0 NVMe M.2', 'Lectura hasta 3500 MB/s, Escritura hasta 2100 MB/s', 280.00, 40, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500', 4),
('SSD Samsung 990 PRO 2TB PCIe 4.0 NVMe', 'Lectura extrema 7450 MB/s, ideal para PS5 y PC Master Race', 790.00, 10, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500', 4),
('Laptop ASUS TUF Gaming A15', 'Ryzen 7 7735HS, RTX 4060 8GB, 16GB RAM, 512GB SSD, 144Hz FHD', 4399.00, 6, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500', 5),
('Teclado Mecanico Redragon Kumara K552 RGB', 'Switches Outemu Blue, estructura reforzada, iluminacion RGB', 160.00, 18, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', 6),
('Mouse Gamer Logitech G502 HERO', 'Sensor HERO 25K, 11 botones programables, pesas ajustables', 210.00, 22, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', 6),
('Monitor Gamer Samsung Odyssey G5 27" 165Hz', 'Panel VA Curvo 1000R, QHD 2K (2560x1440), 1ms FreeSync', 1190.00, 7, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', 6)
ON CONFLICT DO NOTHING;
