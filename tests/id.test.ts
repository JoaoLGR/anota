import { describe, expect, it, vi } from "vitest";
import { createId } from "../lib/id";

describe("createId", () => {
  it("usa UUID quando o navegador oferece a API", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-de-teste" });
    expect(createId()).toBe("uuid-de-teste");
    vi.unstubAllGlobals();
  });

  it("gera um identificador compatível sem randomUUID", () => {
    vi.stubGlobal("crypto", {});
    expect(createId()).toMatch(/^local-\d+-[a-z0-9]+$/);
    vi.unstubAllGlobals();
  });
});
