import { describe, expect, it } from "vitest";
import { filterNotes, permanentlyDeleteNote } from "../lib/note-operations";
import type { Note } from "../lib/types";

const notes: Note[] = [
  { id: "active", title: "Ativa", content: "", contentText: "conteúdo importante", folderId: null, favorite: false, pinned: false, deletedAt: null, updatedAt: "2026-09-12T10:00:00Z" },
  { id: "trash", title: "Excluída", content: "", contentText: "", folderId: null, favorite: false, pinned: false, deletedAt: "2026-09-12T11:00:00Z", updatedAt: "2026-09-12T11:00:00Z" },
];

describe("operações de notas", () => {
  it("mantém notas ativas fora da lixeira e notas excluídas dentro dela", () => {
    expect(filterNotes(notes, "all", "").map((note) => note.id)).toEqual(["active"]);
    expect(filterNotes(notes, "trash", "").map((note) => note.id)).toEqual(["trash"]);
  });

  it("busca no conteúdo textual e remove definitivamente apenas a nota escolhida", () => {
    expect(filterNotes(notes, "all", "IMPORTANTE").map((note) => note.id)).toEqual(["active"]);
    expect(permanentlyDeleteNote(notes, "trash").map((note) => note.id)).toEqual(["active"]);
  });
});
