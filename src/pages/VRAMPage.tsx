// ============================================================
// VRAMPage — VRAM Partition Manager UI
// Configure which Ollama model each partition uses and
// monitor live VRAM swap status.
// ============================================================

import { useState, useEffect } from 'react';
import { useVRAM } from '@/hooks/useVRAM';
import { PARTITION_CONFIGS } from '@/partitions/configs';
import type { PartitionType } from '@/types/studio-labels';

const PARTITIONS: PartitionType[] = ['yesterday', 'today', 'tomorrow'];

export default function VRAMPage() {
    const { status, modelMap, isSwapping, swapError, ensureLoaded, updateModel, evictAll } =
          useVRAM();

  const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels]     = useState(false);

  // Fetch installed Ollama models on mount.
  useEffect(() => {
        const base = localStorage.getItem('ollama_base_url') ?? 'http://localhost:11434';
        setLoadingModels(true);
        fetch(`${base}/api/tags`)
          .then(r => r.json())
          .then(data => {
                    const names = (data.models ?? []).map((m: { name: string }) => m.name) as string[];
                    setAvailableModels(names);
          })
          .catch(() => setAvailableModels([]))
          .finally(() => setLoadingModels(false));
  }, []);

  return (
        <div className="container mx-auto p-6 max-w-3xl">
              <h1 className="text-2xl font-bold mb-1">VRAM Partition Manager</h1>h1>
              <p className="text-muted-foreground text-sm mb-6">
                      Assign an Ollama model to each temporal partition. On small devices (&lt;8 GB VRAM)
                      only one partition is resident at a time — the manager swaps automatically when you
                      switch context.
              </p>p>
        
          {/* Status bar */}
              <div className="rounded-lg border bg-card p-4 mb-6 flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                                <span className="font-semibold">Active partition:</span>span>
                        {status.loadedPartition
                                      ? <span className="font-mono text-primary">{status.loadedPartition}</span>span>
                                  : <span className="text-muted-foreground">none (no model loaded)</span>span>}
                      </div>div>
                      <div className="flex items-center gap-2">
                                <span className="font-semibold">Loaded model:</span>span>
                        {status.loadedModel
                                      ? <span className="font-mono">{status.loadedModel}</span>span>
                                  : <span className="text-muted-foreground">—</span>span>}
                      </div>div>
                {status.lastSwapMs !== null && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                                <span>Last swap:</span>span>
                                <span>{status.lastSwapMs} ms</span>span>
                    </div>div>
                      )}
                {isSwapping && (
                    <div className="text-yellow-500 animate-pulse mt-1">⏳ Swapping model in VRAM…</div>div>
                      )}
                {swapError && (
                    <div className="text-destructive mt-1">⚠ {swapError}</div>div>
                      )}
              </div>div>
        
          {/* Partition cards */}
              <div className="grid gap-4">
                {PARTITIONS.map(partition => {
                    const cfg      = PARTITION_CONFIGS[partition];
                    const current  = modelMap[partition];
                    const isActive = status.loadedPartition === partition;
          
                    return (
                                  <div
                                                  key={partition}
                                                  className={`rounded-lg border p-4 transition-all ${
                                                                    isActive ? 'border-primary ring-1 ring-primary' : 'border-border'
                                                  }`}
                                                >
                                                <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                                  <span className="text-xl">{cfg.icon}</span>span>
                                                                                  <div>
                                                                                                      <div className="font-semibold capitalize">{cfg.partition}</div>div>
                                                                                                      <div className="text-xs text-muted-foreground">{cfg.description}</div>div>
                                                                                    </div>div>
                                                                </div>div>
                                                                <div className="flex items-center gap-2">
                                                                  {isActive && (
                                                                      <span className="text-xs bg-primary/20 text-primary rounded px-2 py-0.5">
                                                                                            IN VRAM
                                                                      </span>span>
                                                                                  )}
                                                                                  <button
                                                                                                        onClick={() => ensureLoaded(partition)}
                                                                                                        disabled={isSwapping || isActive}
                                                                                                        className="text-xs px-3 py-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                                                                      >
                                                                                    {isActive ? 'Loaded' : 'Load'}
                                                                                    </button>button>
                                                                </div>div>
                                                </div>div>
                                  
                                    {/* Model selector */}
                                                <div className="flex items-center gap-2">
                                                                <label className="text-xs text-muted-foreground whitespace-nowrap">
                                                                                  Model:
                                                                </label>label>
                                                  {loadingModels ? (
                                                                    <span className="text-xs text-muted-foreground">loading models…</span>span>
                                                                  ) : availableModels.length > 0 ? (
                                                                    <select
                                                                                          value={current}
                                                                                          onChange={e => updateModel(partition, e.target.value)}
                                                                                          className="flex-1 text-sm rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                                                                                        >
                                                                      {availableModels.map(m => (
                                                                                                                <option key={m} value={m}>{m}</option>option>
                                                                                                              ))}
                                                                      {!availableModels.includes(current) && (
                                                                                                                <option value={current}>{current} (custom)</option>option>
                                                                                        )}
                                                                    </select>select>
                                                                  ) : (
                                                                    <input
                                                                                          type="text"
                                                                                          value={current}
                                                                                          onChange={e => updateModel(partition, e.target.value)}
                                                                                          placeholder="e.g. llama3:8b-instruct-q4_K_M"
                                                                                          className="flex-1 text-sm rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                                                                                        />
                                                                  )}
                                                </div>div>
                                  
                                    {/* Partition params */}
                                                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                                                                <span>temp: {cfg.temperature}</span>span>
                                                                <span>max tokens: {cfg.maxTokens}</span>span>
                                                                <span>memory: {cfg.memoryWindow} msgs</span>span>
                                                </div>div>
                                  </div>div>
                                );
        })}
              </div>div>
        
          {/* Evict all */}
              <div className="mt-6 flex justify-end">
                      <button
                                  onClick={evictAll}
                                  disabled={isSwapping || !status.loadedModel}
                                  className="text-sm px-4 py-2 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                Evict all from VRAM
                      </button>button>
              </div>div>
        </div>div>
      );
}</div>
