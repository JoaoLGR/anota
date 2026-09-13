import type { Note } from "./types";

export function permanentlyDeleteNote(notes: Note[], id: string) {
  return notes.filter((note) => note.id !== id);
}

export function filterNotes(notes: Note[], view: string, query: string) {
  return notes
    .filter((note) => (view === "trash" ? Boolean(note.deletedAt) : !note.deletedAt))
    .filter((note) => (view === "favorites" ? note.favorite : true))
    .filter((note) => (view.startsWith("folder:") ? note.folderId === view.slice(7) : true))
    .filter((note) => !query || `${note.title} ${note.contentText}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
