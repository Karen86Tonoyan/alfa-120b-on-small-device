// ============================================================
//  ALFA Guardian v2 — Guardian Chat Page
//  The core UI: prompts flow through Guardian → partition → model
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Tag, Clock, Zap, Rocket, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LLMConnectionPanel } from '@/filters/LLMConnectionPanel';
import { guardianTagger } from '@/guardian/tagger';
import { guardianRouter } from '@/guardian/router';
import { loadPartition } from '@/partitions/configs';
import type { ModelAdapter } from '@/lib/adapters/types';
import type { LabeledPrompt } from '@/types/studio-labels';
import { nanoid } from 'nanoid';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  label?: LabeledPrompt;
  partition?: string;
}

const PARTITION_ICONS: Record<string, string> = {
  yesterday: '🕰️',
  today: '⚡',
  tomorrow: '🚀',
};

const PARTITION_COLORS: Record<string, string> = {
  yesterday: 'border-purple-500/40 bg-purple-500/5',
  today: 'border-cyan-500/40 bg-cyan-500/5',
  tomorrow: 'border-amber-500/40 bg-amber-500/5',
};

const PARTITION_BADGE: Record<string, string> = {
  yesterday: 'border-purple-500/40 text-purple-400',
  today: 'border-cyan-500/40 text-cyan-400',
  tomorrow: 'border-amber-500/40 text-amber-400',
};

const SESSION_ID = nanoid();

export default function GuardianChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [adapter, setAdapter] = useState<ModelAdapter | null>(null);
  const [currentPartition, setCurrentPartition] = useState<string>('today');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAdapterChange = useCallback((a: ModelAdapter | null) => {
    setAdapter(a);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const raw = input.trim();
    setInput('');
    setLoading(true);

    // Step 1: Guardian tags the prompt
    const labeled = guardianTagger.label(raw, SESSION_ID);
    const partition = loadPartition(labeled.label.partition);
    setCurrentPartition(labeled.label.partition);

    const userMsg: Message = {
      id: nanoid(),
      role: 'user',
      content: raw,
      label: labeled,
      partition: labeled.label.partition,
    };
    setMessages(prev => [...prev, userMsg]);

    if (!adapter) {
      // No model — show label only
      const sysMsg: Message = {
        id: nanoid(),
        role: 'system',
        content: `Guardian labeled this prompt → partition: **${labeled.label.partition}** (${labeled.label.intent}, ${labeled.label.domain}). Confidence: ${Math.round(labeled.label.confidence * 100)}%. Połącz model żeby otrzymać odpowiedź.`,
        partition: labeled.label.partition,
      };
      setMessages(prev => [...prev, sysMsg]);
      setLoading(false);
      return;
    }

    // Step 2: Route and stream
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const routed = guardianRouter.route(labeled, { conversationHistory: history });

    const assistantId = nanoid();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      partition: labeled.label.partition,
    }]);

    try {
      for await (const chunk of guardianRouter.execute(routed, adapter)) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: m.content + chunk } : m
        ));
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: `Error: ${err}` } : m
      ));
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const reset = () => {
    setMessages([]);
    guardianTagger.reset();
    setCurrentPartition('today');
  };

  const partitionConfig = loadPartition(currentPartition as 'yesterday' | 'today' | 'tomorrow');

  return (
    <div className="flex flex-col h-screen bg-background p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{PARTITION_ICONS[currentPartition]}</span>
          <div>
            <h1 className="font-bold text-xl text-foreground">Guardian Chat</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Aktywna partycja: <span style={{ color: partitionConfig.color }}>{currentPartition.toUpperCase()}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Partition indicators */}
          {(['yesterday', 'today', 'tomorrow'] as const).map(p => (
            <Badge
              key={p}
              variant="outline"
              className={`text-[10px] font-mono transition-all ${
                currentPartition === p
                  ? PARTITION_BADGE[p] + ' ring-1'
                  : 'opacity-40'
              }`}
            >
              {PARTITION_ICONS[p]} {p}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* LLM Panel */}
      <LLMConnectionPanel onAdapterChange={handleAdapterChange} />

      {/* Partition info bar */}
      <div className={`rounded-lg border p-3 text-xs font-mono ${PARTITION_COLORS[currentPartition]}`}>
        <div className="flex items-center gap-2">
          <Tag className="w-3 h-3" />
          <span className="text-muted-foreground">Partycja {PARTITION_ICONS[currentPartition]}</span>
          <span className="font-semibold" style={{ color: partitionConfig.color }}>
            {partitionConfig.description}
          </span>
          <span className="text-muted-foreground ml-auto">
            temp: {partitionConfig.temperature} · tokens: {partitionConfig.maxTokens} · pamiec: {partitionConfig.memoryWindow} wiadomosci
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <div className="text-6xl">🛡️</div>
            <p className="text-sm">Guardian gotowy — napisz cokolwiek</p>
            <p className="text-xs opacity-60">Prompte zostaną automatycznie otagowane i przekierowane do właściwej partycji modelu</p>
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : msg.role === 'system'
                  ? 'bg-secondary text-muted-foreground italic'
                  : `bg-card border ${msg.partition ? PARTITION_COLORS[msg.partition] : 'border-border'}`
              }`}
            >
              {msg.role === 'user' && msg.label && (
                <div className="flex items-center gap-1 mb-2 opacity-70">
                  <Tag className="w-3 h-3" />
                  <span className="text-[10px] font-mono">
                    {PARTITION_ICONS[msg.label.label.partition]} {msg.label.label.partition} · {msg.label.label.intent} · {msg.label.label.domain} · {Math.round(msg.label.label.confidence * 100)}%
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.role === 'assistant' && msg.partition && (
                <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-1 opacity-50">
                  <span className="text-[10px] font-mono">{PARTITION_ICONS[msg.partition]} {msg.partition}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napisz prompt... Guardian automatycznie go otaguje i wybierze partycję"
          className="bg-card border-border"
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
