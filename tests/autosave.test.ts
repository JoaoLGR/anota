import { describe, expect, it, vi } from "vitest";
import { createDebouncedSaver } from "../lib/autosave";

describe("createDebouncedSaver", () => {
  it("combina alterações e salva somente depois do debounce", async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const saver = createDebouncedSaver<{ title: string; content: string }>(
      save,
      800,
    );

    saver.schedule({ title: "Minha nota" });
    saver.schedule({ content: "Texto" });
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(799);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith({
      title: "Minha nota",
      content: "Texto",
    });
    vi.useRealTimers();
  });

  it("cancela alterações pendentes quando a nota é desmontada", () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const saver = createDebouncedSaver<{ title: string }>(save, 800);

    saver.schedule({ title: "Rascunho" });
    saver.cancel();
    vi.advanceTimersByTime(800);
    expect(save).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("mantém as alterações após falha e permite tentar novamente", async () => {
    vi.useFakeTimers();
    const save = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    const saver = createDebouncedSaver<{ title: string }>(save, 800);
    saver.schedule({ title: "Rascunho offline" });
    vi.advanceTimersByTime(800);
    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledTimes(1);
    await expect(saver.retry()).resolves.toBeUndefined();
    expect(save).toHaveBeenNthCalledWith(2, { title: "Rascunho offline" });
    vi.useRealTimers();
  });
});
