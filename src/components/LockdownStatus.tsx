import { ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ALFA_LOCKDOWN_ENABLED, getPolicyMode } from '@/lib/pipeline/policy';

interface LockdownStatusProps {
  compact?: boolean;
}

export function LockdownStatus({ compact = false }: LockdownStatusProps) {
  const policyMode = getPolicyMode();

  if (!ALFA_LOCKDOWN_ENABLED) {
    return (
      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono">
        adaptive
      </Badge>
    );
  }

  if (compact) {
    return (
      <Badge variant="outline" className="border-red-500/30 text-red-400 font-mono gap-1">
        <ShieldAlert className="w-3 h-3" />
        {policyMode}
      </Badge>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-red-400" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">Lockdown Mode Active</p>
            <Badge variant="outline" className="border-red-500/30 text-red-400 font-mono">
              {policyMode}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Model dispatch jest globalnie wylaczony. Prompty moga byc tagowane i analizowane, ale nic nie przejdzie dalej do modelu.
          </p>
        </div>
      </div>
    </div>
  );
}
