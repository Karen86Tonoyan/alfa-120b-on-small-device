import React, { useState } from 'react';
import { RefreshCw, Tag } from 'lucide-react';
import { LockdownStatus } from '@/components/LockdownStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { guardianTagger } from '@/guardian/tagger';

const PARTITION_COLORS: Record<string, string> = {
  yesterday: '#8b5cf6',
  today: '#06b6d4',
  tomorrow: '#f59e0b',
};

const PARTITION_ICONS: Record<string, string> = {
  yesterday: 'Y',
  today: 'T',
  tomorrow: 'F',
};

export default function LabelsInspectorPage() {
  const [testPrompt, setTestPrompt] = useState('');
  const [, forceUpdate] = useState(0);

  const history = guardianTagger.getHistory();

  const testLabel = () => {
    if (!testPrompt.trim()) return;
    guardianTagger.label(testPrompt.trim(), 'inspector-session');
    setTestPrompt('');
    forceUpdate((value) => value + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Tag className="w-5 h-5 text-cyan-400" />
            Studio Labels Inspector
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Podglad tagowania promptow przez Guardian</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            guardianTagger.reset();
            forceUpdate((value) => value + 1);
          }}
          className="gap-2"
        >
          <RefreshCw className="w-3 h-3" /> Wyczysc
        </Button>
      </div>

      <LockdownStatus />

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Test Guardian Tagger</p>
        <div className="flex gap-2">
          <Input
            value={testPrompt}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTestPrompt(event.target.value)}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => event.key === 'Enter' && testLabel()}
            placeholder="Wpisz dowolny prompt zeby zobaczyc jak Guardian go otaguje..."
            className="bg-secondary border-border"
          />
          <Button onClick={testLabel} disabled={!testPrompt.trim()} size="sm">
            Tag it
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {history.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Brak danych - wpisz prompt w polu powyzej lub w Guardian Chat
          </div>
        )}

        {[...history].reverse().map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-xl p-4 space-y-2"
            style={{ borderColor: `${PARTITION_COLORS[item.label.partition]}44` }}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-foreground font-medium flex-1 leading-relaxed">"{item.raw}"</p>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge
                  variant="outline"
                  className="text-xs font-mono"
                  style={{ borderColor: `${PARTITION_COLORS[item.label.partition]}66`, color: PARTITION_COLORS[item.label.partition] }}
                >
                  {PARTITION_ICONS[item.label.partition]} {item.label.partition}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">{Math.round(item.label.confidence * 100)}% pewnosci</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="bg-secondary rounded px-2 py-1 text-muted-foreground">
                intent: <span className="text-foreground">{item.label.intent}</span>
              </span>
              <span className="bg-secondary rounded px-2 py-1 text-muted-foreground">
                domain: <span className="text-foreground">{item.label.domain}</span>
              </span>
              {item.label.signals.map((signal) => (
                <span key={signal} className="bg-primary/10 text-primary rounded px-2 py-1">
                  signal: {signal}
                </span>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground font-mono opacity-50">
              {new Date(item.label.labeledAt).toLocaleTimeString()} / {item.sessionId.slice(0, 8)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
