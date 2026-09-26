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
(6, 'Perifericos'),
(7, 'Monitores'),
(8, 'Placas Madre'),
(9, 'Fuentes y Cases'),
(10, 'Refrigeracion')
ON CONFLICT (id_categoria) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, id_categoria) VALUES 
('Procesador AMD Ryzen 7 7800X3D', '8 núcleos, 16 hilos, 4.2GHz base, 5.0GHz boost, 96MB L3 3D V-Cache, Socket AM5.', 1799.00, 15, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80', 1),
('Procesador Intel Core i7-14700K', '20 núcleos (8P + 12E), 28 hilos, hasta 5.6 GHz, LGA1700, 33MB Intel Smart Cache.', 1680.00, 12, 'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=600&auto=format&fit=crop&q=80', 1),
('Procesador AMD Ryzen 5 7600X', '6 núcleos, 12 hilos, 4.7GHz a 5.3GHz Turbo, Socket AM5, PCIe 5.0 listo para Gaming.', 940.00, 20, 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80', 1),
('Procesador Intel Core i9-14900KS', 'Edición Especial 24 núcleos (8P + 16E), hasta 6.2 GHz, máxima velocidad entusiasta.', 2890.00, 5, 'https://images.unsplash.com/photo-1591799265444-d66432b91588?w=600&auto=format&fit=crop&q=80', 1),

('Tarjeta de Video ASUS ROG Strix RTX 4070 Ti SUPER 16GB', '16GB GDDR6X, DLSS 3, Ray Tracing, Triple Fan OC Edition con Aura Sync.', 4150.00, 8, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80', 2),
('Tarjeta de Video MSI GeForce RTX 4060 Ventus 2X 8GB', '8GB GDDR6, Dual Fan TORX 4.0, arquitectura Ada Lovelace y NVENC 8va Gen.', 1399.00, 25, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80', 2),
('Tarjeta de Video Gigabyte AORUS RTX 4090 Master 24GB', '24GB GDDR6X 384-bit, WINDFORCE Cooling, Pantalla LCD Edge View integrada.', 8490.00, 3, 'https://images.unsplash.com/photo-1624705009806-6da7a4ed596e?w=600&auto=format&fit=crop&q=80', 2),
('Tarjeta de Video Sapphire PURE AMD Radeon RX 7800 XT 16GB', '16GB GDDR6, Arquitectura RDNA 3, Tri-X Cooling en elegante acabado blanco polar.', 2490.00, 10, 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=600&auto=format&fit=crop&q=80', 2),

('Memoria RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz', 'DDR5 CL30 Intel XMP y AMD EXPO compatible con disipador y tiras RGB dinámicas.', 560.00, 30, 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=600&auto=format&fit=crop&q=80', 3),
('Memoria RAM Kingston Fury Beast 16GB (2x8GB) DDR4 3200MHz', 'DDR4 3200MHz CL16 con disipador térmico de perfil bajo en color negro mate.', 210.00, 45, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80', 3),
('Memoria RAM G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5 6400MHz', 'Kit ultra rápido para creadores de contenido, renderizado 3D y edición de video 4K.', 1090.00, 14, 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=600&auto=format&fit=crop&q=80', 3),
('Memoria RAM Teamgroup T-Force Delta RGB 32GB (2x16GB) DDR5 5600MHz', 'Diseño geométrico en blanco con ángulo ultra ancho RGB de 120 grados.', 480.00, 18, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80', 3),

('SSD Kingston NV2 1TB PCIe 4.0 NVMe M.2', 'Velocidad de lectura hasta 3500 MB/s, escritura 2100 MB/s. Formato M.2 2280.', 270.00, 50, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80', 4),
('SSD Samsung 990 PRO 2TB PCIe 4.0 NVMe con Heatsink', 'Lectura extrema 7450 MB/s, ideal para PlayStation 5 y PC Master Race de alto nivel.', 799.00, 12, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&auto=format&fit=crop&q=80', 4),
('SSD Crucial T700 1TB Gen5 NVMe M.2', 'PCIe 5.0 x4 de nueva generación con lectura secuencial de hasta 11,700 MB/s.', 890.00, 8, 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80', 4),
('Disco Duro WD Black 4TB 3.5" SATA 7200 RPM', 'Almacenamiento masivo para librerías de juegos, 256MB cache, máxima durabilidad.', 520.00, 20, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80', 4),

('Laptop Gamer ASUS TUF Gaming A15 15.6" 144Hz', 'Ryzen 7 7735HS, RTX 4060 8GB GDDR6, 16GB DDR5, 512GB NVMe SSD, FHD 144Hz.', 4299.00, 7, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80', 5),
('Laptop Gamer Lenovo Legion Pro 5 16" WQXGA 240Hz', 'Intel Core i7-14650HX, RTX 4070 8GB, 32GB DDR5, 1TB SSD, Teclado RGB 4 zonas.', 6890.00, 4, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80', 5),
('Laptop MSI Katana 15 B13VGK 15.6" 144Hz', 'Intel Core i7-13620H, RTX 4070 8GB, 16GB DDR5, 1TB SSD NVMe M.2 Gen4.', 5490.00, 6, 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=80', 5),
('Laptop Apple MacBook Pro 16" Chip M3 Max', '16 núcleos CPU, 40 núcleos GPU, 48GB memoria unificada, 1TB SSD Liquid Retina XDR.', 14990.00, 3, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80', 5),

('Teclado Mecanico Redragon Kumara K552 RGB TKL', 'Switches Outemu Blue táctiles y audibles, chasis metálico reforzado, iluminación RGB.', 159.00, 35, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80', 6),
('Mouse Gamer Logitech G502 HERO High Performance', 'Sensor HERO 25K PPP, 11 botones programables, pesas de ajuste y rueda hiperrápida.', 199.00, 40, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80', 6),
('Audifonos Gamer HyperX Cloud III Wireless', 'Sonido DTS Headphone:X Spatial Audio, hasta 120 horas de batería, micrófono 10mm.', 499.00, 16, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80', 6),
('Teclado Mecanico Corsair K70 RGB PRO Opto-Mecanico', 'Teclas OPX ópticas con 1.0mm de punto de actuación, estructura de aluminio cepillado.', 690.00, 9, 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80', 6),

('Monitor Gamer Samsung Odyssey G5 27" QHD 165Hz Curvo', 'Panel VA Curvo 1000R, resolución 2K 2560x1440, 1ms de respuesta, AMD FreeSync Premium.', 1150.00, 10, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80', 7),
('Monitor LG UltraGear 27" OLED 4K UHD 240Hz', 'Panel OLED de 0.03ms GTG, DisplayHDR True Black 400, HDMI 2.1 y NVIDIA G-Sync.', 3990.00, 4, 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=600&auto=format&fit=crop&q=80', 7),
('Monitor Gigabyte M27Q 27" KVM IPS QHD 170Hz', 'Resolución 2560x1440 Super Speed IPS, switch KVM integrado para controlar 2 PC.', 1380.00, 11, 'https://images.unsplash.com/photo-1551645120-d70bfe84c826?w=600&auto=format&fit=crop&q=80', 7),

('Placa Madre ASUS ROG STRIX B650-A GAMING WIFI', 'Socket AM5, PCIe 5.0 M.2, 12+2 etapas de potencia, WiFi 6E integrado, disipadores blancos.', 1090.00, 8, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80', 8),
('Placa Madre MSI MAG B760 TOMAHAWK WIFI', 'Soporta procesadores Intel 12va, 13ra y 14ta Gen, DDR5 hasta 7000+MHz (OC), Lightning Gen 5.', 890.00, 14, 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80', 8),
('Placa Madre Gigabyte Z790 AORUS ELITE AX', 'LGA 1700, Twin 16+1+2 VRM, PCIe 5.0, WiFi 6E, USB 3.2 Gen 2x2 Type-C.', 1290.00, 6, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80', 8),

('Fuente de Poder Corsair RM1000e 1000W 80 Plus Gold Modular', 'Certificación 80+ Gold, PCIe 5.0 ATX 3.0 compatible con conector 12VHPWR.', 720.00, 12, 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=600&auto=format&fit=crop&q=80', 9),
('Case Gamer Lian Li O11 Dynamic EVO RGB Black', 'Gabinete Torre Media con doble cámara, cristal templado lateral y frontal con tira RGB.', 790.00, 7, 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&auto=format&fit=crop&q=80', 9),

('Cooler Liquido NZXT Kraken Elite 360 RGB Black', 'Refrigeración AIO 360mm con pantalla LCD circular de 2.36" personalizable.', 1290.00, 6, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80', 10),
('Cooler CPU Noctua NH-D15 Chromax.Black', 'Doble torre de disipación de calor con dos ventiladores NF-A15 de 140mm en edición negra.', 540.00, 10, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80', 10)
ON CONFLICT DO NOTHING;
