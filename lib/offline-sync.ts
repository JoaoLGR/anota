import type { Folder, Note } from "./types";

export type OfflineMutation =
  | { id: string; kind: "note-create"; userId: string; note: Note }
  | { id: string; kind: "note-update"; userId: string; note: Note }
  | { id: string; kind: "note-delete"; userId: string; noteId: string }
  | { id: string; kind: "folder-create"; userId: string; folder: Folder }
  | { id: string; kind: "folder-update"; userId: string; folder: Folder }
  | { id: string; kind: "folder-delete"; userId: string; folderId: string }
  | {
      id: string;
      kind: "folder-reorder";
      userId: string;
      folders: Array<Pick<Folder, "id" | "position">>;
    }
  | { id: string; kind: "trash-empty"; userId: string };

const cacheKey = (userId: string) => `anota-workspace-cache-v1:${userId}`;
const queueKey = (userId: string) => `anota-offline-queue-v1:${userId}`;
const findLastIndex = <T,>(items: T[], matches: (item: T) => boolean) => {
  for (let index = items.length - 1; index >= 0; index--) {
    if (matches(items[index])) return index;
  }
  return -1;
};

export function readWorkspaceCache(userId: string, storage: Storage = localStorage) {
  try {
    const cached = JSON.parse(storage.getItem(cacheKey(userId)) || "null") as
      | { folders: Folder[]; notes: Note[] }
      | null;
    return cached?.folders && cached?.notes ? cached : null;
  } catch {
    return null;
  }
}

export function writeWorkspaceCache(
  userId: string,
  folders: Folder[],
  notes: Note[],
  storage: Storage = localStorage,
) {
  try {
    storage.setItem(cacheKey(userId), JSON.stringify({ folders, notes }));
  } catch {
    // Quota errors should not prevent the editor from continuing locally.
  }
}

export function readOfflineQueue(userId: string, storage: Storage = localStorage): OfflineMutation[] {
  try {
    const queue = JSON.parse(storage.getItem(queueKey(userId)) || "[]");
    return Array.isArray(queue)
      ? (queue as OfflineMutation[]).filter((mutation) => mutation.userId === userId)
      : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineMutation(
  mutation: OfflineMutation,
  storage: Storage = localStorage,
): boolean {
  try {
    const queue = readOfflineQueue(mutation.userId, storage);
    const noteId = mutation.kind === "note-create" || mutation.kind === "note-update"
      ? mutation.note.id
      : null;
    const folderId = mutation.kind === "folder-create" || mutation.kind === "folder-update"
      ? mutation.folder.id
      : null;
    if (noteId) {
      const index = findLastIndex(queue, (item) =>
        (item.kind === "note-create" || item.kind === "note-update") && item.note.id === noteId,
      );
      if (index >= 0) {
        const previous = queue[index];
        queue[index] = {
          ...mutation,
          id: previous.id,
          kind: previous.kind === "note-create" ? "note-create" : mutation.kind,
        } as OfflineMutation;
        storage.setItem(queueKey(mutation.userId), JSON.stringify(queue));
        return true;
      }
    }
    if (folderId) {
      const index = findLastIndex(queue, (item) =>
        (item.kind === "folder-create" || item.kind === "folder-update") && item.folder.id === folderId,
      );
      if (index >= 0) {
        const previous = queue[index];
        queue[index] = {
          ...mutation,
          id: previous.id,
          kind: previous.kind === "folder-create" ? "folder-create" : mutation.kind,
        } as OfflineMutation;
        storage.setItem(queueKey(mutation.userId), JSON.stringify(queue));
        return true;
      }
    }
    storage.setItem(
      queueKey(mutation.userId),
      JSON.stringify([...queue, mutation]),
    );
    return true;
  } catch {
    return false;
  }
}

export function removeOfflineMutation(
  userId: string,
  id: string,
  storage: Storage = localStorage,
) {
  try {
    storage.setItem(
      queueKey(userId),
      JSON.stringify(readOfflineQueue(userId, storage).filter((mutation) => mutation.id !== id)),
    );
  } catch {
    // Retried on the next online event.
  }
}

export function countOfflineMutations(userId: string, storage: Storage = localStorage) {
  return readOfflineQueue(userId, storage).length;
}
