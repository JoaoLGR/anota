import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, getSafeNext } from "../lib/auth-ui";

describe("contratos de autenticação", () => {
  it("preserva somente destinos internos seguros", () => {
    expect(getSafeNext("/notas?folder=estudos")).toBe("/notas?folder=estudos");
    expect(getSafeNext("https://site-malicioso.test")).toBe("/");
    expect(getSafeNext("//site-malicioso.test")).toBe("/");
  });

  it("retorna mensagens específicas para erros conhecidos", () => {
    expect(getAuthErrorMessage({ code: "invalid_credentials" })).toBe(
      "E-mail ou senha inválidos.",
    );
    expect(getAuthErrorMessage({ status: 429 })).toContain("Muitas tentativas");
    expect(getAuthErrorMessage({ code: "email_not_confirmed" })).toContain(
      "Confirme seu e-mail",
    );
    expect(
      getAuthErrorMessage({ message: "Network request failed" }),
    ).toContain("conectar");
  });
});
