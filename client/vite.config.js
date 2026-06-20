import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const execFileAsync = promisify(execFile);

function sandboxStatsPlugin() {
  return {
    name: 'sandbox-stats',
    configureServer(server) {
      server.middlewares.use('/api/sandbox-stats', async (_req, res) => {
        try {
          const { stdout } = await execFileAsync('docker', [
            'stats',
            'piston_api',
            '--no-stream',
            '--format',
            '{{.MemUsage}}|{{.CPUPerc}}',
          ]);
          const [memUsage, cpuPerc] = stdout.trim().split('|');
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              memUsage,
              cpuPercent: parseFloat(cpuPerc) || 0,
            }),
          );
        } catch {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: 'Docker stats unavailable' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const pistonUrl = env.PISTON_URL || 'http://localhost:2000';

  return {
    plugins: [react(), tailwindcss(), sandboxStatsPlugin()],
    server: {
      port: 5173,
      proxy: {
        '/api/v2': {
          target: pistonUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
