require('dotenv').config();
const app = require('./app');
const { runMigrations } = require('./db/migrations');

const PORT = process.env.PORT || 5000;

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudieron aplicar las migraciones:', err);
    process.exit(1);
  });
