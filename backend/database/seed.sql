-- Datos de ejemplo para desarrollo
-- Usuarios: admin@fruteria.com / admin123 (ADMIN)  |  cliente@fruteria.com / cliente123 (CLIENTE)

INSERT INTO usuarios (nombre, email, telefono, contrasenia, rol, direccion_envio) VALUES
('Administrador Frutería', 'admin@fruteria.com', '+5215512345678', '$2a$10$GkIrM8l.nDuT7NyTweJuN.n2Aokz.52PQVOTqCvq4badvlpx1PG2W', 'ADMIN', 'Av. Principal 100, CDMX'),
('Cliente de Prueba', 'cliente@fruteria.com', '+5215598765432', '$2a$10$PowDCqGbbrM/RI/BkTUxyOiUC8UwoIeQiQIodN3WYn.R3k9jkGJBS', 'CLIENTE', 'Calle Secundaria 45, CDMX')
ON CONFLICT (email) DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, activo) VALUES
('Manzana Roja', 'Manzana roja fresca y crujiente, por kilo.', 35.50, 100, 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400', TRUE),
('Plátano', 'Plátano maduro, rico en potasio. Por kilo.', 22.00, 150, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', TRUE),
('Naranja Valencia', 'Naranjas jugosas ideales para jugo. Por kilo.', 28.90, 120, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400', TRUE),
('Fresa', 'Fresas frescas de temporada. Por kilo.', 65.00, 40, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400', TRUE),
('Jitomate Saladette', 'Jitomate rojo para ensaladas y guisos. Por kilo.', 24.50, 200, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400', TRUE),
('Lechuga Romana', 'Lechuga romana fresca, pieza.', 18.00, 80, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400', TRUE),
('Zanahoria', 'Zanahoria dulce y crujiente. Por kilo.', 19.90, 130, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', TRUE),
('Aguacate Hass', 'Aguacate Hass cremoso. Por kilo.', 89.00, 60, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400', TRUE),
('Limón Persa', 'Limón persa jugoso. Por kilo.', 32.00, 90, 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400', TRUE),
('Espinaca', 'Espinaca fresca rica en hierro. Por manojo.', 20.00, 0, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', FALSE)
ON CONFLICT DO NOTHING;
