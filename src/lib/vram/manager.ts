// ============================================================
// ALFA Guardian v2 — VRAM Manager
// Dynamically loads/unloads model partitions in Ollama VRAM
// based on context (yesterday / today / tomorrow).
//
// Strategy: only ONE partition is kept in VRAM at a time on
// small devices (< 8 GB VRAM).  Before dispatching a request
// the manager:
//   1. Checks which partition is currently loaded.
//   2. If it matches the requested partition — no-op.
//   3. Otherwise: evicts the current model (keep_alive=0) then
//      pre-warms the target model (keep_alive=default).
// ============================================================

import type { PartitionType } from '@/types/studio-labels';
import { PARTITION_CONFIGS } from '@/partitions/configs';

// Map partition -> Ollama model name.
// Users configure these via the UI (stored in localStorage).
const PARTITION_MODEL_KEY = 'alfa_partition_models';

export interface PartitionModelMap {
  yesterday: string;
    today: string;
      tomorrow: string;
      }

      const DEFAULT_MODELS: PartitionModelMap = {
        yesterday: 'llama3',
          today:     'llama3',
            tomorrow:  'llama3',
            };

            // ── helpers ─────────────────────────────────────────────────

            function loadModelMap(): PartitionModelMap {
              try {
                  const raw = localStorage.getItem(PARTITION_MODEL_KEY);
                      if (raw) return { ...DEFAULT_MODELS, ...JSON.parse(raw) };
                        } catch {/* ignore */}
                          return { ...DEFAULT_MODELS };
                          }

                          function saveModelMap(map: PartitionModelMap): void {
                            try {
                                localStorage.setItem(PARTITION_MODEL_KEY, JSON.stringify(map));
                                  } catch {/* ignore */}
                                  }

                                  // ── VRAMManager ─────────────────────────────────────────────

                                  export interface VRAMStatus {
                                    loadedPartition: PartitionType | null;
                                      loadedModel:     string | null;
                                        lastSwapMs:      number | null;
                                        }

                                        /**
                                         * VRAMManager — singleton that tracks which model partition is
                                          * currently resident in Ollama VRAM and swaps it on demand.
                                           *
                                            * Works by abusing Ollama's `keep_alive` parameter:
                                             *   keep_alive = 0   → unload model immediately after the request
                                              *   keep_alive = -1  → keep model in memory indefinitely
                                               *
                                                * Pre-warm is done by sending an empty /api/generate request
                                                 * with keep_alive=-1 so Ollama loads the weights into VRAM.
                                                  */
                                                  export class VRAMManager {
                                                    private baseUrl: string;
                                                      private status: VRAMStatus = {
                                                          loadedPartition: null,
                                                              loadedModel:     null,
                                                                  lastSwapMs:      null,
                                                                    };

                                                                      constructor(baseUrl = 'http://localhost:11434') {
                                                                          this.baseUrl = baseUrl.replace(/\/$/, '');
                                                                            }

                                                                              // ── public API ──────────────────────────────────────────

                                                                                getStatus(): VRAMStatus {
                                                                                    return { ...this.status };
                                                                                      }

                                                                                        getModelMap(): PartitionModelMap {
                                                                                            return loadModelMap();
                                                                                              }

                                                                                                updateModelMap(updates: Partial<PartitionModelMap>): void {
                                                                                                    const current = loadModelMap();
                                                                                                        saveModelMap({ ...current, ...updates });
                                                                                                          }
                                                                                                          
                                                                                                            /**
                                                                                                               * Ensure the correct model is loaded in VRAM for the given
                                                                                                                  * partition.  Swaps models if needed.
                                                                                                                     * Returns the model name that should be used for inference.
                                                                                                                        */
                                                                                                                          async ensureLoaded(partition: PartitionType): Promise<string> {
                                                                                                                              const map     = loadModelMap();
                                                                                                                                  const target  = map[partition];
                                                                                                                                      const current = this.status.loadedPartition;
                                                                                                                                      
                                                                                                                                          if (current === partition && this.status.loadedModel === target) {
                                                                                                                                                // Already loaded — fast path.
                                                                                                                                                      return target;
                                                                                                                                                          }
                                                                                                                                                          
                                                                                                                                                              const t0 = Date.now();
                                                                                                                                                              
                                                                                                                                                                  // 1. Evict current model from VRAM (if any).
                                                                                                                                                                      if (this.status.loadedModel) {
                                                                                                                                                                            await this.evict(this.status.loadedModel);
                                                                                                                                                                                }
                                                                                                                                                                                
                                                                                                                                                                                    // 2. Pre-warm target model.
                                                                                                                                                                                        await this.prewarm(target);
                                                                                                                                                                                        
                                                                                                                                                                                            this.status = {
                                                                                                                                                                                                  loadedPartition: partition,
                                                                                                                                                                                                        loadedModel:     target,
                                                                                                                                                                                                              lastSwapMs:      Date.now() - t0,
                                                                                                                                                                                                                  };
                                                                                                                                                                                                                  
                                                                                                                                                                                                                      console.info(
                                                                                                                                                                                                                            `[VRAMManager] swapped ${current ?? 'none'} → ${partition} ` +
                                                                                                                                                                                                                                  `(model: ${target}, ${this.status.lastSwapMs} ms)`
                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                          return target;
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                              /**
                                                                                                                                                                                                                                                 * Evict all partitions from VRAM (useful on app unload).
                                                                                                                                                                                                                                                    */
                                                                                                                                                                                                                                                      async evictAll(): Promise<void> {
                                                                                                                                                                                                                                                          const map = loadModelMap();
                                                                                                                                                                                                                                                              const models = [...new Set(Object.values(map))];
                                                                                                                                                                                                                                                                  await Promise.allSettled(models.map(m => this.evict(m)));
                                                                                                                                                                                                                                                                      this.status = { loadedPartition: null, loadedModel: null, lastSwapMs: null };
                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                          // ── private helpers ─────────────────────────────────────
                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                            /**
                                                                                                                                                                                                                                                                               * Tell Ollama to unload a model by sending keep_alive=0.
                                                                                                                                                                                                                                                                                  * Uses /api/generate (not /api/chat) because Ollama tracks
                                                                                                                                                                                                                                                                                     * keep_alive per-endpoint.
                                                                                                                                                                                                                                                                                        */
                                                                                                                                                                                                                                                                                          private async evict(modelId: string): Promise<void> {
                                                                                                                                                                                                                                                                                              try {
                                                                                                                                                                                                                                                                                                    await fetch(`${this.baseUrl}/api/generate`, {
                                                                                                                                                                                                                                                                                                            method: 'POST',
                                                                                                                                                                                                                                                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                                                                                                                                                                                                                                                            body: JSON.stringify({ model: modelId, prompt: '', keep_alive: 0 }),
                                                                                                                                                                                                                                                                                                                                    signal: AbortSignal.timeout(10_000),
                                                                                                                                                                                                                                                                                                                                          });
                                                                                                                                                                                                                                                                                                                                              } catch (err) {
                                                                                                                                                                                                                                                                                                                                                    console.warn(`[VRAMManager] evict failed for ${modelId}:`, err);
                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                            /**
                                                                                                                                                                                                                                                                                                                                                               * Pre-warm a model — sends an empty generate request with
                                                                                                                                                                                                                                                                                                                                                                  * keep_alive=-1 so Ollama loads it into VRAM and keeps it
                                                                                                                                                                                                                                                                                                                                                                     * resident until the next evict.
                                                                                                                                                                                                                                                                                                                                                                        */
                                                                                                                                                                                                                                                                                                                                                                          private async prewarm(modelId: string): Promise<void> {
                                                                                                                                                                                                                                                                                                                                                                              try {
                                                                                                                                                                                                                                                                                                                                                                                    await fetch(`${this.baseUrl}/api/generate`, {
                                                                                                                                                                                                                                                                                                                                                                                            method: 'POST',
                                                                                                                                                                                                                                                                                                                                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                                                                                                                                                                                                                                                                                                                                            body: JSON.stringify({ model: modelId, prompt: '', keep_alive: -1 }),
                                                                                                                                                                                                                                                                                                                                                                                                                    signal: AbortSignal.timeout(60_000), // large models can take time to load
                                                                                                                                                                                                                                                                                                                                                                                                                          });
                                                                                                                                                                                                                                                                                                                                                                                                                              } catch (err) {
                                                                                                                                                                                                                                                                                                                                                                                                                                    console.warn(`[VRAMManager] prewarm failed for ${modelId}:`, err);
                                                                                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                          // ── Singleton export ─────────────────────────────────────────
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                          let _instance: VRAMManager | null = null;
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                          export function getVRAMManager(baseUrl?: string): VRAMManager {
                                                                                                                                                                                                                                                                                                                                                                                                                                            if (!_instance) _instance = new VRAMManager(baseUrl);
                                                                                                                                                                                                                                                                                                                                                                                                                                              return _instance;
                                                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                              // ── Partition label helpers ──────────────────────────────────
                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                              /**
                                                                                                                                                                                                                                                                                                                                                                                                                                               * Returns a human-readable label for the given partition,
                                                                                                                                                                                                                                                                                                                                                                                                                                                * including the configured model name.
                                                                                                                                                                                                                                                                                                                                                                                                                                                 */
                                                                                                                                                                                                                                                                                                                                                                                                                                                 export function getPartitionLabel(partition: PartitionType): string {
                                                                                                                                                                                                                                                                                                                                                                                                                                                   const cfg = PARTITION_CONFIGS[partition];
                                                                                                                                                                                                                                                                                                                                                                                                                                                     const map = loadModelMap();
                                                                                                                                                                                                                                                                                                                                                                                                                                                       return `${cfg.icon} ${cfg.partition} → ${map[partition]}`;
                                                                                                                                                                                                                                                                                                                                                                                                                                                       }
