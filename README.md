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
🔍 ANALYZER          (lightweight pre-inference decision layer)
    ↓
semantic partition
    ↓
┌──────────────┬──────────────┬──────────────┐
│ 🕰️ YESTERDAY  │  ⚡ TODAY     │  🚀 TOMORROW  │
│ temp: 0.3    │  temp: 0.5   │  temp: 0.8   │
│ mem: 20 msg  │  mem: 10 msg │  mem: 5 msg  │
└──────────────┴──────────────┴──────────────┘
    ↓
🧠 REASONER          (deep reasoning — 120B / AirLLM-style constrained execution)
    ↓
⚙️ EXECUTOR          (lightweight final delivery — fast operational model)
```

## Semantic Routing vs. Model Execution

These are two distinct layers of the pipeline:

**Semantic routing** (Guardian Tagger → Studio Labels → Partition Router) classifies the
prompt's temporal and intent context — assigning it to one of the three semantic partitions
(`yesterday`, `today`, `tomorrow`). This determines *what kind* of reasoning is appropriate
and configures temperature and memory window accordingly.

**Model execution** (Analyzer → Reasoner → Executor) is the staged inference technique that
runs *after* routing. It controls *how* the model processes the classified prompt:
- The Analyzer decides the required reasoning depth before any heavy computation begins.
- The Reasoner applies deep, constrained inference only when the Analyzer confirms it is necessary.
- The Executor delivers the final response efficiently using a lighter operational model.

Semantic routing and model execution are complementary, not interchangeable.

## 3-Phase Model Execution

Once a prompt has been classified and routed to its semantic partition, the 3-phase execution
layer takes over. This is a staged inference strategy designed to reduce unnecessary compute
while preserving reasoning quality when it matters.

### Phase 1 — Analyzer
A lightweight pre-inference decision layer. Before committing to full model inference, the
Analyzer evaluates the prompt's complexity, domain requirements, and partition signal to
determine the execution path. It acts as a compute gate: simple requests are forwarded
directly to the Executor; complex requests are escalated to the Reasoner.

### Phase 2 — Reasoner
Deep reasoning stage. When the Analyzer determines that the request requires heavy inference
(multi-step logic, structured analysis, long-context synthesis), the Reasoner handles it using
a 120B-scale model or an AirLLM-style layer-by-layer execution strategy. This phase is only
engaged when justified by the Analyzer output.

### Phase 3 — Executor
Lightweight final delivery stage. The Executor takes the Reasoner's output (or a direct
Analyzer pass-through for simpler requests) and produces the final response using a fast,
smaller operational model (e.g. 20B class). This keeps latency and resource use low on the
output path.

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

`YESTERDAY`, `TODAY`, and `TOMORROW` are **semantic partitions** — they describe the temporal
and contextual nature of a request, not the model execution technique. Each partition configures
inference parameters (temperature, memory window) appropriate to that context. The 3-phase
execution layer then runs within whichever partition the prompt has been routed to.

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
