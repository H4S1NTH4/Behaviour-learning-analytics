/**
 * Batch Manager Utility
 *
 * Handles batching and transmission of keystroke events
 */

import type { KeystrokeEvent, BatchPayload } from '../types';

export interface BatchManagerOptions {
  apiEndpoint: string;
  batchSizeLimit: number;
  batchTimeLimit: number;
  onBatchSuccess?: (batch: KeystrokeEvent[]) => void;
  onBatchError?: (batch: KeystrokeEvent[], error: Error) => void;
  debug?: boolean;
}

export class BatchManager {
  private buffer: KeystrokeEvent[] = [];
  private failedBatches: KeystrokeEvent[][] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private options: BatchManagerOptions;

  constructor(options: BatchManagerOptions) {
    this.options = options;
    this.startBatchTimer();
  }

  /**
   * Add event to buffer
   */
  public addEvent(event: KeystrokeEvent): void {
    this.buffer.push(event);

    this.log('Event added to buffer', {
      bufferSize: this.buffer.length,
      eventType: event.event_type
    });

    // Check if size limit reached
    if (this.buffer.length >= this.options.batchSizeLimit) {
      this.log('Size limit reached, flushing buffer');
      this.flush();
    }
  }

  /**
   * Flush buffer immediately
   */
  public async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      this.log('Buffer empty, nothing to flush');
      return;
    }

    const batch = [...this.buffer];
    this.buffer = [];

    this.log('Flushing batch', { count: batch.length });

    try {
      await this.transmitBatch(batch);
      this.log('Batch transmitted successfully');

      if (this.options.onBatchSuccess) {
        this.options.onBatchSuccess(batch);
      }

      // Retry failed batches
      if (this.failedBatches.length > 0) {
        await this.retryFailedBatches();
      }
    } catch (error) {
      this.log('Batch transmission failed', { error });
      this.failedBatches.push(batch);

      if (this.options.onBatchError) {
        this.options.onBatchError(batch, error as Error);
      }
    }
  }

  /**
   * Transmit batch to server
   */
  private async transmitBatch(batch: KeystrokeEvent[]): Promise<void> {
    if (batch.length === 0) return;

    const payload: Partial<BatchPayload> = {
      session_id: batch[0]?.session_id,
      user_id: batch[0]?.user_id,
      events: batch,
      metadata: {
        batch_size: batch.length,
        client_timestamp: Date.now()
      }
    };

    const response = await fetch(this.options.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': batch[0]?.session_id || ''
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
  }

  /**
   * Retry failed batches
   */
  private async retryFailedBatches(): Promise<void> {
    this.log('Retrying failed batches', { count: this.failedBatches.length });

    const retryQueue = [...this.failedBatches];
    this.failedBatches = [];

    for (const batch of retryQueue) {
      try {
        await this.transmitBatch(batch);
        this.log('Failed batch successfully retried', { size: batch.length });
      } catch (error) {
        this.log('Retry failed', { error });
        this.failedBatches.push(batch);
      }
    }
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      if (this.buffer.length > 0) {
        this.log('Time limit reached, flushing buffer');
        this.flush();
      }
      this.startBatchTimer();
    }, this.options.batchTimeLimit);
  }

  /**
   * Stop batch timer
   */
  public stop(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Flush remaining events
    if (this.buffer.length > 0) {
      this.flush();
    }
  }

  /**
   * Get buffer statistics
   */
  public getStats() {
    return {
      bufferSize: this.buffer.length,
      failedBatches: this.failedBatches.length,
      totalFailedEvents: this.failedBatches.reduce((sum, batch) => sum + batch.length, 0)
    };
  }

  /**
   * Send final batch using sendBeacon (for page unload)
   */
  public sendBeacon(): boolean {
    const allEvents = [
      ...this.buffer,
      ...this.failedBatches.flat()
    ];

    if (allEvents.length === 0) {
      return true;
    }

    const payload = JSON.stringify({
      session_id: allEvents[0]?.session_id,
      user_id: allEvents[0]?.user_id,
      events: allEvents,
      metadata: {
        batch_size: allEvents.length,
        client_timestamp: Date.now(),
        session_end: true
      }
    });

    return navigator.sendBeacon(this.options.apiEndpoint, payload);
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.options.debug) {
      console.log(`[BatchManager] ${message}`, data || '');
    }
  }
}

/**
 * Create a batch manager instance
 */
export function createBatchManager(options: BatchManagerOptions): BatchManager {
  return new BatchManager(options);
}
