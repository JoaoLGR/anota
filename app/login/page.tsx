"use client";
import { FormEvent, useEffect, useState } from "react";
import { FileText, Loader2, Moon, Sun } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  useEffect(()=>{document.documentElement.classList.toggle("dark",localStorage.getItem("anota-theme")==="dark")},[]);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (!supabase) { setError("Configure o Supabase para entrar."); return; } setLoading(true); setError(""); const { error: authError } = await supabase.auth.signInWithPassword({ email, password }); if (authError) setError("E-mail ou senha inválidos."); else window.location.href = "/"; setLoading(false); }
  return <main className="flex min-h-screen items-center justify-center bg-[#fafafc] px-5 dark:bg-zinc-950"><div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac-500 text-white"><FileText size={28}/></div><h1 className="text-2xl font-bold">Bem-vindo ao ANOTA</h1><p className="mt-2 text-sm text-zinc-500">Entre para acessar suas anotações.</p></div><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-3 outline-none focus:ring-2 focus:ring-lilac-400 dark:border-zinc-700"/></label><label className="block text-sm font-medium">Senha<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-3 outline-none focus:ring-2 focus:ring-lilac-400 dark:border-zinc-700"/></label>{error&&<p role="alert" className="text-sm text-red-500">{error}</p>}<button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lilac-500 font-semibold text-white hover:bg-lilac-600 disabled:opacity-60">{loading&&<Loader2 size={17} className="animate-spin"/>}Entrar</button></form><div className="mt-6 flex justify-center gap-2 text-xs text-zinc-400"><Sun size={14}/> Tema controlado na aplicação <Moon size={14}/></div></div></main>;
}


