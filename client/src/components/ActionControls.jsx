import { Loader2, Play, RotateCcw, Square } from 'lucide-react';
import { LANGUAGE_CONFIG, LANGUAGE_IDS } from '../constants/defaults';

export default function ActionControls({
  language,
  onLanguageChange,
  isRunning,
  pistonReady,
  onRun,
  onStop,
  onReset,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-lg border border-slate-700 bg-slate-800/60 p-0.5">
        {LANGUAGE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            disabled={isRunning}
            onClick={() => onLanguageChange(id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              language === id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {LANGUAGE_CONFIG[id].label}
          </button>
        ))}
      </div>

      {!isRunning ? (
        <button
          type="button"
          onClick={onRun}
          disabled={!pistonReady}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-current" />
          Run Code
        </button>
      ) : (
        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
        >
          <Square className="h-4 w-4 fill-current" />
          Stop
        </button>
      )}

      {isRunning && (
        <span className="inline-flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          Session active
        </span>
      )}

      {!pistonReady && !isRunning && (
        <span className="text-sm text-amber-400">
          Piston offline — run <code className="text-amber-300">npm run piston:setup</code>
        </span>
      )}

      <button
        type="button"
        onClick={onReset}
        disabled={isRunning}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" />
        Reset Code
      </button>
    </div>
  );
}
