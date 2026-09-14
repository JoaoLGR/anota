import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  readFileSync(resolve(process.cwd(), file), "utf8");

describe("fluxos da aplicação", () => {
  const home = source("app/page.tsx");
  const login = source("app/login/page.tsx");
  const invite = source("app/invite/page.tsx");
  const dialog = source("components/dialog.tsx");
  const layout = source("app/layout.tsx");
  const styles = source("app/globals.css");

  it("mantém os fluxos de criação/edição e troca rápida entre notas", () => {
    expect(home).toContain("async function newNote");
    expect(home).toContain("async function updateNote");
    expect(home).toContain("key={active.id}");
    expect(home).toContain("setSelected(note.id)");
  });

  it("mantém os fluxos de exclusão, restauração e falha de persistência", () => {
    expect(home).toContain('kind: "note-trash"');
    expect(home).toContain('kind: "note-delete"');
    expect(home).toContain('kind: "trash-empty"');
    expect(home).toContain('kind: "logout"');
    expect(home).toContain("Não foi possível concluir essa ação");
    expect(source("components/editor.tsx")).toContain('saveState === "error"');
  });

  it("cobre autenticação e convite", () => {
    expect(login).toContain("signInWithPassword");
    expect(login).toContain("resetPasswordForEmail");
    expect(login).toContain("Mostrar senha");
    expect(login).toContain("window.location.assign(next)");
    expect(invite).toContain("exchangeCodeForSession");
    expect(invite).toContain("updateUser");
    expect(home).toContain('onClick={() => setDialog({ kind: "logout" })}');
    expect(home).not.toContain("window.confirm");
    expect(home).toContain("expired=1");
  });

  it("preserva contratos responsivos e de acessibilidade", () => {
    expect(home).toContain("min-[900px]:hidden");
    expect(home).toContain("min-[900px]:flex");
    expect(home).toContain("min-h-[100dvh]");
    expect(layout).toContain('viewportFit: "cover"');
    expect(styles).toContain("100dvh");
    expect(dialog).toContain("max-h-[calc(100dvh-2rem)]");
    expect(source("components/editor.tsx")).toContain('data-save-state={saveState}');
    expect(home).toContain("lg:translate-x-0");
    expect(home).toContain('aria-label="Pasta da anotação no celular"');
    expect(home).toContain('aria-label="Cor da nota no celular"');
    expect(home).toContain("!min-h-10 !min-w-10");
    expect(home).toContain('aria-current={active ? "page" : undefined}');
    expect(dialog).toContain('role={danger ? "alertdialog" : "dialog"}');
    expect(dialog).toContain('aria-describedby="dialog-description"');
    expect(dialog).toContain('event.key === "Escape"');
    expect(dialog).toContain("overflow-y-auto");
    expect(login).toContain("min-h-[100dvh]");
    expect(invite).toContain("min-h-[100dvh]");
  });
});
