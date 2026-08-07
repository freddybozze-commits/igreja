# Configurar o Supabase

1. Crie um projeto em `supabase.com`.
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase.sql` desta pasta e clique em **Run**.
3. Em **Project Settings > API**, copie a URL do projeto e a chave **anon/public**.
4. Cole esses dois valores em `../frontend/js/supabase-config.js`.
5. Em **Authentication > URL Configuration**, informe a URL HTTPS onde o PWA será publicado.
6. Em **Authentication > Providers > Email**, escolha se o usuário precisa confirmar o e-mail antes de entrar.

Nunca coloque a chave `service_role` no aplicativo. Ela tem acesso administrativo e deve permanecer secreta.

O PWA funciona em modo demonstração sem essas credenciais. Depois de configurado, cadastro, login, perfil e pedidos de oração usam o Supabase.
