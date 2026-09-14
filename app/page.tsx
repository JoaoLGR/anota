"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ChevronLeft,
  FileText,
  FolderPlus,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Star,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { Editor } from "@/components/editor";
import { Dialog } from "@/components/dialog";
import type { Folder, Note, View } from "@/lib/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { filterNotes, permanentlyDeleteNote } from "@/lib/note-operations";
import { createId } from "@/lib/id";
import { folderIcons, pastelColors } from "@/lib/types";

const folderIconOptions = folderIcons.map((icon) => ({
  ...icon,
  label: `${icon.value} ${icon.label}`,
}));
const seedFolders: Folder[] = [
  { id: "f1", name: "Faculdade", icon: "📚", color: "#8b5cf6", position: 0 },
  { id: "f2", name: "Projetos", icon: "💡", color: "#a78bfa", position: 1 },
  { id: "f3", name: "Pessoal", icon: "🌿", color: "#34d399", position: 2 },
];
const demoNow = Date.now();
const daysAgo = (days: number) =>
  new Date(demoNow - days * 86400000).toISOString();
const seedNotes: Note[] = [
  {
    id: "n1",
    title: "Comece por aqui",
    content:
      "<h1>Comece por aqui</h1><p>Crie sua primeira anotação e deixe as ideias fluírem.</p><p>O ANOTA salva seu trabalho automaticamente.</p>",
    contentText:
      "Crie sua primeira anotação e deixe as ideias fluírem. O ANOTA salva seu trabalho automaticamente.",
    folderId: null,
    favorite: true,
    pinned: true,
    deletedAt: null,
    updatedAt: new Date(demoNow).toISOString(),
  },
  {
    id: "n2",
    title: "Plano de estudos — Cálculo",
    content:
      "<h2>Objetivo da semana</h2><p>Revisar derivadas, integrais e resolver a lista 4.</p><ul><li>Assistir à aula 8</li><li>Fazer exercícios 1 a 12</li><li>Revisar anotações</li></ul>",
    contentText:
      "Objetivo da semana Revisar derivadas, integrais e resolver a lista 4. Assistir à aula 8 Fazer exercícios 1 a 12 Revisar anotações",
    folderId: "f1",
    color: "#fef3c7",
    favorite: true,
    pinned: false,
    deletedAt: null,
    updatedAt: daysAgo(1),
  },
  {
    id: "n3",
    title: "Ideias para o ANOTA",
    content:
      "<h2>Próximos passos</h2><p>Deixar a captura de ideias ainda mais rápida e agradável.</p><blockquote>Uma boa nota deve ser fácil de criar e fácil de reencontrar.</blockquote>",
    contentText:
      "Próximos passos Deixar a captura de ideias ainda mais rápida e agradável. Uma boa nota deve ser fácil de criar e fácil de reencontrar.",
    folderId: "f2",
    color: "#f3e8ff",
    favorite: false,
    pinned: true,
    deletedAt: null,
    updatedAt: daysAgo(2),
  },
  {
    id: "n4",
    title: "Lista da semana",
    content:
      "<h2>Pessoal</h2><p>Organizar a rotina e reservar um tempo para descanso.</p><ol><li>Fazer compras</li><li>Marcar consulta</li><li>Caminhar no parque</li></ol>",
    contentText:
      "Pessoal Organizar a rotina e reservar um tempo para descanso. Fazer compras Marcar consulta Caminhar no parque",
    folderId: "f3",
    color: "#dcfce7",
    favorite: false,
    pinned: false,
    deletedAt: null,
    updatedAt: daysAgo(3),
  },
  {
    id: "n5",
    title: "Rascunho antigo",
    content: "<p>Uma anotação que foi movida para a lixeira.</p>",
    contentText: "Uma anotação que foi movida para a lixeira.",
    folderId: "f2",
    color: "#dbeafe",
    favorite: false,
    pinned: false,
    deletedAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
];

type DialogState =
  | null
  | { kind: "folder-create" }
  | { kind: "folder-edit"; folder: Folder }
  | { kind: "folder-delete"; folder: Folder }
  | { kind: "note-delete"; noteId: string }
  | { kind: "note-trash"; noteId: string }
  | { kind: "trash-empty" };
const read = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
};

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<View>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [mobileEditor, setMobileEditor] = useState(false);
  const [noteMenuOpen, setNoteMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const restoredSession = useRef(false);
  const goToLogin = useCallback((expired = false) => {
    sessionStorage.setItem(
      "anota-return-state",
      JSON.stringify({ view, selected, mobileEditor }),
    );
    const next = `/?${new URLSearchParams({ view, ...(selected ? { note: selected } : {}) }).toString()}`;
    window.location.href = `/login?${expired ? "expired=1&" : ""}next=${encodeURIComponent(next)}`;
  }, [view, selected, mobileEditor]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (
        window.location.hash.includes("type=invite") ||
        new URLSearchParams(window.location.search).has("code")
      ) {
        window.location.replace(
          `/invite${window.location.search}${window.location.hash}`,
        );
        return;
      }
      if (isSupabaseConfigured && supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/login?expired=1";
          return;
        }
        const folderResult = await supabase
          .from("folders")
          .select("*")
          .order("position");
        const noteResult = await supabase
          .from("notes")
          .select("*")
          .order("updated_at", { ascending: false });
        if (folderResult.error || noteResult.error)
          throw folderResult.error || noteResult.error;
        if (cancelled) return;
        setFolders(
          (folderResult.data || []).map((folder) => ({
            id: folder.id,
            name: folder.name,
            icon: folder.icon,
            color: folder.color,
            position: folder.position ?? 0,
          })),
        );
        setNotes(
          (noteResult.data || []).map((note) => ({
            id: note.id,
            title: note.title,
            content:
              typeof note.content === "object" &&
              note.content !== null &&
              "html" in note.content
                ? (note.content as { html?: string }).html || "<p></p>"
                : "<p></p>",
            contentText: note.content_text,
            folderId: note.folder_id,
            color: note.color,
            favorite: note.is_favorite,
            pinned: note.is_pinned,
            deletedAt: note.deleted_at,
            updatedAt: note.updated_at,
          })),
        );
      } else {
        const localFolders = read("anota-folders", seedFolders);
        const localNotes = read("anota-notes", seedNotes);
        const demo =
          localNotes.length === 1 &&
          localNotes[0].id === "n1" &&
          localFolders.length === 3;
        setFolders(
          (demo ? seedFolders : localFolders)
            .map((folder, index) => ({
              ...folder,
              position: folder.position ?? index,
            }))
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
        );
        setNotes(demo ? seedNotes : localNotes);
      }
      setDark(localStorage.getItem("anota-theme") === "dark");
    }
    void load()
      .catch(() =>
        setError(
          "Não foi possível carregar suas anotações. Verifique a conexão e tente novamente.",
        ),
      )
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") goToLogin(true);
    });
    return () => subscription.unsubscribe();
  }, [goToLogin]);
  useEffect(() => {
    if (ready && !isSupabaseConfigured)
      localStorage.setItem("anota-folders", JSON.stringify(folders));
  }, [folders, ready]);
  useEffect(() => {
    if (ready && !isSupabaseConfigured)
      localStorage.setItem("anota-notes", JSON.stringify(notes));
  }, [notes, ready]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    if (ready) localStorage.setItem("anota-theme", dark ? "dark" : "light");
  }, [dark, ready]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const visible = useMemo(
    () => filterNotes(notes, view, debouncedQuery),
    [notes, view, debouncedQuery],
  );
  const trashCount = useMemo(
    () => notes.filter((note) => Boolean(note.deletedAt)).length,
    [notes],
  );
  const active = notes.find((note) => note.id === selected) || null;
  useEffect(() => {
    if (!ready || restoredSession.current) return;
    restoredSession.current = true;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("anota-return-state") || "null",
      ) as {
        view?: View;
        selected?: string | null;
        mobileEditor?: boolean;
      } | null;
      if (saved?.view) setView(saved.view);
      if (saved?.selected && notes.some((note) => note.id === saved.selected)) {
        setSelected(saved.selected);
        setMobileEditor(Boolean(saved.mobileEditor));
      }
      sessionStorage.removeItem("anota-return-state");
    } catch {
      sessionStorage.removeItem("anota-return-state");
    }
  }, [ready, notes]);
  useEffect(() => {
    if (selected && !visible.some((note) => note.id === selected)) {
      setSelected(null);
      setMobileEditor(false);
    }
  }, [selected, visible]);
  async function updateNote(patch: Partial<Note>) {
    if (!active) return;
    const previous = active;
    const updated = {
      ...active,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setNotes((current) =>
      current.map((note) => (note.id === active.id ? updated : note)),
    );
    if (isSupabaseConfigured && supabase) {
      const { error: updateError } = await supabase
        .from("notes")
        .update({
          title: updated.title,
          content: { html: updated.content },
          content_text: updated.contentText,
          color: updated.color || null,
          folder_id: updated.folderId,
          is_favorite: updated.favorite,
          is_pinned: updated.pinned,
          deleted_at: updated.deletedAt,
          updated_at: updated.updatedAt,
        })
        .eq("id", updated.id);
      if (updateError) {
        setNotes((current) =>
          current.map((note) => (note.id === previous.id ? previous : note)),
        );
        throw updateError;
      }
    }
    if ("favorite" in patch)
      setToast(
        updated.favorite
          ? "Adicionada às favoritas."
          : "Removida das favoritas.",
      );
    if ("pinned" in patch)
      setToast(updated.pinned ? "Anotação fixada." : "Anotação desafixada.");
    if ("folderId" in patch)
      setToast(
        updated.folderId
          ? "Anotação movida para a pasta."
          : "Anotação removida da pasta.",
      );
  }
  async function newNote() {
    const folderId = view.startsWith("folder:") ? view.slice(7) : null;
    let note: Note = {
      id: createId(),
      title: "",
      content: "<p></p>",
      contentText: "",
      folderId,
      color: null,
      favorite: false,
      pinned: false,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sessão expirada. Entre novamente.");
        return;
      }
      const { data, error: insertError } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: "",
          color: null,
          content: { html: "<p></p>" },
          content_text: "",
          folder_id: folderId,
        })
        .select()
        .single();
      if (insertError || !data) {
        setError("Não foi possível criar a anotação.");
        return;
      }
      note = { ...note, id: data.id, updatedAt: data.updated_at };
    }
    setView(folderId ? `folder:${folderId}` : "all");
    setNotes((current) => [note, ...current]);
    setSelected(note.id);
    setMobileEditor(true);
  }
  async function moveFolder(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const reordered = [...folders];
    const sourceIndex = reordered.findIndex((folder) => folder.id === sourceId);
    const targetIndex = reordered.findIndex((folder) => folder.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [source] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, source);
    const positioned = reordered.map((folder, position) => ({
      ...folder,
      position,
    }));
    setFolders(positioned);
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const results = await Promise.all(
        positioned.map((folder) =>
          client
            .from("folders")
            .update({ position: folder.position })
            .eq("id", folder.id),
        ),
      );
      if (results.some((result) => result.error)) {
        setToast("Não foi possível salvar a ordem das pastas.");
        return;
      }
    }
    setToast("Ordem das pastas atualizada.");
  }
  async function submitDialog(values: Record<string, string>) {
    const current = dialog;
    if (!current) return;
    try {
      if (current.kind === "folder-create") {
        const name = values.name?.trim();
        if (!name) return;
        if (isSupabaseConfigured && supabase) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("session");
          const { data, error: insertError } = await supabase
            .from("folders")
            .insert({
              user_id: user.id,
              name,
              icon: values.icon || "📁",
              color: values.color?.trim() || "#8b5cf6",
              position: folders.length,
            })
            .select()
            .single();
          if (insertError || !data) throw insertError || new Error("folder");
          setFolders((items) => [
            ...items,
            {
              id: data.id,
              name: data.name,
              icon: data.icon,
              color: data.color,
              position: items.length,
            },
          ]);
        } else
          setFolders((items) => [
            ...items,
            {
              id: createId(),
              name,
              icon: values.icon || "📁",
              color: values.color?.trim() || "#8b5cf6",
              position: items.length,
            },
          ]);
        setToast("Pasta criada.");
      } else if (current.kind === "folder-edit") {
        const name = values.name?.trim();
        if (!name) return;
        const icon = values.icon?.trim() || current.folder.icon;
        const color = values.color?.trim() || "#8b5cf6";
        if (isSupabaseConfigured && supabase) {
          const { error: updateError } = await supabase
            .from("folders")
            .update({ name, icon, color })
            .eq("id", current.folder.id);
          if (updateError) throw updateError;
        }
        setFolders((items) =>
          items.map((folder) =>
            folder.id === current.folder.id
              ? { ...folder, name, icon, color }
              : folder,
          ),
        );
        setToast("Pasta atualizada.");
      } else if (current.kind === "folder-delete") {
        if (isSupabaseConfigured && supabase) {
          const { error: deleteError } = await supabase
            .from("folders")
            .delete()
            .eq("id", current.folder.id);
          if (deleteError) throw deleteError;
        }
        setFolders((items) =>
          items.filter((folder) => folder.id !== current.folder.id),
        );
        setNotes((items) =>
          items.map((note) =>
            note.folderId === current.folder.id
              ? { ...note, folderId: null }
              : note,
          ),
        );
        if (view === `folder:${current.folder.id}`) setView("all");
        setToast("Pasta excluída. As notas foram mantidas.");
      } else if (current.kind === "note-trash") {
        await updateNote({ deletedAt: new Date().toISOString() });
        setSelected(null);
        setMobileEditor(false);
        setToast("Anotação movida para a lixeira.");
      } else if (current.kind === "note-delete") {
        if (isSupabaseConfigured && supabase) {
          const { error: deleteError } = await supabase
            .from("notes")
            .delete()
            .eq("id", current.noteId);
          if (deleteError) throw deleteError;
        }
        setNotes((items) => permanentlyDeleteNote(items, current.noteId));
        setSelected(null);
        setMobileEditor(false);
        setToast("Anotação excluída definitivamente.");
      } else {
        if (isSupabaseConfigured && supabase && trashCount) {
          const { error: deleteError } = await supabase
            .from("notes")
            .delete()
            .not("deleted_at", "is", null);
          if (deleteError) throw deleteError;
        }
        setNotes((items) => items.filter((note) => !note.deletedAt));
        setSelected(null);
        setMobileEditor(false);
        setToast("Lixeira esvaziada.");
      }
      setDialog(null);
    } catch {
      setToast("Não foi possível concluir essa ação. Tente novamente.");
    }
  }
  if (!ready) return <Loading />;
  if (error) return <ErrorState message={error} />;
  const selectView = (next: View) => {
    setView(next);
    setDrawer(false);
    setNoteMenuOpen(false);
  };
  return (
    <main className="flex min-h-[100dvh] overflow-hidden bg-[#f6f4fa] dark:bg-zinc-950">
      <aside
        className={`${drawer ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-30 flex w-72 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 bg-[#fbfaff] px-5 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] transition-transform dark:border-zinc-800 dark:bg-zinc-900 lg:fixed lg:inset-y-0 lg:left-0 lg:h-screen lg:translate-x-0`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lilac-500 text-white">
              A
            </span>{" "}
            ANOTA
          </div>
          <div className="flex items-center gap-1">
            <button
              className="icon-button"
              onClick={() => setDark(!dark)}
              aria-label="Alternar tema"
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button lg:hidden"
              onClick={() => setDrawer(false)}
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <button
          onClick={() => void newNote()}
          className="mb-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-lilac-500 font-semibold text-white shadow-sm transition hover:bg-lilac-600 focus:outline-none focus:ring-2 focus:ring-lilac-400"
        >
          <Plus size={19} /> Nova anotação
        </button>
        <nav className="space-y-1" aria-label="Navegação das notas">
          <Nav
            icon={<FileText size={18} />}
            label="Todas as notas"
            active={view === "all"}
            onClick={() => selectView("all")}
          />
          <Nav
            icon={<Star size={18} />}
            label="Favoritas"
            active={view === "favorites"}
            onClick={() => selectView("favorites")}
          />
          <Nav
            icon={<Archive size={18} />}
            label="Recentes"
            active={view === "recent"}
            onClick={() => selectView("recent")}
          />
          <Nav
            icon={<Trash2 size={18} />}
            label="Lixeira"
            badge={trashCount}
            active={view === "trash"}
            onClick={() => selectView("trash")}
          />
        </nav>
        <div className="mt-5 flex items-center justify-between px-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <span>Pastas</span>
          <button
            className="icon-button !min-h-8 !min-w-8"
            onClick={() => setDialog({ kind: "folder-create" })}
            aria-label="Nova pasta"
          >
            <FolderPlus size={16} />
          </button>
        </div>
        <div className="mt-2 space-y-1">
          {folders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              active={view === `folder:${folder.id}`}
              onSelect={() => selectView(`folder:${folder.id}`)}
              onRename={() => setDialog({ kind: "folder-edit", folder })}
              onDelete={() => setDialog({ kind: "folder-delete", folder })}
              onMove={moveFolder}
            />
          ))}
        </div>
        <footer className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
          <span>Feito com o ❤️ © 2026</span>
          <button
            className="icon-button"
            onClick={() => {
              if (!window.confirm("Deseja sair do ANOTA?")) return;
              if (supabase) void supabase.auth.signOut();
              goToLogin();
            }}
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={19} />
          </button>
        </footer>
      </aside>
      {drawer && (
        <button
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setDrawer(false)}
          aria-label="Fechar menu"
        />
      )}
      <section
        className={`${mobileEditor ? "hidden min-[900px]:flex" : "flex"} w-full min-w-0 flex-col border-r border-zinc-200 bg-[#fcfbff] dark:border-zinc-800 dark:bg-zinc-900 min-[900px]:w-[330px] lg:ml-72 lg:w-[350px]`}
      >
        <header className="flex items-center gap-3 border-b border-zinc-100 px-5 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] dark:border-zinc-800">
          <button
            className="icon-button lg:hidden"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menu"
          >
            <Menu size={21} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Minhas notas</h1>
            <p className="text-xs text-zinc-400">
              {visible.length} {visible.length === 1 ? "anotação" : "anotações"}
            </p>
          </div>
          {view === "trash" && trashCount > 0 && (
            <button
              className="icon-button ml-auto text-red-500"
              onClick={() => setDialog({ kind: "trash-empty" })}
              aria-label="Esvaziar lixeira"
              title="Esvaziar lixeira"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            className={`icon-button ${view === "trash" && trashCount > 0 ? "" : "ml-auto"}`}
            onClick={() => void newNote()}
            aria-label="Nova anotação"
          >
            <Plus size={21} />
          </button>
        </header>
        <div className="px-4 pb-3 pt-4">
          <label className="flex h-10 items-center gap-2 rounded-xl bg-zinc-100 px-3 text-zinc-400 dark:bg-zinc-800">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar anotações"
              aria-label="Buscar anotações"
              className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
            {query && (
              <button
                type="button"
                className="icon-button !min-h-10 !min-w-10"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
              >
                <X size={15} />
              </button>
            )}
          </label>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-5">
          {visible.length ? (
            visible.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setSelected(note.id);
                  setMobileEditor(true);
                }}
                className={`mb-2 w-full rounded-2xl border border-transparent p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-lilac-400 ${selected === note.id ? "bg-lilac-50 ring-1 ring-lilac-200 dark:bg-lilac-500/15 dark:ring-lilac-500/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
                style={note.color ? { backgroundColor: note.color } : undefined}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`truncate font-semibold ${note.color ? "text-zinc-900" : "dark:text-zinc-100"}`}
                  >
                    {note.title || "Sem título"}
                  </span>
                  {note.pinned && (
                    <Pin size={14} className="shrink-0 text-lilac-500" />
                  )}
                  {note.favorite && (
                    <Star
                      size={14}
                      className="shrink-0 fill-amber-400 text-amber-400"
                    />
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                  {note.contentText || "Comece a escrever..."}
                </p>
                <p className="mt-3 text-xs text-zinc-400">
                  {view === "trash" && note.deletedAt
                    ? `Excluída em ${new Date(note.deletedAt).toLocaleDateString("pt-BR")}`
                    : new Date(note.updatedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                </p>
              </button>
            ))
          ) : (
            <div className="px-4 py-16 text-center">
              <FileText className="mx-auto mb-3 text-lilac-400" size={32} />
              <p className="font-medium">
                {query
                  ? "Nenhuma anotação encontrada"
                  : view === "trash"
                    ? "Sua lixeira está vazia"
                    : view === "favorites"
                      ? "Nenhuma nota favorita"
                      : view === "recent"
                        ? "Nenhuma nota recente"
                        : view.startsWith("folder:")
                          ? "Nenhuma nota nesta pasta"
                          : "Nenhuma anotação encontrada"}
              </p>
              {!query && view !== "trash" && (
                <button
                  onClick={() => void newNote()}
                  className="mt-4 rounded-xl bg-lilac-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Criar anotação
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      <section
        className={`${mobileEditor ? "flex" : "hidden min-[900px]:flex"} min-w-0 flex-1 flex-col bg-[#fdfcff] dark:bg-zinc-950`}
      >
        <header className="relative flex min-h-[73px] shrink-0 items-center gap-3 border-b border-zinc-100 px-5 pt-[env(safe-area-inset-top)] dark:border-zinc-800">
          <button
            className="icon-button min-[900px]:hidden"
            onClick={() => setMobileEditor(false)}
            aria-label="Voltar para notas"
          >
            <ChevronLeft size={22} />
          </button>
          {active ? (
            <>
              <span className="truncate text-sm text-zinc-400">
                {folders.find((folder) => folder.id === active.folderId)
                  ?.name || "Sem pasta"}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <select
                  aria-label="Pasta da anotação"
                  value={active.folderId || ""}
                  onChange={(event) =>
                    void updateNote({ folderId: event.target.value || null })
                  }
                  className="hidden max-w-32 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-500 sm:block dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">Sem pasta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.icon} {folder.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Cor da nota"
                  value={active.color || ""}
                  onChange={(event) =>
                    void updateNote({ color: event.target.value || null })
                  }
                  className="hidden max-w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-500 sm:block dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {pastelColors.map((color) => (
                    <option key={color.value || "default"} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
                <button
                  className={`icon-button ${active.favorite ? "text-amber-500" : ""}`}
                  onClick={() =>
                    void updateNote({ favorite: !active.favorite })
                  }
                  aria-label="Alternar favorito"
                >
                  <Star
                    size={19}
                    fill={active.favorite ? "currentColor" : "none"}
                  />
                </button>
                <button
                  className={`icon-button ${active.pinned ? "text-lilac-500" : ""}`}
                  onClick={() => void updateNote({ pinned: !active.pinned })}
                  aria-label="Alternar fixação"
                >
                  <Pin
                    size={19}
                    fill={active.pinned ? "currentColor" : "none"}
                  />
                </button>
                {view === "trash" ? (
                  <>
                    <button
                      className="icon-button text-emerald-500"
                      onClick={() => {
                        void updateNote({ deletedAt: null })
                          .then(() => {
                            setView("all");
                            setToast("Anotação restaurada.");
                          })
                          .catch(() =>
                            setToast("Não foi possível restaurar a anotação."),
                          );
                      }}
                      aria-label="Restaurar nota"
                    >
                      <Archive size={19} />
                    </button>
                    <button
                      className="icon-button text-red-500"
                      onClick={() =>
                        setDialog({ kind: "note-delete", noteId: active.id })
                      }
                      aria-label="Excluir definitivamente"
                    >
                      <Trash2 size={19} />
                    </button>
                  </>
                ) : (
                  <button
                    className="icon-button"
                    onClick={() =>
                      setDialog({ kind: "note-trash", noteId: active.id })
                    }
                    aria-label="Mover para lixeira"
                  >
                    <Trash2 size={19} />
                  </button>
                )}
                <button
                  className="icon-button"
                  onClick={() => setNoteMenuOpen((open) => !open)}
                  aria-label="Mais opções"
                  aria-expanded={noteMenuOpen}
                >
                  <MoreHorizontal size={19} />
                </button>
                {noteMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-5 top-16 z-20 min-w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {view === "trash" ? (
                      <>
                        <button
                          role="menuitem"
                          className="menu-item"
                          onClick={() => {
                            setNoteMenuOpen(false);
                            void updateNote({ deletedAt: null }).then(() => {
                              setView("all");
                              setToast("Anotação restaurada.");
                            });
                          }}
                        >
                          Restaurar nota
                        </button>
                        <button
                          role="menuitem"
                          className="menu-item text-red-600"
                          onClick={() => {
                            setNoteMenuOpen(false);
                            setDialog({
                              kind: "note-delete",
                              noteId: active.id,
                            });
                          }}
                        >
                          Excluir definitivamente
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 px-3 py-2 sm:hidden">
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            Pasta da anotação
                            <select
                              aria-label="Pasta da anotação no celular"
                              value={active.folderId || ""}
                              onChange={(event) =>
                                void updateNote({
                                  folderId: event.target.value || null,
                                })
                              }
                              className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-lilac-400 focus:ring-2 focus:ring-lilac-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                            >
                              <option value="">Sem pasta</option>
                              {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.icon} {folder.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            Cor da nota
                            <select
                              aria-label="Cor da nota no celular"
                              value={active.color || ""}
                              onChange={(event) =>
                                void updateNote({
                                  color: event.target.value || null,
                                })
                              }
                              className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-lilac-400 focus:ring-2 focus:ring-lilac-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                            >
                              {pastelColors.map((color) => (
                                <option key={color.value || "default"} value={color.value}>
                                  {color.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <button
                          role="menuitem"
                          className="menu-item"
                          onClick={() => {
                            setNoteMenuOpen(false);
                            void updateNote({ color: null });
                          }}
                        >
                          Remover cor da nota
                        </button>
                        <button
                          role="menuitem"
                          className="menu-item text-red-600"
                          onClick={() => {
                            setNoteMenuOpen(false);
                            setDialog({
                              kind: "note-trash",
                              noteId: active.id,
                            });
                          }}
                        >
                          Mover para a lixeira
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="ml-auto text-sm text-zinc-400">
              Selecione uma anotação para editar
            </div>
          )}
        </header>
        {active && (
          <Editor key={active.id} note={active} onChange={updateNote} />
        )}
      </section>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-[60] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900"
        >
          {toast}
        </div>
      )}
      {dialog && (
        <Dialog
          title={
            dialog.kind === "folder-create"
              ? "Nova pasta"
              : dialog.kind === "folder-edit"
                ? "Editar pasta"
                : dialog.kind === "folder-delete"
                  ? "Excluir pasta"
                  : dialog.kind === "note-trash"
                    ? "Mover para a lixeira"
                    : dialog.kind === "trash-empty"
                      ? "Esvaziar lixeira"
                      : "Excluir anotação definitivamente"
          }
          description={
            dialog.kind === "folder-delete"
              ? "As notas desta pasta serão mantidas sem pasta."
              : dialog.kind === "note-trash"
                ? "A anotação poderá ser restaurada pela lixeira."
                : dialog.kind === "trash-empty"
                  ? `As ${trashCount} anotações serão excluídas definitivamente. Esta ação não pode ser desfeita.`
                  : dialog.kind === "note-delete"
                    ? "Esta anotação será excluída definitivamente e não poderá ser recuperada."
                    : dialog.kind === "folder-edit"
                      ? "Atualize os dados da pasta."
                      : "Dê um nome para organizar suas anotações."
          }
          fields={
            dialog.kind === "folder-create"
              ? [
                  {
                    name: "name",
                    label: "Nome",
                    value: "",
                    placeholder: "Ex.: Faculdade",
                  },
                  {
                    name: "icon",
                    label: "Ícone",
                    value: "📁",
                    options: folderIconOptions,
                  },
                  {
                    name: "color",
                    label: "Cor pastel",
                    value: "",
                    options: pastelColors,
                  },
                ]
              : dialog.kind === "folder-edit"
                ? [
                    { name: "name", label: "Nome", value: dialog.folder.name },
                    {
                      name: "icon",
                      label: "Ícone",
                      value: dialog.folder.icon,
                      options: folderIconOptions,
                    },
                    {
                      name: "color",
                      label: "Cor pastel",
                      value: dialog.folder.color,
                      options: pastelColors,
                    },
                  ]
                : []
          }
          confirmLabel={
            dialog.kind === "folder-delete" || dialog.kind === "note-trash"
              ? "Mover para a lixeira"
              : dialog.kind === "trash-empty" || dialog.kind === "note-delete"
                ? "Excluir definitivamente"
                : "Salvar"
          }
          danger={
            dialog.kind === "folder-delete" ||
            dialog.kind === "note-trash" ||
            dialog.kind === "trash-empty" ||
            dialog.kind === "note-delete"
          }
          onCancel={() => setDialog(null)}
          onSubmit={submitDialog}
        />
      )}
    </main>
  );
}

function Nav({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-lilac-400 ${active ? "bg-lilac-50 font-semibold text-lilac-700 dark:bg-lilac-500/15 dark:text-lilac-300" : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined ? (
        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
function FolderRow({
  folder,
  active,
  onSelect,
  onRename,
  onDelete,
  onMove,
}: {
  folder: Folder;
  active: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (sourceId: string, targetId: string) => void;
}) {
  return (
    <div
      className="flex w-full items-center gap-1"
      draggable
      onDragStart={(event) =>
        event.dataTransfer.setData("text/plain", folder.id)
      }
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onMove(event.dataTransfer.getData("text/plain"), folder.id);
      }}
      title="Arraste para reordenar"
    >
      <div
        className="min-w-0 flex-1 rounded-xl"
        style={folder.color ? { backgroundColor: folder.color } : undefined}
      >
        <Nav
          icon={
            <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs">
              {folder.icon}
            </span>
          }
          label={folder.name}
          active={active}
          onClick={onSelect}
        />
      </div>
      <button
        className="icon-button !min-h-10 !min-w-10"
        onClick={onRename}
        aria-label={`Editar ${folder.name}`}
      >
        <MoreHorizontal size={15} />
      </button>
      <button
        className="icon-button !min-h-10 !min-w-10 text-red-400"
        onClick={onDelete}
        aria-label={`Excluir ${folder.name}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
function ErrorState({ message }: { message: string }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f6f4fa] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] dark:bg-zinc-950">
      <div className="max-w-sm rounded-2xl border border-red-200 bg-white p-6 text-center dark:border-red-900 dark:bg-zinc-900">
        <p className="font-semibold text-red-600">Algo deu errado</p>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-lilac-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
function Loading() {
  return (
    <main className="flex min-h-[100dvh] bg-[#f6f4fa] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] dark:bg-zinc-950">
      <div className="flex w-full flex-col gap-4 p-4">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        <p className="text-sm text-zinc-400">Carregando suas anotações...</p>
      </div>
    </main>
  );
}
