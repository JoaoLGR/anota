export function createDebouncedSaver<T extends object>(
  onFlush: (changes: Partial<T>) => void | Promise<void>,
  delay = 800,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Partial<T> = {};

  const flush = async () => {
    const changes = { ...pending };
    pending = {};
    if (Object.keys(changes).length === 0) return;
    try {
      await onFlush(changes);
    } catch (error) {
      pending = { ...changes, ...pending };
      throw error;
    }
  };

  return {
    schedule(changes: Partial<T>) {
      pending = { ...pending, ...changes };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void flush().catch(() => undefined);
      }, delay);
    },
    flush,
    retry() {
      if (timer) clearTimeout(timer);
      timer = null;
      return flush();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = {};
    },
  };
}
