import { describe, expect, it } from "vitest";
import {
  countOfflineMutations,
  enqueueOfflineMutation,
  readOfflineQueue,
  readWorkspaceCache,
  removeOfflineMutation,
  writeWorkspaceCache,
  type OfflineMutation,
} from "../lib/offline-sync";
import type { Note } from "../lib/types";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };
}

const note: Note = {
  id: "note-1", title: "Rascunho", content: "<p>local</p>", contentText: "local",
  folderId: null, favorite: false, pinned: false, deletedAt: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("persistência offline por usuário", () => {
  it("mantém fila ordenada e remove apenas a mutação sincronizada", () => {
    const storage = createStorage();
    const create: OfflineMutation = { id: "1", kind: "note-create", userId: "alice", note };
    const update: OfflineMutation = { id: "2", kind: "note-create", userId: "alice", note: { ...note, id: "note-2", title: "Outra nota" } };
    enqueueOfflineMutation(create, storage);
    enqueueOfflineMutation(update, storage);

    expect(readOfflineQueue("alice", storage).map(({ id }) => id)).toEqual(["1", "2"]);
    removeOfflineMutation("alice", "1", storage);
    expect(readOfflineQueue("alice", storage)).toEqual([update]);
    expect(countOfflineMutations("alice", storage)).toBe(1);
  });

  it("compacta edições repetidas da mesma nota sem perder a criação", () => {
    const storage = createStorage();
    enqueueOfflineMutation({ id: "1", kind: "note-create", userId: "alice", note }, storage);
    enqueueOfflineMutation({ id: "2", kind: "note-update", userId: "alice", note: { ...note, title: "Primeira edição" } }, storage);
    enqueueOfflineMutation({ id: "3", kind: "note-update", userId: "alice", note: { ...note, title: "Última edição" } }, storage);

    const queue = readOfflineQueue("alice", storage);
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ kind: "note-create", note: { title: "Última edição" } });
  });

  it("isola cache e fila entre contas diferentes", () => {
    const storage = createStorage();
    const aliceNote = { ...note, title: "Privada da Alice" };
    writeWorkspaceCache("alice", [], [aliceNote], storage);
    enqueueOfflineMutation({ id: "a1", kind: "note-update", userId: "alice", note }, storage);

    expect(readWorkspaceCache("alice", storage)?.notes[0].title).toBe("Privada da Alice");
    expect(readWorkspaceCache("bob", storage)).toBeNull();
    expect(readOfflineQueue("bob", storage)).toEqual([]);
  });
});
