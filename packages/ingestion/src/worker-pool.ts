export interface WorkerTask<T, R> {
  item: T;
  index: number;
  total: number;
}

export interface WorkerPoolOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number, itemLabel: string) => void;
}

export async function runWorkerPool<T, R>(
  items: T[],
  workerFn: (item: T, taskIndex: number) => Promise<R>,
  options: WorkerPoolOptions = {}
): Promise<R[]> {
  const concurrency = Math.max(1, options.concurrency || 4);
  const total = items.length;
  const results: R[] = new Array(total);
  let currentIndex = 0;
  let completedCount = 0;

  async function worker() {
    while (currentIndex < total) {
      const taskIndex = currentIndex++;
      const item = items[taskIndex];
      try {
        const result = await workerFn(item, taskIndex);
        results[taskIndex] = result;
      } catch (err: unknown) {
        throw err;
      } finally {
        completedCount++;
        options.onProgress?.(completedCount, total, String((item as any)?.title || `Task #${taskIndex + 1}`));
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);

  return results;
}
