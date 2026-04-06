import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2, Server, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { ModelAdapter } from '@/lib/adapters/types';
import { createAdapter } from '@/lib/adapters/factory';
import { OllamaAdapter } from '@/lib/adapters/ollama';
import { PROVIDER_INFO, type AIProvider } from '@/types/studio-labels';

interface LLMConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  modelId: string;
  enabled: boolean;
}

const STORAGE_KEY = 'alfa_llm_config';

const POPULAR_MODELS: Record<string, { id: string; label: string }[]> = {
  ollama: [
    { id: 'llama3.2:1b', label: 'Llama 3.2 1B' },
    { id: 'llama3.2:3b', label: 'Llama 3.2 3B' },
    { id: 'llama3.1:8b', label: 'Llama 3.1 8B' },
    { id: 'llama3.3:70b', label: 'Llama 3.3 70B' },
    { id: 'mistral:7b', label: 'Mistral 7B' },
    { id: 'mixtral:8x7b', label: 'Mixtral 8x7B' },
    { id: 'phi3:mini', label: 'Phi-3 Mini' },
    { id: 'phi3:medium', label: 'Phi-3 Medium' },
    { id: 'gemma2:9b', label: 'Gemma 2 9B' },
    { id: 'qwen2.5:7b', label: 'Qwen 2.5 7B' },
    { id: 'deepseek-r1:8b', label: 'DeepSeek R1 8B' },
    { id: 'command-r:35b', label: 'Command R 35B' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'gpt-4', label: 'GPT-4' },
    { id: 'o1', label: 'o1' },
    { id: 'o1-mini', label: 'o1 Mini' },
    { id: 'o3-mini', label: 'o3 Mini' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  ],
  google: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
  ],
  mistral: [
    { id: 'mistral-large-latest', label: 'Mistral Large' },
    { id: 'mistral-medium-latest', label: 'Mistral Medium' },
    { id: 'mistral-small-latest', label: 'Mistral Small' },
    { id: 'codestral-latest', label: 'Codestral' },
  ],
  custom: [],
};

function loadConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { provider: 'ollama', apiKey: '', baseUrl: 'http://localhost:11434', modelId: 'llama3.2:1b', enabled: false };
}

function saveConfig(config: LLMConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface Props {
  onAdapterChange: (adapter: ModelAdapter | null) => void;
}

export function LLMConnectionPanel({ onAdapterChange }: Props) {
  const [config, setConfig] = useState<LLMConfig>(loadConfig);
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [detectedModels, setDetectedModels] = useState<{ id: string; label: string }[] | null>(null);

  const needsApiKey = config.provider !== 'ollama';

  useEffect(() => {
    saveConfig(config);
    if (config.enabled) {
      const adapter = createAdapter(config.provider, {
        baseUrl: config.baseUrl || PROVIDER_INFO[config.provider]?.defaultUrl || '',
        apiKey: config.apiKey,
        modelId: config.modelId,
      });
      onAdapterChange(adapter);
    } else {
      onAdapterChange(null);
    }
  }, [config, onAdapterChange]);

  const updateConfig = (updates: Partial<LLMConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setStatus('idle');
  };

  const switchProvider = (provider: AIProvider) => {
    setDetectedModels(null);
    updateConfig({
      provider,
      baseUrl: PROVIDER_INFO[provider]?.defaultUrl || '',
      modelId: POPULAR_MODELS[provider]?.[0]?.id || '',
      apiKey: provider === 'ollama' ? '' : config.apiKey,
    });
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const adapter = createAdapter(config.provider, {
        baseUrl: config.baseUrl || PROVIDER_INFO[config.provider]?.defaultUrl || '',
        apiKey: config.apiKey,
        modelId: config.modelId,
      });
      const ok = await adapter.testConnection();
      setStatus(ok ? 'connected' : 'error');
      if (ok) {
        updateConfig({ enabled: true });
        if (config.provider === 'ollama' && adapter instanceof OllamaAdapter) {
          const models = await adapter.listModels();
          if (models.length > 0) setDetectedModels(models);
        }
      }
    } catch {
      setStatus('error');
    }
    setTesting(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {config.enabled && status === 'connected' ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-display font-semibold text-sm text-foreground">
            LLM Connection
          </span>
          {config.enabled && (
            <Badge variant="outline" className="text-[10px] font-mono border-success/30 text-success">
              {PROVIDER_INFO[config.provider]?.label} / {config.modelId}
            </Badge>
          )}
          {!config.enabled && (
            <span className="text-xs text-muted-foreground">Pipeline dziala bez modelu (analiza only)</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Expanded config */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-sm">Aktywne polaczenie</Label>
            <Switch checked={config.enabled} onCheckedChange={(v: boolean) => updateConfig({ enabled: v })} />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">Provider</Label>
            <Select value={config.provider} onValueChange={(v: AIProvider) => switchProvider(v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="ollama">
                  <div className="flex items-center gap-2">
                    <Server className="w-3 h-3" /> Ollama (Lokalny)
                  </div>
                </SelectItem>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3" /> OpenAI
                  </div>
                </SelectItem>
                <SelectItem value="anthropic">
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3" /> Anthropic
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3" /> Google AI
                  </div>
                </SelectItem>
                <SelectItem value="groq">
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3" /> Groq
                  </div>
                </SelectItem>
                <SelectItem value="mistral">
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3" /> Mistral
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3" /> Custom API
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">Model</Label>
            {(() => {
              const modelList = (config.provider === 'ollama' && detectedModels && detectedModels.length > 0)
                ? detectedModels
                : (POPULAR_MODELS[config.provider] || []);
              if (modelList.length === 0) {
                return (
                  <Input
                    value={config.modelId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig({ modelId: e.target.value })}
                    placeholder="Wpisz model ID..."
                    className="bg-secondary border-border font-mono text-sm"
                  />
                );
              }
              return (
                <div className="space-y-2">
                  {config.provider === 'ollama' && detectedModels && detectedModels.length > 0 && (
                    <Badge variant="outline" className="text-[10px] border-success/30 text-success mb-1">
                      {detectedModels.length} modeli wykrytych z Ollama
                    </Badge>
                  )}
                  <Select value={config.modelId} onValueChange={(v: string) => updateConfig({ modelId: v })}>
                    <SelectTrigger className="bg-secondary border-border font-mono text-sm">
                      <SelectValue placeholder="Wybierz model..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[240px]">
                      {modelList.map(m => (
                        <SelectItem key={m.id} value={m.id} className="font-mono text-sm">
                          {m.label} <span className="text-muted-foreground ml-1 text-[10px]">{m.id}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={config.modelId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig({ modelId: e.target.value })}
                    placeholder="lub wpisz custom model ID..."
                    className="bg-secondary border-border font-mono text-xs h-8"
                  />
                </div>
              );
            })()}
          </div>

          {needsApiKey && (
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">API Key</Label>
              <Input
                type="password"
                value={config.apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>
          )}

          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">Base URL</Label>
            <Input
              value={config.baseUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig({ baseUrl: e.target.value })}
              placeholder={PROVIDER_INFO[config.provider]?.defaultUrl}
              className="bg-secondary border-border font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={testConnection}
              disabled={testing || (needsApiKey && !config.apiKey)}
              className="gap-2"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
              Test Connection
            </Button>
            {status === 'connected' && (
              <Badge variant="outline" className="text-xs font-mono border-success/30 text-success">
                Connected
              </Badge>
            )}
            {status === 'error' && (
              <Badge variant="outline" className="text-xs font-mono border-destructive/30 text-destructive">
                Connection Failed
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
