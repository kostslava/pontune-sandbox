import { FileCode2, Plus, X } from 'lucide-react';

export default function CodeWorkspace({
  files,
  activeFileIndex,
  onSelectFile,
  onChangeFile,
  onAddFile,
  onRemoveFile,
  isRunning,
}) {
  const active = files[activeFileIndex];

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80 shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-700/60 bg-slate-800/60 px-2 py-2">
        <div className="flex gap-1.5 px-2">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                index === activeFileIndex
                  ? 'border-slate-600 bg-slate-700 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <button
                type="button"
                disabled={isRunning}
                onClick={() => onSelectFile(index)}
                className="flex items-center gap-1 disabled:cursor-not-allowed"
              >
                <FileCode2 className="h-3 w-3" />
                {file.name}
              </button>
              {files.length > 1 && (
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => onRemoveFile(index)}
                  className="rounded p-0.5 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            disabled={isRunning}
            onClick={onAddFile}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-700/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            Add file
          </button>
        </div>
      </div>

      <textarea
        value={active?.content ?? ''}
        onChange={(e) => onChangeFile(activeFileIndex, e.target.value)}
        spellCheck={false}
        disabled={isRunning}
        className="min-h-[280px] flex-1 resize-none bg-slate-950/60 p-4 font-mono text-sm leading-relaxed text-slate-200 outline-none selection:bg-cyan-500/30 placeholder:text-slate-600 disabled:opacity-80 lg:min-h-[360px]"
        aria-label={`Editor for ${active?.name ?? 'file'}`}
      />
    </section>
  );
}
