import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import { PGlite, Mutex } from '@electric-sql/pglite';
import { fromNodeSocket } from 'pg-gateway/node';

const PORT = parseInt(process.env.PG_PORT || '5432', 10);
const DATA_DIR = process.env.PG_DATA_DIR || path.join(__dirname, '../.pgdata');

async function start() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log(`[Embedded Postgres] Initializing PGlite at ${DATA_DIR}...`);
  const db = new PGlite(DATA_DIR);
  await db.waitReady;
  console.log('[Embedded Postgres] PGlite engine ready.');

  const mutex = new Mutex();

  const server = net.createServer(async (socket) => {
    socket.on('error', (err) => {
      // Ignore client disconnect / reset errors
      if ((err as any).code !== 'ECONNRESET') {
        console.error('[Embedded Postgres] Socket error:', err.message);
      }
    });

    try {
      await fromNodeSocket(socket, {
        serverVersion: '16.3 (PGlite)',
        auth: {
          method: 'trust',
        },
        async onMessage(data, { isAuthenticated }) {
          if (!isAuthenticated) return undefined;
          return await mutex.runExclusive(async () => {
            return await db.execProtocolRaw(data);
          });
        },
      });
    } catch (err: any) {
      if (err.code !== 'ECONNRESET') {
        console.error('[Embedded Postgres] Gateway connection error:', err.message);
      }
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[Embedded Postgres] Server is listening on 127.0.0.1:${PORT}`);
    console.log(`[Embedded Postgres] Connection string: postgresql://postgres:postgres@localhost:${PORT}/sweetmarket`);
  });

  const shutdown = async () => {
    console.log('\n[Embedded Postgres] Shutting down...');
    server.close();
    await db.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[Embedded Postgres] Fatal startup error:', err);
  process.exit(1);
});

