import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  variant?: 'primary' | 'accent' | 'info' | 'warning';
}

const variantStyles = {
  primary: 'glow-primary border-primary/20',
  accent: 'glow-accent border-accent/20',
  info: 'border-info/20',
  warning: 'border-warning/20',
};

export function StatCard({ icon: Icon, label, value, description, variant = 'primary' }: StatCardProps) {
  return (
    <div className={`bg-card rounded-xl border p-6 transition-all hover:scale-[1.02] ${variantStyles[variant]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-3xl font-display font-bold text-foreground">{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}
