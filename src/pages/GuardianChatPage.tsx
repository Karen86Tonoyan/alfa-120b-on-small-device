import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Send, Tag } from 'lucide-react';
import { nanoid } from 'nanoid';
import { LockdownStatus } from '@/components/LockdownStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LLMConnectionPanel } from '@/filters/LLMConnectionPanel';
import { guardianRouter } from '@/guardian/router';
import { guardianTagger } from '@/guardian/tagger';
import type { ModelAdapter } from '@/lib/adapters/types';
import { loadPartition } from '@/partitions/configs';
import type { LabeledPrompt } from '@/types/studio-labels';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  label?: LabeledPrompt;
  partition?: string;
}

const PARTITION_ICONS: Record<string, string> = {
  yesterday: 'Y',
  today: 'T',
  tomorrow: 'F',
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

  const handleAdapterChange = useCallback((nextAdapter: ModelAdapter | null) => {
    setAdapter(nextAdapter);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const raw = input.trim();
    setInput('');
    setLoading(true);

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
    setMessages((prev) => [...prev, userMsg]);

    if (!adapter) {
      const sysMsg: Message = {
        id: nanoid(),
        role: 'system',
        content: `Guardian labeled this prompt -> partition: ${labeled.label.partition} (${labeled.label.intent}, ${labeled.label.domain}). Confidence: ${Math.round(labeled.label.confidence * 100)}%. Lockdown remains active, so prompts are analyzed locally and not dispatched to any model.`,
        partition: labeled.label.partition,
      };
      setMessages((prev) => [...prev, sysMsg]);
      setLoading(false);
      return;
    }

    const history = messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));

    const routed = guardianRouter.route(labeled, { conversationHistory: history });

    if (!routed.dispatchAllowed) {
      const holdMsg: Message = {
        id: nanoid(),
        role: 'system',
        content: `Guardian labeled this prompt -> partition: ${labeled.label.partition} (${labeled.label.intent}, ${labeled.label.domain}). Policy: ${routed.policyMode}. Model dispatch is disabled, so the request is held and only analyzed locally.`,
        partition: labeled.label.partition,
      };
      setMessages((prev) => [...prev, holdMsg]);
      setLoading(false);
      return;
    }

    const assistantId = nanoid();
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', partition: labeled.label.partition }]);

    try {
      for await (const chunk of guardianRouter.execute(routed, adapter)) {
        setMessages((prev) =>
          prev.map((message) => (message.id === assistantId ? { ...message, content: message.content + chunk } : message)),
        );
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) => (message.id === assistantId ? { ...message, content: `Error: ${error}` } : message)),
      );
    }

    setLoading(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
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
          <LockdownStatus compact />
          {(['yesterday', 'today', 'tomorrow'] as const).map((partitionName) => (
            <Badge
              key={partitionName}
              variant="outline"
              className={`text-[10px] font-mono transition-all ${
                currentPartition === partitionName ? `${PARTITION_BADGE[partitionName]} ring-1` : 'opacity-40'
              }`}
            >
              {PARTITION_ICONS[partitionName]} {partitionName}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      <LLMConnectionPanel onAdapterChange={handleAdapterChange} />
      <LockdownStatus />

      <div className={`rounded-lg border p-3 text-xs font-mono ${PARTITION_COLORS[currentPartition]}`}>
        <div className="flex items-center gap-2">
          <Tag className="w-3 h-3" />
          <span className="text-muted-foreground">Partycja {PARTITION_ICONS[currentPartition]}</span>
          <span className="font-semibold" style={{ color: partitionConfig.color }}>
            {partitionConfig.description}
          </span>
          <span className="text-muted-foreground ml-auto">
            temp: {partitionConfig.temperature} / tokens: {partitionConfig.maxTokens} / pamiec: {partitionConfig.memoryWindow} wiadomosci
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <div className="text-6xl">A</div>
            <p className="text-sm">Guardian gotowy - napisz cokolwiek</p>
            <p className="text-xs opacity-60">Prompty zostana automatycznie otagowane i przypisane do odpowiedniej partycji.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.role === 'system'
                    ? 'bg-secondary text-muted-foreground italic'
                    : `bg-card border ${message.partition ? PARTITION_COLORS[message.partition] : 'border-border'}`
              }`}
            >
              {message.role === 'user' && message.label && (
                <div className="flex items-center gap-1 mb-2 opacity-70">
                  <Tag className="w-3 h-3" />
                  <span className="text-[10px] font-mono">
                    {PARTITION_ICONS[message.label.label.partition]} {message.label.label.partition} / {message.label.label.intent} / {message.label.label.domain} / {Math.round(message.label.label.confidence * 100)}%
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              {message.role === 'assistant' && message.partition && (
                <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-1 opacity-50">
                  <span className="text-[10px] font-mono">
                    {PARTITION_ICONS[message.partition]} {message.partition}
                  </span>
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

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napisz prompt... Guardian automatycznie go otaguje i wybierze partycje"
          className="bg-card border-border"
          disabled={loading}
        />
        <Button onClick={() => void handleSend()} disabled={loading || !input.trim()} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
