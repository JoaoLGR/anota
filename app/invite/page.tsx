"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileText, Loader2, Moon, Sun } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function InvitePage() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", localStorage.getItem("anota-theme") === "dark");
    async function loadInvite() {
      if (!supabase) { setReady(true); return; }
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) await supabase.auth.exchangeCodeForSession(code);
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(Boolean(session));
      setReady(true);
    }
    void loadInvite().catch(() => { setError("Este convite é inválido ou expirou."); setReady(true); });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !hasSession) { setError("Este convite é inválido ou expirou."); return; }
    if (password.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (password !== confirmation) { setError("As senhas não coincidem."); return; }
    setLoading(true); setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError("Não foi possível criar sua senha. Tente abrir o convite novamente.");
    else { setSuccess(true); window.setTimeout(() => { window.location.href = "/"; }, 900); }
    setLoading(false);
  }

  if (!ready) return <main className="flex min-h-[100dvh] items-center justify-center bg-[#fafafc] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] dark:bg-zinc-950"><Loader2 className="animate-spin text-lilac-500"/></main>;
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#fafafc] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] dark:bg-zinc-950"><div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac-500 text-white"><FileText size={28}/></div><h1 className="text-2xl font-bold">Criar senha no ANOTA</h1><p className="mt-2 text-sm text-zinc-500">Defina sua senha para aceitar o convite.</p></div>{hasSession?<form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Nova senha<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-3 outline-none focus:ring-2 focus:ring-lilac-400 dark:border-zinc-700"/></label><label className="block text-sm font-medium">Confirmar senha<input required minLength={6} type="password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-3 outline-none focus:ring-2 focus:ring-lilac-400 dark:border-zinc-700"/></label>{error&&<p role="alert" className="text-sm text-red-500">{error}</p>}{success&&<p role="status" className="text-sm text-emerald-600">Senha criada. Abrindo suas anotações...</p>}<button disabled={loading||success} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lilac-500 font-semibold text-white hover:bg-lilac-600 disabled:opacity-60">{loading&&<Loader2 size={17} className="animate-spin"/>}Aceitar convite</button></form>:<div className="text-center"><p role="alert" className="text-sm text-red-500">{error||"Este convite é inválido ou expirou."}</p><a href="/login" className="mt-5 inline-block text-sm text-lilac-600 hover:underline dark:text-lilac-300">Voltar para o login</a></div>}<div className="mt-6 flex justify-center gap-2 text-xs text-zinc-400"><Sun size={14}/> Tema controlado na aplicação <Moon size={14}/></div></div></main>;
}
