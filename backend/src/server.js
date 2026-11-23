require('dotenv').config();
const app = require('./app');
const { runMigrations } = require('./db/migrations');
const { releaseExpiredOrders } = require('./services/orderExpirationService');

const PORT = process.env.PORT || 5000;

runMigrations()
  .then(() => {
    const expireOrders = () => {
      releaseExpiredOrders().catch((err) =>
        console.error('No se pudieron liberar reservas de stock vencidas:', err.message)
      );
    };
    expireOrders();
    setInterval(expireOrders, 30_000).unref();
    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudieron aplicar las migraciones:', err);
    process.exit(1);
  });
