require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const pool = require('../config/db');

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  const password = configuredPassword || crypto.randomBytes(24).toString('base64url');
  const name = process.env.ADMIN_NAME?.trim() || 'Administrador de la tienda';
  const phone = process.env.ADMIN_PHONE?.trim() || '+570000000000';

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Define ADMIN_EMAIL con una dirección de correo válida en el archivo .env.');
  }
  if (password.length < 16 || /cambia|genera|reemplaza|example/i.test(password)) {
    throw new Error(
      'ADMIN_PASSWORD debe ser una clave propia de al menos 16 caracteres; no uses el valor de ejemplo.'
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, telefono, contrasenia, rol)
     VALUES ($1, $2, $3, $4, 'ADMIN')
     ON CONFLICT (email) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       telefono = EXCLUDED.telefono,
       contrasenia = EXCLUDED.contrasenia,
       rol = 'ADMIN'
     RETURNING id, nombre, email, rol`,
    [name, email, phone, passwordHash]
  );

  console.log(`Cuenta administradora lista: ${rows[0].email}`);
  if (!configuredPassword) {
    console.log(`Clave generada (guárdala ahora, no se volverá a mostrar): ${password}`);
  } else {
    console.log('Se utilizó ADMIN_PASSWORD del archivo .env.');
  }
  console.log('Inicia sesión en /admin/login.');
}

createAdmin()
  .catch((err) => {
    console.error(`No se pudo crear el administrador: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
