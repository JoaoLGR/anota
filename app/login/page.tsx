"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, FileText, Loader2, Moon, Sun } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAuthErrorMessage, getSafeNext } from "@/lib/auth-ui";

type Mode = "login" | "forgot" | "reset";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState("/");

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      localStorage.getItem("anota-theme") === "dark",
    );
    const params = new URLSearchParams(window.location.search);
    setNext(getSafeNext(params.get("next")));
    if (params.get("expired") === "1")
      setMessage("Sua sessão expirou. Entre novamente para continuar.");
    if (params.get("reset") === "1") setMode("reset");
    if (window.location.hash.includes("type=invite") || params.has("code"))
      window.location.replace(
        `/invite${window.location.search}${window.location.hash}`,
      );
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    if (!supabase) {
      setError("O acesso ainda não está configurado neste ambiente.");
      setLoading(false);
      return;
    }
    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/login?reset=1&next=${encodeURIComponent(next)}`,
        },
      );
      if (resetError) setError(getAuthErrorMessage(resetError));
      else
        setMessage(
          "Se existir uma conta para este e-mail, enviaremos um link para redefinir sua senha.",
        );
    } else if (mode === "reset") {
      if (password.length < 6)
        setError("A senha precisa ter pelo menos 6 caracteres.");
      else {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) setError(getAuthErrorMessage(updateError));
        else {
          setMessage("Senha atualizada com sucesso.");
          setMode("login");
          setPassword("");
        }
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) setError(getAuthErrorMessage(authError));
      else window.location.assign(next);
    }
    setLoading(false);
  }

  const title =
    mode === "forgot"
      ? "Recuperar acesso"
      : mode === "reset"
        ? "Criar nova senha"
        : "Bem-vindo ao ANOTA";
  const description =
    mode === "forgot"
      ? "Enviaremos um link para o seu e-mail."
      : mode === "reset"
        ? "Escolha uma senha nova para continuar."
        : "Entre para acessar suas anotações.";
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#fafafc] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac-500 text-white">
            <FileText size={28} />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{description}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            E-mail
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-3 outline-none focus:ring-2 focus:ring-lilac-400 dark:border-zinc-700"
            />
          </label>
          {mode !== "forgot" && (
            <label className="block text-sm font-medium">
              {mode === "reset" ? "Nova senha" : "Senha"}
              <span className="relative mt-2 block">
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={
                    mode === "reset" ? "new-password" : "current-password"
                  }
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-3 pr-12 outline-none focus:ring-2 focus:ring-lilac-400 dark:border-zinc-700"
                />
                <button
                  type="button"
                  className="icon-button absolute right-1 top-1 !min-h-9 !min-w-9"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-emerald-600">
              {message}
            </p>
          )}
          <button
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lilac-500 font-semibold text-white hover:bg-lilac-600 disabled:opacity-60"
          >
            {loading && <Loader2 size={17} className="animate-spin" />}
            {mode === "forgot"
              ? "Enviar link"
              : mode === "reset"
                ? "Atualizar senha"
                : "Entrar"}
          </button>
        </form>
        <div className="mt-5 text-center text-sm">
          {mode === "login" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setMessage("");
                }}
                className="text-lilac-600 hover:underline dark:text-lilac-300"
              >
                Esqueci minha senha
              </button>
              <p className="mt-3 text-zinc-400">Acesso somente por convite.</p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className="text-lilac-600 hover:underline dark:text-lilac-300"
            >
              Voltar para o login
            </button>
          )}
        </div>
        <div className="mt-6 flex justify-center gap-2 text-xs text-zinc-400">
          <Sun size={14} /> Tema controlado na aplicação <Moon size={14} />
        </div>
      </div>
    </main>
  );
}
