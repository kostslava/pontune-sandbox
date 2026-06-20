import { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';
import ResourceMonitor from './ResourceMonitor';

const STREAM_COLORS = {
  stdout: 'text-slate-100',
  stderr: 'text-red-400',
  stdin: 'text-cyan-300',
  system: 'text-slate-500',
};

export default function OutputConsole({
  chunks,
  isRunning,
  acceptsInput,
  statusLabel,
  onSubmitInput,
  elapsedMs,
  outputBytes,
  memoryBytes,
  cpuPercent,
}) {
  const [draft, setDraft] = useState('');
  const terminalRef = useRef(null);
  const isEmpty = chunks.length === 0 && !isRunning;

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [chunks, draft, acceptsInput]);

  useEffect(() => {
    if (acceptsInput && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [acceptsInput]);

  useEffect(() => {
    if (!acceptsInput) setDraft('');
  }, [acceptsInput]);

  const submitDraft = useCallback(() => {
    if (!acceptsInput) return;
    onSubmitInput(draft);
    setDraft('');
  }, [acceptsInput, draft, onSubmitInput]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!acceptsInput) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        submitDraft();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        setDraft((prev) => prev.slice(0, -1));
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setDraft((prev) => prev + e.key);
      }
    },
    [acceptsInput, submitDraft],
  );

  const handlePaste = useCallback(
    (e) => {
      if (!acceptsInput) return;
      e.preventDefault();
      const text = e.clipboardData.getData('text').replace(/\r?\n/g, '');
      setDraft((prev) => prev + text);
    },
    [acceptsInput],
  );

  return (
    <section className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-[#0d1117] shadow-xl lg:min-h-0">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-[#161b22] px-4 py-2.5">
        <Terminal className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-medium text-slate-400">
          Interactive Terminal
        </span>
        {statusLabel && (
          <span className="ml-auto text-xs text-cyan-400 animate-pulse">
            {statusLabel}
          </span>
        )}
      </div>

      <ResourceMonitor
        isRunning={isRunning}
        elapsedMs={elapsedMs}
        outputBytes={outputBytes}
        memoryBytes={memoryBytes}
        cpuPercent={cpuPercent}
      />

      <div
        ref={terminalRef}
        tabIndex={0}
        role="textbox"
        aria-label="Interactive terminal"
        aria-multiline="true"
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onClick={() => terminalRef.current?.focus()}
        className={`flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap outline-none ${
          acceptsInput ? 'cursor-text' : 'cursor-default'
        }`}
      >
        {isEmpty ? (
          <span className="text-slate-600">
            // Run your code — click here and type when the program prompts for
            input
          </span>
        ) : (
          chunks.map((chunk, i) => (
            <span key={i} className={STREAM_COLORS[chunk.stream]}>
              {chunk.text}
            </span>
          ))
        )}

        {acceptsInput && (
          <>
            <span className="text-cyan-300">{draft}</span>
            <span
              aria-hidden
              className="ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-cyan-400"
            />
          </>
        )}
      </div>
    </section>
  );
}
