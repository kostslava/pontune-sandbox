function pistonWsUrl() {
  if (import.meta.env.DEV) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/api/v2/connect`;
  }
  const base = import.meta.env.VITE_PISTON_URL || 'ws://localhost:2000';
  return `${base.replace(/\/$/, '')}/api/v2/connect`;
}

export function createRunSession({ language, version, files, onEvent }) {
  const ws = new WebSocket(pistonWsUrl());
  let compileFailed = false;
  let userStopped = false;

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: 'init',
        language,
        version,
        files: files.map(({ name, content }) => ({ name, content })),
        run_timeout: 3_600_000,
        run_cpu_time: 3_600_000,
        compile_timeout: 30_000,
        compile_cpu_time: 30_000,
      }),
    );
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      onEvent({ type: 'error', message: 'Invalid Piston response' });
      return;
    }

    switch (msg.type) {
      case 'runtime':
        onEvent({ type: 'status', phase: 'compiling', language: msg.language });
        break;

      case 'stage':
        if (msg.stage === 'compile') {
          onEvent({ type: 'status', phase: 'compiling', language });
        } else if (msg.stage === 'run') {
          onEvent({ type: 'status', phase: 'running', language });
          onEvent({ type: 'running' });
        }
        break;

      case 'data':
        if (msg.stream === 'stdout') {
          onEvent({ type: 'stdout', data: msg.data });
        } else if (msg.stream === 'stderr') {
          onEvent({ type: 'stderr', data: msg.data });
        }
        break;

      case 'exit':
        if (msg.stage === 'compile') {
          if (msg.code !== 0 && msg.code !== null) {
            compileFailed = true;
            onEvent({
              type: 'compile_error',
              data: 'Compilation failed.',
            });
            ws.close();
          }
        } else if (msg.stage === 'run') {
          const killed = msg.signal != null;
          let killReason = null;
          if (killed) {
            if (userStopped) killReason = 'user';
            else if (msg.signal === 'SIGKILL') killReason = 'timeout';
            else killReason = 'signal';
          }

          onEvent({
            type: 'exit',
            code: msg.code ?? 0,
            killed,
            killReason,
            signal: msg.signal,
            memory: msg.memory ?? null,
            cpuTimeMs: msg.cpu_time ?? null,
            wallTimeMs: msg.wall_time ?? null,
          });
        }
        break;

      case 'error':
        onEvent({ type: 'error', message: msg.message });
        break;

      default:
        break;
    }
  };

  ws.onerror = () => {
    if (!compileFailed) {
      onEvent({
        type: 'error',
        message:
          'WebSocket connection failed — is Piston running? (npm run piston:setup)',
      });
    }
  };

  ws.onclose = () => {
    onEvent({ type: 'closed' });
  };

  return {
    sendInput(data) {
      if (ws.readyState === WebSocket.OPEN) {
        const line = data.endsWith('\n') ? data : `${data}\n`;
        ws.send(JSON.stringify({ type: 'data', stream: 'stdin', data: line }));
      }
    },
    kill() {
      userStopped = true;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'signal', signal: 'SIGKILL' }));
      }
      ws.close();
    },
    close() {
      ws.close();
    },
  };
}

export async function checkPistonHealth() {
  const res = await fetch('/api/v2/runtimes');
  if (!res.ok) throw new Error('Piston unreachable');
  return res.json();
}
