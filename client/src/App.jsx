import { useCallback, useEffect, useRef, useState } from 'react';
import { LANGUAGE_CONFIG } from './constants/defaults';
import { formatBytes } from './constants/planLimits';
import { checkPistonHealth, createRunSession } from './services/runService';
import { fetchSandboxStats } from './services/statsService';
import Header from './components/Header';
import CodeWorkspace from './components/CodeWorkspace';
import ActionControls from './components/ActionControls';
import OutputConsole from './components/OutputConsole';

const STATUS_LABELS = {
  compiling: 'Compiling…',
  running: 'Running…',
};

const EMPTY_RESOURCES = {
  elapsedMs: 0,
  outputBytes: 0,
  memoryBytes: null,
  cpuPercent: null,
};

function cloneDefaultFiles(language) {
  return LANGUAGE_CONFIG[language].files.map((f) => ({ ...f }));
}

function exitMessage(event, resources) {
  if (event.killReason === 'timeout') {
    return '\n▸ Session killed — wall-time limit reached (total session time exceeded).\n';
  }
  if (event.killReason === 'user') {
    return '\n▸ Process stopped.\n';
  }
  if (event.killed) {
    return `\n▸ Process killed (${event.signal ?? 'signal'}).\n`;
  }
  let msg = `\n▸ Process exited with code ${event.code}.\n`;
  if (resources.memoryBytes || resources.cpuPercent) {
    const ram =
      resources.memoryBytes != null && resources.memoryBytes > 0
        ? formatBytes(resources.memoryBytes)
        : '—';
    const cpu =
      resources.cpuPercent != null && resources.cpuPercent > 0
        ? `${resources.cpuPercent.toFixed(1)}% peak`
        : '—';
    msg += `▸ Session peak — RAM: ${ram} | CPU: ${cpu}\n`;
  }
  return msg;
}

