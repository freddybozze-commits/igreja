# Configurar o Supabase

1. Crie um projeto em `supabase.com`.
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase.sql` desta pasta e clique em **Run**.
3. Em **Project Settings > API**, copie a URL do projeto e a chave **anon/public**.
4. No frontend da Vercel, crie `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY` em **Settings > Environment Variables**.
5. Para desenvolvimento local, coloque os valores em `../frontend/.env` e execute `npm run build` dentro de `frontend`.
6. Em **Authentication > URL Configuration**, informe a URL HTTPS onde o PWA será publicado.
7. Em **Authentication > Providers > Email**, escolha se o usuário precisa confirmar o e-mail antes de entrar.

Nunca coloque a chave `service_role` no aplicativo. Ela tem acesso administrativo e deve permanecer secreta.

O PWA funciona em modo demonstração sem essas credenciais. Depois de configurado, cadastro, login, perfil e pedidos de oração usam o Supabase.
