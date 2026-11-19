-- Base de datos: MotoParts (accesorios y repuestos para motos de alto cilindraje)
DROP DATABASE IF EXISTS tienda_motos;
CREATE DATABASE tienda_motos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_motos;

-- 1) Categorías
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  descripcion VARCHAR(200)
);

-- 2) Marcas
CREATE TABLE marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  pais VARCHAR(60)
);

-- 3) Productos (relaciona categorías y marcas)
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  cc_minimo INT NOT NULL DEFAULT 600 COMMENT 'Cilindraje mínimo recomendado',
  categoria_id INT NOT NULL,
  marca_id INT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
  FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE RESTRICT,
  INDEX idx_categoria (categoria_id),
  INDEX idx_marca (marca_id)
);

-- 4) Clientes
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  direccion VARCHAR(200)
);

-- 5) Pedidos (pertenecen a un cliente)
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('pendiente','pagado','enviado','entregado','cancelado') DEFAULT 'pendiente',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
);

-- 6) Detalle del pedido (tabla puente pedidos <-> productos)
CREATE TABLE detalle_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- 7) Reseñas (clientes <-> productos)
CREATE TABLE resenas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  cliente_id INT NOT NULL,
  calificacion TINYINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario VARCHAR(500),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- ---------- DATOS DE EJEMPLO ----------
INSERT INTO categorias (nombre, descripcion) VALUES
 ('Cascos', 'Integrales y modulares homologados'),
 ('Escapes', 'Sistemas de escape y rendimiento'),
 ('Frenos', 'Pastillas, discos y bombas'),
 ('Suspensión', 'Amortiguadores y barras de horquilla'),
 ('Protección', 'Chaquetas, guantes y botas'),
 ('Filtros y motor', 'Filtros de aire, aceite y bujías');

INSERT INTO marcas (nombre, pais) VALUES
 ('Akrapovič', 'Eslovenia'), ('Brembo', 'Italia'), ('Öhlins', 'Suecia'),
 ('AGV', 'Italia'), ('Alpinestars', 'Italia'), ('K&N', 'Estados Unidos'), ('Dainese', 'Italia');

INSERT INTO productos (nombre, descripcion, precio, stock, cc_minimo, categoria_id, marca_id) VALUES
 ('Casco AGV Pista GP RR', 'Casco integral de carbono para pista, aprobado ECE/DOT.', 1299.00, 8, 600, 1, 4),
 ('Casco AGV K6 S', 'Integral ligero para calle y touring, ventilación multizona.', 449.00, 15, 600, 1, 4),
 ('Escape Akrapovič Racing Line', 'Sistema completo en titanio, +6 HP en banco.', 1850.00, 4, 1000, 2, 1),
 ('Silenciador Akrapovič Slip-On', 'Slip-on de carbono con sonido deportivo.', 720.00, 9, 750, 2, 1),
 ('Pastillas Brembo Sinterizadas', 'Juego delantero, alto coeficiente de fricción.', 89.90, 40, 600, 3, 2),
 ('Bomba de freno Brembo RCS 19', 'Bomba radial con palanca ajustable.', 389.00, 6, 750, 3, 2),
 ('Amortiguador Öhlins TTX36', 'Amortiguador trasero de competición, regulable.', 1790.00, 3, 1000, 4, 3),
 ('Kit de horquilla Öhlins NIX', 'Cartuchos presurizados para horquilla invertida.', 1450.00, 5, 750, 4, 3),
 ('Chaqueta Alpinestars GP Plus', 'Cuero con protecciones CE nivel 2.', 549.00, 12, 600, 5, 5),
 ('Guantes Dainese Full Metal 7', 'Guantes de piel con puño de carbono.', 249.00, 20, 600, 5, 7),
 ('Botas Alpinestars Supertech R', 'Botas de pista con refuerzo en tobillo.', 619.00, 7, 750, 5, 5),
 ('Filtro de aire K&N Lavable', 'Mayor flujo de aire, reutilizable.', 74.50, 30, 600, 6, 6);

INSERT INTO clientes (nombre, email, telefono, direccion) VALUES
 ('Carlos Mejía', 'carlos@example.com', '7000-1111', 'San Salvador'),
 ('Ana Rivas', 'ana@example.com', '7000-2222', 'Santa Tecla');

INSERT INTO pedidos (cliente_id, estado, total) VALUES (1, 'entregado', 538.90), (2, 'enviado', 1299.00);
INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES
 (1, 2, 1, 449.00), (1, 5, 1, 89.90), (2, 1, 1, 1299.00);

INSERT INTO resenas (producto_id, cliente_id, calificacion, comentario) VALUES
 (2, 1, 5, 'Muy cómodo y silencioso a 180 km/h.'),
 (5, 1, 4, 'Frenan fuerte, un poco ruidosas en frío.'),
 (1, 2, 5, 'Calidad de carrera, vale cada centavo.');
