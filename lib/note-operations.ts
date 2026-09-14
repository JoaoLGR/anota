import type { Note } from "./types";

export function createNote(notes: Note[], note: Note) {
  return [note, ...notes];
}

export function updateNote(notes: Note[], id: string, patch: Partial<Note>) {
  return notes.map((note) => (note.id === id ? { ...note, ...patch } : note));
}

export function moveNoteToTrash(
  notes: Note[],
  id: string,
  deletedAt = new Date().toISOString(),
) {
  return updateNote(notes, id, { deletedAt });
}

export function restoreNote(notes: Note[], id: string) {
  return updateNote(notes, id, { deletedAt: null });
}

export function deleteFolderFromState(
  folders: { id: string }[],
  notes: Note[],
  folderId: string,
) {
  return {
    folders: folders.filter((folder) => folder.id !== folderId),
    notes: notes.map((note) =>
      note.folderId === folderId ? { ...note, folderId: null } : note,
    ),
  };
}

export function reorderFolders<T extends { id: string }>(
  folders: T[],
  sourceId: string,
  targetId: string,
) {
  if (sourceId === targetId) return folders;
  const result = [...folders];
  const sourceIndex = result.findIndex((folder) => folder.id === sourceId);
  const targetIndex = result.findIndex((folder) => folder.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return folders;
  const [source] = result.splice(sourceIndex, 1);
  result.splice(targetIndex, 0, source);
  return result.map((folder, position) => ({ ...folder, position }));
}

export function permanentlyDeleteNote(notes: Note[], id: string) {
  return notes.filter((note) => note.id !== id);
}

export function filterNotes(notes: Note[], view: string, query: string) {
  const recentLimit = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const normalizedQuery = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  return notes
    .filter((note) =>
      view === "trash" ? Boolean(note.deletedAt) : !note.deletedAt,
    )
    .filter(
      (note) =>
        view !== "recent" || new Date(note.updatedAt).getTime() >= recentLimit,
    )
    .filter((note) => (view === "favorites" ? note.favorite : true))
    .filter((note) =>
      view.startsWith("folder:") ? note.folderId === view.slice(7) : true,
    )
    .filter((note) => {
      if (!normalizedQuery) return true;
      const searchable = `${note.title} ${note.contentText}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    })
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}
