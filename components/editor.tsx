"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  CheckSquare,
  CircleAlert,
  CircleCheck,
  CloudOff,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LoaderCircle,
  Minus,
  MoreHorizontal,
  Quote,
  Redo2,
  Undo2,
  Underline as UnderlineIcon,
} from "lucide-react";
import { createDebouncedSaver } from "@/lib/autosave";
import { Dialog } from "@/components/dialog";
import type { Note } from "@/lib/types";

type EditorProps = {
  note: Note;
  autoFocus?: boolean;
  onAutoFocus?: () => void;
  onChange: (patch: Partial<Note>) =>
    | void
    | Promise<"synced" | "queued">;
};

export function Editor({ note, onChange, autoFocus = false, onAutoFocus }: EditorProps) {
  const onChangeRef = useRef(onChange);
  const didAutoFocus = useRef(false);
  onChangeRef.current = onChange;
  const [moreOpen, setMoreOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "queued" | "error"
  >("idle");
  const [title, setTitle] = useState(note.title);
  const saver = useRef(
    createDebouncedSaver<Note>(async (changes) => {
      try {
        const result = await onChangeRef.current(changes);
        setSaveState(result === "queued" ? "queued" : "saved");
      } catch {
        setSaveState("error");
        throw new Error("Não foi possível salvar a anotação.");
      }
    }, 800),
  );
  const schedule = (patch: Partial<Note>) => {
    setSaveState("saving");
    saver.current.schedule(patch);
  };
  const retrySave = () => {
    setSaveState("saving");
    void saver.current.retry().catch(() => setSaveState("error"));
  };
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Comece a escrever sua anotação...",
      }),
    ],
    editorProps: { attributes: { lang: "pt-BR", spellcheck: "true" } },
    content: note.content,
    onUpdate: ({ editor: currentEditor }) =>
      schedule({
        content: currentEditor.getHTML(),
        contentText: currentEditor.getText(),
      }),
    immediatelyRender: false,
  });
  useEffect(() => {
    setTitle(note.title);
  }, [note.id, note.title]);
  useEffect(() => {
    if (editor && !editor.isFocused && editor.getHTML() !== note.content)
      editor.commands.setContent(note.content);
  }, [editor, note.id, note.content]);
  useEffect(() => {
    if (!editor || !autoFocus || didAutoFocus.current) return;
    didAutoFocus.current = true;
    editor.commands.focus();
    onAutoFocus?.();
  }, [editor, autoFocus, onAutoFocus]);
  useEffect(
    () => () => {
      void saver.current.flush().catch(() => undefined);
    },
    [],
  );
  if (!editor) return null;

  const extraTools = (
    <>
      <Tool
        label="Inserir checklist"
        onClick={() => {
          editor.chain().focus().insertContent("☐ ").run();
        }}
      >
        <CheckSquare size={17} />
      </Tool>
      <Tool
        label="Citação"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote size={17} />
      </Tool>
      <Tool
        label="Linha horizontal"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={17} />
      </Tool>
      <Tool label="Link" onClick={() => setLinkOpen(true)}>
        <LinkIcon size={17} />
      </Tool>
    </>
  );

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div
        role="toolbar"
        aria-label="Ferramentas de formatação"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-zinc-100 bg-[#fdfcff]/95 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"
      >
        <Tool
          label="Desfazer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 size={17} />
        </Tool>
        <Tool
          label="Refazer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 size={17} />
        </Tool>
        <span className="mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-zinc-700 sm:inline-block" />
        <span className="mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-zinc-700 sm:inline-block" />
        <Tool
          label="Negrito"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold size={17} />
        </Tool>
        <Tool
          label="Itálico"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic size={17} />
        </Tool>
        <Tool
          label="Sublinhado"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon size={17} />
        </Tool>
        <div className="hidden items-center gap-1 sm:contents">
        <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <Tool
          label="Título 1"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 size={17} />
        </Tool>
        <Tool
          label="Título 2"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 size={17} />
        </Tool>
        <Tool
          label="Título 3"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 size={17} />
        </Tool>
        <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <Tool
          label="Lista"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List size={17} />
        </Tool>
        <span className="hidden sm:contents">
        <Tool
          label="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered size={17} />
        </Tool>
        </span>
        <button
          type="button"
          className="icon-button sm:hidden"
          onClick={() => setMoreOpen((open) => !open)}
          aria-label="Mais ferramentas"
          aria-expanded={moreOpen}
          title="Mais ferramentas"
        >
          <MoreHorizontal size={17} />
        </button>
        <div
          className={
            moreOpen
              ? "flex flex-wrap items-center gap-1 sm:contents"
              : "hidden sm:contents"
          }
        >
          {extraTools}
        </div>
        <span
          role="status"
          aria-live="polite"
          data-save-state={saveState}
          className={`order-last flex w-full items-center justify-end gap-1 border-t border-zinc-100 pt-1 text-xs sm:order-none sm:ml-auto sm:w-auto sm:border-0 sm:pt-0 ${saveState === "error" ? "text-red-500" : saveState === "saved" ? "text-emerald-600" : "text-zinc-400"}`}
        >
          {saveState === "saving" && <LoaderCircle size={13} className="animate-spin" />}
          {saveState === "error" && <CircleAlert size={13} />}
          {saveState === "saved" && <CircleCheck size={13} />}
          {saveState === "queued" && <CloudOff size={13} />}
          {saveState === "saving"
            ? "Salvando..."
            : saveState === "error"
              ? "Erro ao salvar"
              : saveState === "saved"
                ? "Salvo ✓"
                : saveState === "queued"
                  ? "Salvo no dispositivo"
                : "Pronto para editar"}
          {saveState === "error" && (
            <button
              type="button"
              className="ml-1 rounded-md px-2 py-1 font-semibold text-red-600 underline underline-offset-2 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
              onClick={retrySave}
              aria-label="Tentar salvar novamente"
            >
              Tentar novamente
            </button>
          )}
        </span>
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 pb-24 pt-6 sm:px-10 sm:pt-8">
        <div className="border-b border-zinc-200/80 pb-4 dark:border-zinc-700/80">
          <input
            lang="pt-BR"
            spellCheck
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              schedule({ title: event.target.value });
            }}
            placeholder="Sem título"
            aria-label="Título da anotação"
            className="w-full bg-transparent text-3xl font-bold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-zinc-50 dark:placeholder:text-zinc-700"
          />
        </div>
        <div className="pt-5">
          <EditorContent editor={editor} />
        </div>
      </div>
      {linkOpen && (
        <Dialog
          title="Adicionar link"
          description="Cole o endereço que será associado ao texto selecionado."
          fields={[
            {
              name: "href",
              label: "URL",
              value: "",
              placeholder: "https://exemplo.com",
            },
          ]}
          confirmLabel="Adicionar"
          onCancel={() => setLinkOpen(false)}
          onSubmit={(values) => {
            const href = values.href?.trim();
            if (href) editor.chain().focus().setLink({ href }).run();
            setLinkOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Tool({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={
        "icon-button !min-h-10 !min-w-10 " +
        (active
          ? "bg-lilac-100 text-lilac-700 dark:bg-lilac-500/20 dark:text-lilac-300"
          : "") +
        " disabled:opacity-30"
      }
    >
      {children}
    </button>
  );
}
