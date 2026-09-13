# ANOTA

Sistema pessoal de anotações com Next.js, TypeScript, Tailwind, Tiptap e Supabase.

## Rodar localmente

1. Instale Node.js 20+ e execute `npm install`.
2. Copie `.env.example` para `.env.local` e preencha as variáveis públicas do Supabase quando quiser conectar o backend.
3. Execute `npm run dev`.

Sem variáveis do Supabase, o modo local com `localStorage` fica disponível apenas durante o desenvolvimento. Em produção, a aplicação exige Supabase configurado e exibe uma mensagem de configuração caso as variáveis estejam ausentes. Com as variáveis configuradas, o middleware exige sessão autenticada, a tela `/login` usa Supabase Auth e os dados são carregados/salvos no PostgreSQL. Para ativar a persistência multi-dispositivo, crie um projeto Supabase, execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor e configure as URLs de redirecionamento para `http://localhost:3000` e o domínio da Vercel.

## Verificações e deploy

`npm test`, `npm run lint`, `npm run typecheck` e `npm run build` validam a aplicação. Os testes cobrem o debounce do autosave e as operações essenciais da lixeira. Na Vercel, configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas variáveis do projeto. No Supabase Auth, adicione a URL da aplicação e a URL de produção em Authentication → URL Configuration. O middleware direciona usuários sem sessão para `/login`.

O projeto não contém service role key. A chave usada no navegador é somente a anon key, e as políticas RLS em [`supabase/schema.sql`](supabase/schema.sql) limitam cada registro ao usuário autenticado.
