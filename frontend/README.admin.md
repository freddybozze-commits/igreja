# Painel administrativo IEPP

O painel está disponível em `/admin.html` (ou `/admin` na Vercel). Ele usa a mesma autenticação, banco e Storage do Supabase usados pelo PWA. Nenhuma chave `service_role` deve ser colocada no frontend.

## 1. Preparar o Supabase

1. Abra o projeto no Supabase.
2. Entre em **SQL Editor > New query**.
3. Cole o conteúdo completo de `backend/supabase.sql` e execute uma vez.
4. Confirme em **Storage** que o bucket público `content-images` foi criado.

O SQL cria as tabelas, políticas RLS e permissões administrativas. Visitantes continuam vendo somente posts e eventos publicados. Apenas perfis com `role = 'admin'` podem criar, editar e excluir conteúdo, consultar pedidos de oração e enviar imagens.

## 2. Configurar o frontend

Na Vercel, cadastre estas variáveis no projeto cujo diretório raiz é `frontend`:

```text
PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Depois faça um novo deploy. Para uso local, crie `frontend/.env` com os mesmos valores e execute:

```powershell
cd frontend
npm run build
npx serve .
```

Abra a URL exibida pelo servidor e acrescente `/admin.html`. Não abra o HTML diretamente com `file://`, pois os módulos JavaScript precisam de um servidor HTTP.

## 3. Criar o primeiro administrador

1. Crie uma conta pelo cadastro do próprio PWA ou por **Authentication > Users** no Supabase.
2. No **SQL Editor**, promova o usuário pelo e-mail:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (
  select id from auth.users where email = 'admin@exemplo.com'
);
```

3. Confirme que uma linha foi alterada. Se nenhuma linha mudar, verifique se a conta já foi criada e se o e-mail está correto.
4. Acesse `/admin.html` e entre com o e-mail e a senha dessa conta.

A promoção deve ser feita no SQL Editor. Não altere o JavaScript para aceitar qualquer usuário e não exponha a chave `service_role`.

## 4. Como usar

- **Visão geral:** mostra as quantidades de publicações, eventos e pedidos novos.
- **Publicações:** cria, edita, publica, oculta ou exclui posts.
- **Eventos:** cadastra título, descrição, data/hora, local e imagem.
- **Pedidos de oração:** lista pedidos reservados e permite alternar entre novo e atendido.
- **Imagens:** informe uma URL existente ou envie um arquivo de até 6 MB ao bucket `content-images`.

Conteúdo com **Publicado** desmarcado permanece no banco e no painel, mas não aparece para visitantes do PWA.

## Problemas comuns

- **“Supabase ainda não configurado”**: confira as variáveis da Vercel e faça um novo deploy.
- **“Sem permissão de administrador”**: confirme que `public.profiles.role` é `admin` para o mesmo usuário autenticado.
- **Erro de RLS ao salvar**: execute a versão atual de `backend/supabase.sql` e entre novamente.
- **Erro no upload**: confirme a existência do bucket `content-images`, o limite de 6 MB e o tipo de imagem.
- **E-mail ainda não confirmado**: confirme-o ou ajuste essa exigência em **Authentication > Providers > Email**.
