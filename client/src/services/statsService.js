function parseDockerMemory(memUsage) {
  const used = memUsage.split('/')[0]?.trim() ?? '';
  const match = used.match(/^([\d.]+)\s*([KMG]?i?B)/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers = {
    B: 1,
    KIB: 1024,
    KB: 1000,
    MIB: 1024 ** 2,
    MB: 1000 ** 2,
    GIB: 1024 ** 3,
    GB: 1000 ** 3,
  };

  return Math.round(value * (multipliers[unit] ?? 1));
}

export async function fetchSandboxStats() {
  const res = await fetch('/api/sandbox-stats');
  if (!res.ok) throw new Error('Stats unavailable');
  const data = await res.json();
  return {
    memoryBytes: parseDockerMemory(data.memUsage ?? ''),
    cpuPercent: Number(data.cpuPercent) || 0,
  };
}
