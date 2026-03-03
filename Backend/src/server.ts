import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/database.js';

async function start() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('Cannot start without database');
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });
}

start();
