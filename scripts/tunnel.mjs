import localtunnel from 'localtunnel';

const port = Number(process.argv[2]);
const subdomain = process.argv[3];

if (!Number.isFinite(port) || port <= 0) {
  console.error('Usage: node scripts/tunnel.mjs <port> [subdomain]');
  process.exit(1);
}

const options = { port, local_host: '127.0.0.1' };
if (subdomain) {
  options.subdomain = subdomain;
}

const tunnel = await localtunnel(options);

console.log(`Tunnel for 127.0.0.1:${port} -> ${tunnel.url}`);

tunnel.on('error', (error) => {
  console.error('Tunnel error:', error);
  process.exit(1);
});

tunnel.on('close', () => {
  console.error('Tunnel closed');
  process.exit(1);
});

process.on('SIGINT', () => {
  tunnel.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  tunnel.close();
  process.exit(0);
});
