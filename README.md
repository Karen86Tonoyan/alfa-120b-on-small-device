# ALFA Guardian v2
### Temporal Partition Engine — Karen Tonoyan © 2026

---

## Architecture

```
RAW PROMPT
    ↓
🛡️ GUARDIAN TAGGER  (studio-labels/tagger.ts)
    ↓
🏷️ STUDIO LABELS    (partition | intent | domain | confidence | signals)
    ↓
🔀 PARTITION ROUTER  (guardian/router.ts)
    ↓
┌──────────────┬──────────────┬──────────────┐
│ 🕰️ YESTERDAY  │  ⚡ TODAY     │  🚀 TOMORROW  │
│ temp: 0.3    │  temp: 0.5   │  temp: 0.8   │
│ mem: 20 msg  │  mem: 10 msg │  mem: 5 msg  │
└──────────────┴──────────────┴──────────────┘
    ↓
 MODEL (Ollama / OpenAI / Anthropic / Google / Groq / Mistral)
```

## How Studio Labels Work

Every prompt passes through the **GuardianTagger** before reaching the model.
The tagger scores the prompt against keyword signal dictionaries and stamps it with:

| Label | Description |
|-------|-------------|
| `partition` | `yesterday` \| `today` \| `tomorrow` |
| `intent` | `recall` \| `analyze` \| `execute` \| `plan` \| `predict` \| `reflect` |
| `domain` | `code` \| `data` \| `creative` \| `ops` \| `research` \| `conversation` |
| `confidence` | 0–1 score |
| `signals` | matched keywords |

## Partitions

- **Yesterday** 🕰️ — Historical context, memory recall, retrospectives. Low temperature (0.3), large memory window (20 messages).
- **Today** ⚡ — Active execution, debugging, real-time analysis. Balanced temperature (0.5), medium window (10 messages).
- **Tomorrow** 🚀 — Planning, forecasting, strategy. High temperature (0.8), small window (5 messages — focused on future, not past).

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:8080`

## Pages

- `/` — Dashboard with partition stats and pipeline diagram
- `/chat` — Guardian Chat (prompts auto-tagged and routed)
- `/labels` — Studio Labels Inspector (real-time label viewer + tester)

## Karen's Original Filters

All original filters from `magic-ai-filters` are preserved in `src/filters/`:
- `LLMConnectionPanel.tsx` — Multi-provider connection manager
- `StatCard.tsx` — Metric card component
- `NavLink.tsx` — Navigation link component
