import { describe, expect, it } from "vitest";
import {
  createNote,
  deleteFolderFromState,
  filterNotes,
  moveNoteToTrash,
  permanentlyDeleteNote,
  reorderFolders,
  restoreNote,
  updateNote,
} from "../lib/note-operations";
import type { Note } from "../lib/types";

const notes: Note[] = [
  {
    id: "active",
    title: "Ativa",
    content: "",
    contentText: "conteúdo importante",
    folderId: null,
    favorite: false,
    pinned: false,
    deletedAt: null,
    updatedAt: "2026-09-12T10:00:00Z",
  },
  {
    id: "trash",
    title: "Excluída",
    content: "",
    contentText: "",
    folderId: null,
    favorite: false,
    pinned: false,
    deletedAt: "2026-09-12T11:00:00Z",
    updatedAt: "2026-09-12T11:00:00Z",
  },
];

describe("operações de notas", () => {
  it("mantém notas ativas fora da lixeira e notas excluídas dentro dela", () => {
    expect(filterNotes(notes, "all", "").map((note) => note.id)).toEqual([
      "active",
    ]);
    expect(filterNotes(notes, "trash", "").map((note) => note.id)).toEqual([
      "trash",
    ]);
  });

  it("busca no conteúdo textual e remove definitivamente apenas a nota escolhida", () => {
    expect(
      filterNotes(notes, "all", "IMPORTANTE").map((note) => note.id),
    ).toEqual(["active"]);
    expect(
      permanentlyDeleteNote(notes, "trash").map((note) => note.id),
    ).toEqual(["active"]);
  });

  it("busca sem diferenciar acentos e filtra notas recentes", () => {
    const recent = {
      ...notes[0],
      title: "Reunião de amanhã",
      updatedAt: new Date().toISOString(),
    };
    const old = {
      ...notes[0],
      id: "old",
      title: "Reunião antiga",
      updatedAt: "2020-01-01T10:00:00Z",
    };
    expect(
      filterNotes([recent, old], "all", "reuniao").map((note) => note.id),
    ).toEqual(["active", "old"]);
    expect(
      filterNotes([recent, old], "recent", "").map((note) => note.id),
    ).toEqual(["active"]);
  });

  it("cobre criação, edição, lixeira e restauração de notas", () => {
    const created = { ...notes[0], id: "created", title: "Nova" };
    const withCreated = createNote(notes, created);
    expect(withCreated[0]).toEqual(created);
    expect(
      updateNote(withCreated, "created", { title: "Editada" })[0].title,
    ).toBe("Editada");
    expect(
      moveNoteToTrash(withCreated, "created", "2026-09-14T12:00:00Z").find(
        (note) => note.id === "created",
      )?.deletedAt,
    ).toBe("2026-09-14T12:00:00Z");
    expect(
      restoreNote(moveNoteToTrash(withCreated, "created"), "created").find(
        (note) => note.id === "created",
      )?.deletedAt,
    ).toBeNull();
  });

  it("cobre criação/exclusão de pastas e ordenação por position", () => {
    const folders: { id: string; position?: number }[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(
      reorderFolders(folders, "c", "a").map((folder) => folder.id),
    ).toEqual(["c", "a", "b"]);
    expect(
      reorderFolders(folders, "c", "a").map((folder) => folder.position),
    ).toEqual([0, 1, 2]);
    const result = deleteFolderFromState(
      folders,
      [{ ...notes[0], folderId: "b" }],
      "b",
    );
    expect(result.folders.map((folder) => folder.id)).toEqual(["a", "c"]);
    expect(result.notes[0].folderId).toBeNull();
  });
});