export default function App() {
  const [language, setLanguage] = useState('java');
  const [files, setFiles] = useState(() => cloneDefaultFiles('java'));
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [chunks, setChunks] = useState([]);
  const [status, setStatus] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [acceptsInput, setAcceptsInput] = useState(false);
  const [pistonReady, setPistonReady] = useState(false);
  const [resources, setResources] = useState(EMPTY_RESOURCES);
  const sessionRef = useRef(null);
  const sessionStartRef = useRef(null);
  const timerRef = useRef(null);
  const statsPollRef = useRef(null);
  const peakStatsRef = useRef({ memoryBytes: 0, cpuPercent: 0 });

  useEffect(() => {
    checkPistonHealth()
      .then(() => setPistonReady(true))
      .catch(() => setPistonReady(false));
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    sessionStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setResources((prev) => ({
        ...prev,
        elapsedMs: Date.now() - sessionStartRef.current,
      }));
    }, 250);
  }, [stopTimer]);

  const stopStatsPolling = useCallback(() => {
    if (statsPollRef.current) {
      clearInterval(statsPollRef.current);
      statsPollRef.current = null;
    }
  }, []);

  const pollStats = useCallback(async () => {
    try {
      const stats = await fetchSandboxStats();
      peakStatsRef.current.memoryBytes = Math.max(
        peakStatsRef.current.memoryBytes,
        stats.memoryBytes,
      );
      peakStatsRef.current.cpuPercent = Math.max(
        peakStatsRef.current.cpuPercent,
        stats.cpuPercent,
      );
      setResources((prev) => ({
        ...prev,
        memoryBytes: peakStatsRef.current.memoryBytes,
        cpuPercent: peakStatsRef.current.cpuPercent,
      }));
    } catch {
      /* docker stats unavailable */
    }
  }, []);

  const startStatsPolling = useCallback(() => {
    stopStatsPolling();
    peakStatsRef.current = { memoryBytes: 0, cpuPercent: 0 };
    pollStats();
    statsPollRef.current = setInterval(pollStats, 1000);
  }, [pollStats, stopStatsPolling]);

  useEffect(
    () => () => {
      stopTimer();
      stopStatsPolling();
    },
    [stopTimer, stopStatsPolling],
  );

  const appendChunk = useCallback((stream, text) => {
    setChunks((prev) => [...prev, { stream, text }]);
    if (stream === 'stdout' || stream === 'stderr') {
      setResources((prev) => ({
        ...prev,
        outputBytes: prev.outputBytes + new TextEncoder().encode(text).length,
      }));
    }
  }, []);

  const handleEvent = useCallback(
    (event) => {
      switch (event.type) {
        case 'status':
          setStatus(event.phase);
          if (event.phase === 'compiling') {
            appendChunk('system', `▸ Compiling ${event.language} via Piston…\n`);
          }
          break;
        case 'stdout':
          appendChunk('stdout', event.data);
          break;
        case 'stderr':
          appendChunk('stderr', event.data);
          break;
        case 'compile_error':
          setIsRunning(false);
          setAcceptsInput(false);
          setStatus(null);
          stopTimer();
          stopStatsPolling();
          break;
        case 'running':
          setAcceptsInput(true);
          setStatus('running');
          break;
        case 'exit':
          stopStatsPolling();
          appendChunk(
            'system',
            exitMessage(event, {
              memoryBytes: peakStatsRef.current.memoryBytes,
              cpuPercent: peakStatsRef.current.cpuPercent,
            }),
          );
          setIsRunning(false);
          setAcceptsInput(false);
          setStatus(null);
          sessionRef.current = null;
          stopTimer();
          break;
        case 'error':
          appendChunk('stderr', `\n${event.message}\n`);
          setIsRunning(false);
          setAcceptsInput(false);
          setStatus(null);
          stopTimer();
          stopStatsPolling();
          break;
        case 'closed':
          setIsRunning(false);
          setAcceptsInput(false);
          setStatus(null);
          sessionRef.current = null;
          stopTimer();
          stopStatsPolling();
          break;
        default:
          break;
      }
    },
    [appendChunk, stopTimer, stopStatsPolling],
  );

  const handleRun = useCallback(() => {
    const config = LANGUAGE_CONFIG[language];
    sessionRef.current?.kill();
    setChunks([]);
    setResources(EMPTY_RESOURCES);
    setIsRunning(true);
    setAcceptsInput(false);
    setStatus('compiling');
    startTimer();
    startStatsPolling();

    sessionRef.current = createRunSession({
      language: config.pistonLanguage,
      version: config.version,
      files,
      onEvent: handleEvent,
    });
  }, [language, files, handleEvent, startTimer, startStatsPolling]);

  const handleStop = useCallback(() => {
    sessionRef.current?.kill();
    sessionRef.current = null;
  }, []);

  const resetSession = useCallback(() => {
    sessionRef.current?.kill();
    sessionRef.current = null;
    setChunks([]);
    setResources(EMPTY_RESOURCES);
    setIsRunning(false);
    setAcceptsInput(false);
    setStatus(null);
    stopTimer();
    stopStatsPolling();
  }, [stopTimer, stopStatsPolling]);

  const handleReset = useCallback(() => {
    resetSession();
    setFiles(cloneDefaultFiles(language));
    setActiveFileIndex(0);
  }, [language, resetSession]);

  const handleLanguageChange = useCallback(
    (nextLanguage) => {
      resetSession();
      setLanguage(nextLanguage);
      setFiles(cloneDefaultFiles(nextLanguage));
      setActiveFileIndex(0);
    },
    [resetSession],
  );

  const handleSubmitInput = useCallback(
    (input) => {
      appendChunk('stdin', `${input}\n`);
      sessionRef.current?.sendInput(input);
    },
    [appendChunk],
  );

  const handleChangeFile = useCallback((index, content) => {
    setFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, content } : file)),
    );
  }, []);

  const handleAddFile = useCallback(() => {
    setFiles((prev) => {
      const ext = language === 'java' ? '.java' : '.cpp';
      const base = language === 'java' ? `Helper${prev.length}` : `helper${prev.length}`;
      const next = [...prev, { name: `${base}${ext}`, content: '' }];
      setActiveFileIndex(next.length - 1);
      return next;
    });
  }, [language]);

  const handleRemoveFile = useCallback((index) => {
    setFiles((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setActiveFileIndex((current) => {
        if (current >= next.length) return next.length - 1;
        if (index < current) return current - 1;
        return current;
      });
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Interactive Code Sandbox
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Powered by self-hosted{' '}
            <a
              href="https://github.com/engineer-man/piston"
              className="text-cyan-400 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Piston
            </a>{' '}
            — multi-file projects, sandboxed execution, live stdin in the
            terminal.
          </p>
        </div>

        <ActionControls
          language={language}
          onLanguageChange={handleLanguageChange}
          isRunning={isRunning}
          pistonReady={pistonReady}
          onRun={handleRun}
          onStop={handleStop}
          onReset={handleReset}
        />

        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]">
          <CodeWorkspace
            files={files}
            activeFileIndex={activeFileIndex}
            onSelectFile={setActiveFileIndex}
            onChangeFile={handleChangeFile}
            onAddFile={handleAddFile}
            onRemoveFile={handleRemoveFile}
            isRunning={isRunning}
          />
          <OutputConsole
            chunks={chunks}
            isRunning={isRunning}
            acceptsInput={acceptsInput}
            statusLabel={status ? STATUS_LABELS[status] : null}
            onSubmitInput={handleSubmitInput}
            elapsedMs={resources.elapsedMs}
            outputBytes={resources.outputBytes}
            memoryBytes={resources.memoryBytes}
            cpuPercent={resources.cpuPercent}
          />
        </div>
      </main>
    </div>
  );
}
