// ============================================================
//  ALFA Guardian v2 — Dashboard
// ============================================================

import { Shield, Clock, Zap, Rocket, Tag, Activity } from 'lucide-react';
import { StatCard } from '@/filters/StatCard';
import { guardianTagger } from '@/guardian/tagger';
import { PARTITION_CONFIGS } from '@/partitions/configs';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const history = guardianTagger.getHistory();
  const counts = {
    yesterday: history.filter(h => h.label.partition === 'yesterday').length,
    today: history.filter(h => h.label.partition === 'today').length,
    tomorrow: history.filter(h => h.label.partition === 'tomorrow').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ALFA Guardian v2</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Temporal Partition Engine — LASUCH · CERBER · GUARDIAN
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Prompty w sesji" value={history.length} variant="primary" />
        <StatCard icon={Clock} label="🕰️ Yesterday" value={counts.yesterday} description="historia & kontekst" variant="accent" />
        <StatCard icon={Zap} label="⚡ Today" value={counts.today} description="aktywne zadania" variant="info" />
        <StatCard icon={Rocket} label="🚀 Tomorrow" value={counts.tomorrow} description="plany & strategie" variant="warning" />
      </div>

      {/* Partition overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(PARTITION_CONFIGS).map(p => (
          <div
            key={p.partition}
            className="bg-card border border-border rounded-xl p-5 space-y-3"
            style={{ borderColor: p.color + '33' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="font-bold text-sm text-foreground uppercase tracking-wide">{p.partition}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              <div className="flex justify-between">
                <span>temperature</span>
                <span style={{ color: p.color }}>{p.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span>max tokens</span>
                <span style={{ color: p.color }}>{p.maxTokens}</span>
              </div>
              <div className="flex justify-between">
                <span>pamięć</span>
                <span style={{ color: p.color }}>{p.memoryWindow} msg</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent labels */}
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Ostatnie Studio Labels</h2>
          </div>
          <div className="space-y-2">
            {history.slice(-5).reverse().map(h => (
              <div key={h.id} className="flex items-center gap-2 text-xs font-mono text-muted-foreground border-b border-border/30 pb-2">
                <Badge variant="outline" className="text-[10px]">
                  {h.label.partition === 'yesterday' ? '🕰️' : h.label.partition === 'today' ? '⚡' : '🚀'} {h.label.partition}
                </Badge>
                <span className="opacity-60">{h.label.intent}</span>
                <span className="opacity-60">·</span>
                <span className="opacity-60">{h.label.domain}</span>
                <span className="ml-auto opacity-40">{Math.round(h.label.confidence * 100)}%</span>
                <span className="truncate max-w-[200px] opacity-50">{h.raw.slice(0, 40)}…</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Architecture diagram */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-sm mb-4">Pipeline Architecture</h2>
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <div className="bg-secondary rounded px-3 py-2">RAW PROMPT</div>
          <span className="text-muted-foreground">→</span>
          <div className="bg-secondary rounded px-3 py-2 text-purple-400">🛡️ GUARDIAN TAGGER</div>
          <span className="text-muted-foreground">→</span>
          <div className="bg-secondary rounded px-3 py-2 text-cyan-400">🏷️ STUDIO LABELS</div>
          <span className="text-muted-foreground">→</span>
          <div className="bg-secondary rounded px-3 py-2 text-amber-400">🔀 ROUTER</div>
          <span className="text-muted-foreground">→</span>
          <div className="flex gap-1">
            <div className="bg-purple-500/20 border border-purple-500/30 rounded px-2 py-1">🕰️ YESTERDAY</div>
            <div className="bg-cyan-500/20 border border-cyan-500/30 rounded px-2 py-1">⚡ TODAY</div>
            <div className="bg-amber-500/20 border border-amber-500/30 rounded px-2 py-1">🚀 TOMORROW</div>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="bg-secondary rounded px-3 py-2">MODEL</div>
        </div>
      </div>
    </div>
  );
}
