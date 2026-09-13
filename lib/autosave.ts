export function createDebouncedSaver<T extends object>(
  onFlush: (changes: Partial<T>) => void | Promise<void>,
  delay = 800,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Partial<T> = {};

  const flush = () => {
    const changes = pending;
    pending = {};
    if (Object.keys(changes).length > 0) return onFlush(changes);
  };

  return {
    schedule(changes: Partial<T>) {
      pending = { ...pending, ...changes };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void flush();
      }, delay);
    },
    flush,
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = {};
    },
  };
}
