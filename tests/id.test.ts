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
    expect(createId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    vi.unstubAllGlobals();
  });
});
