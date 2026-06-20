import { Code2, Sparkles, Trophy, Zap } from 'lucide-react';

const STATS = [
  { icon: Zap, label: 'XP Earned', value: '1,240' },
  { icon: Trophy, label: 'Challenges', value: '12 / 20' },
  { icon: Sparkles, label: 'Streak', value: '5 days' },
];

export default function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg shadow-cyan-500/20">
            <Code2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Pontune
            </h1>
            <p className="text-xs font-medium text-slate-400">
              Gamified STEM Learning Platform
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {STATS.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5"
            >
              <Icon className="h-4 w-4 text-cyan-400" />
              <div className="text-xs">
                <span className="block text-slate-500">{label}</span>
                <span className="font-semibold text-slate-200">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
