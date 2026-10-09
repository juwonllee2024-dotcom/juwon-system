import express from 'express';
import path from 'node:path';
import { createApp } from './app.js';

const port = Number.parseInt(process.env.MISSION_PORT ?? '4174', 10);
const databasePath = process.env.MISSION_DB_PATH ?? '.tmp/local/mission.db';
const clientDirectory = path.resolve('dist/client');
const app = createApp({ databasePath });

app.use(express.static(clientDirectory));
app.get('/{*path}', (request, response, next) => {
  if (request.path.startsWith('/api/')) return next();
  return response.sendFile(path.join(clientDirectory, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log(`MISSION local server: http://127.0.0.1:${port}`);
});
