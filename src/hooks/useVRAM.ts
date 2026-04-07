// ============================================================
// useVRAM — React hook for VRAM partition management
// Exposes VRAM status and model-swap logic to UI components.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import {
    getVRAMManager,
    type VRAMStatus,
    type PartitionModelMap,
} from '@/lib/vram/manager';
import type { PartitionType } from '@/types/studio-labels';

export interface UseVRAMReturn {
    status:        VRAMStatus;
    modelMap:      PartitionModelMap;
    isSwapping:    boolean;
    swapError:     string | null;
    ensureLoaded:  (partition: PartitionType) => Promise<string>;
    updateModel:   (partition: PartitionType, modelId: string) => void;
    evictAll:      () => Promise<void>;
}

/**
 * useVRAM — hook that wraps VRAMManager for use in React components.
 *
 * Usage:
 *   const { status, ensureLoaded } = useVRAM();
 *   const modelId = await ensureLoaded('today');
 *   // now dispatch chat with modelId
 */
export function useVRAM(ollamaBaseUrl?: string): UseVRAMReturn {
    const manager = getVRAMManager(ollamaBaseUrl);

  const [status, setStatus]       = useState<VRAMStatus>(manager.getStatus());
    const [modelMap, setModelMap]   = useState<PartitionModelMap>(manager.getModelMap());
    const [isSwapping, setSwapping] = useState(false);
    const [swapError, setSwapError] = useState<string | null>(null);

  // Keep status in sync after any swap.
  const refreshStatus = useCallback(() => {
        setStatus(manager.getStatus());
        setModelMap(manager.getModelMap());
  }, [manager]);

  const ensureLoaded = useCallback(async (partition: PartitionType): Promise<string> => {
        setSwapping(true);
        setSwapError(null);
        try {
                const modelId = await manager.ensureLoaded(partition);
                refreshStatus();
                return modelId;
        } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setSwapError(msg);
                throw err;
        } finally {
                setSwapping(false);
        }
  }, [manager, refreshStatus]);

  const updateModel = useCallback((partition: PartitionType, modelId: string) => {
        manager.updateModelMap({ [partition]: modelId });
        setModelMap(manager.getModelMap());
  }, [manager]);

  const evictAll = useCallback(async () => {
        setSwapping(true);
        try {
                await manager.evictAll();
                refreshStatus();
        } finally {
                setSwapping(false);
        }
  }, [manager, refreshStatus]);

  // Sync on mount.
  useEffect(() => {
        refreshStatus();
  }, [refreshStatus]);

  return { status, modelMap, isSwapping, swapError, ensureLoaded, updateModel, evictAll };
}
