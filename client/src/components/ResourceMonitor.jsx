import { Cpu, HardDrive, Timer, TerminalSquare } from 'lucide-react';
import {
  PLAN_LIMITS,
  formatBytes,
  formatDuration,
  formatLimit,
} from '../constants/planLimits';

function Metric({ icon: Icon, label, value, limit, warn, title }) {
  return (
    <div
      title={title}
      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
        warn
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
          : 'border-slate-700/60 bg-slate-800/40 text-slate-300'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-medium text-slate-100">
        {value}
        <span className="text-slate-500"> / {limit}</span>
      </span>
    </div>
  );
}

export default function ResourceMonitor({
  isRunning,
  elapsedMs,
  outputBytes,
  memoryBytes,
  cpuPercent,
}) {
  const outputWarn =
    PLAN_LIMITS.outputMaxBytes != null &&
    outputBytes / PLAN_LIMITS.outputMaxBytes > 0.85;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-[#161b22] px-4 py-2">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {PLAN_LIMITS.label} plan
      </span>

      <Metric
        icon={Timer}
        label="Wall"
        value={formatDuration(elapsedMs)}
        limit={formatLimit(PLAN_LIMITS.runTimeoutMs, formatDuration)}
        warn={
          PLAN_LIMITS.runTimeoutMs != null &&
          elapsedMs / PLAN_LIMITS.runTimeoutMs > 0.85
        }
      />

      <Metric
        icon={TerminalSquare}
        label="Output"
        value={formatBytes(outputBytes)}
        limit={formatLimit(PLAN_LIMITS.outputMaxBytes, formatBytes)}
        warn={outputWarn}
      />

      <Metric
        icon={HardDrive}
        label="RAM"
        title="Peak sandbox memory during this session (polled live)"
        value={
          memoryBytes != null && memoryBytes > 0
            ? formatBytes(memoryBytes)
            : isRunning
              ? '…'
              : '—'
        }
        limit={formatLimit(PLAN_LIMITS.runMemoryBytes, formatBytes)}
      />

      <Metric
        icon={Cpu}
        label="CPU"
        title="Peak CPU usage during this session (polled live)"
        value={
          cpuPercent != null && cpuPercent > 0
            ? `${cpuPercent.toFixed(1)}%`
            : isRunning
              ? '…'
              : '—'
        }
        limit={formatLimit(PLAN_LIMITS.maxCpuPercent, (p) => `${p}%`)}
      />
    </div>
  );
}
