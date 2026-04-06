import { Activity, Clock, Rocket, Tag, Zap } from 'lucide-react';
import { LockdownStatus } from '@/components/LockdownStatus';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/filters/StatCard';
import { guardianTagger } from '@/guardian/tagger';
import { PARTITION_CONFIGS } from '@/partitions/configs';

export default function DashboardPage() {
  const history = guardianTagger.getHistory();
  const counts = {
    yesterday: history.filter((h) => h.label.partition === 'yesterday').length,
    today: history.filter((h) => h.label.partition === 'today').length,
    tomorrow: history.filter((h) => h.label.partition === 'tomorrow').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ALFA Guardian v2</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Temporal Partition Engine - LASUCH · CERBER · GUARDIAN
        </p>
      </div>

      <LockdownStatus />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Prompty w sesji" value={history.length} variant="primary" />
        <StatCard icon={Clock} label="Yesterday" value={counts.yesterday} description="historia i kontekst" variant="accent" />
        <StatCard icon={Zap} label="Today" value={counts.today} description="aktywne zadania" variant="info" />
        <StatCard icon={Rocket} label="Tomorrow" value={counts.tomorrow} description="plany i strategie" variant="warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(PARTITION_CONFIGS).map((partition) => (
          <div
            key={partition.partition}
            className="bg-card border border-border rounded-xl p-5 space-y-3"
            style={{ borderColor: `${partition.color}33` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{partition.icon}</span>
              <div>
                <p className="font-bold text-sm text-foreground uppercase tracking-wide">{partition.partition}</p>
                <p className="text-xs text-muted-foreground">{partition.description}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              <div className="flex justify-between">
                <span>temperature</span>
                <span style={{ color: partition.color }}>{partition.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span>max tokens</span>
                <span style={{ color: partition.color }}>{partition.maxTokens}</span>
              </div>
              <div className="flex justify-between">
                <span>pamiec</span>
                <span style={{ color: partition.color }}>{partition.memoryWindow} msg</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Ostatnie Studio Labels</h2>
          </div>
          <div className="space-y-2">
            {history.slice(-5).reverse().map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs font-mono text-muted-foreground border-b border-border/30 pb-2">
                <Badge variant="outline" className="text-[10px]">
                  {item.label.partition}
                </Badge>
                <span className="opacity-60">{item.label.intent}</span>
                <span className="opacity-60">/</span>
                <span className="opacity-60">{item.label.domain}</span>
                <span className="ml-auto opacity-40">{Math.round(item.label.confidence * 100)}%</span>
                <span className="truncate max-w-[240px] opacity-50">{item.raw.slice(0, 48)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-sm mb-4">Pipeline Architecture</h2>
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <div className="bg-secondary rounded px-3 py-2">RAW PROMPT</div>
          <span className="text-muted-foreground">{'->'}</span>
          <div className="bg-secondary rounded px-3 py-2 text-cyan-400">GUARDIAN TAGGER</div>
          <span className="text-muted-foreground">{'->'}</span>
          <div className="bg-secondary rounded px-3 py-2 text-sky-400">STUDIO LABELS</div>
          <span className="text-muted-foreground">{'->'}</span>
          <div className="bg-secondary rounded px-3 py-2 text-amber-400">ROUTER</div>
          <span className="text-muted-foreground">{'->'}</span>
          <div className="flex gap-1">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded px-2 py-1">yesterday</div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded px-2 py-1">today</div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">tomorrow</div>
          </div>
          <span className="text-muted-foreground">{'->'}</span>
          <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-red-400">
            MODEL DISPATCH DISABLED
          </div>
        </div>
      </div>
    </div>
  );
}
