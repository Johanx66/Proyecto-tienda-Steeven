-- Ejecutar solo en desarrollo cuando se necesite la cuenta cliente de prueba.
-- No se ejecuta automáticamente al desplegar la tienda.
INSERT INTO usuarios (nombre, email, telefono, contrasenia, rol)
VALUES (
  'Cliente de demostración',
  'cliente@demo.local',
  '+570000000001',
  '$2a$10$B6ap6x9UODwxuTCSyqAQRewtIFz3F9K1SDZu61B4aBR3rowVpyORi',
  'CLIENTE'
)
ON CONFLICT (email) DO NOTHING;
