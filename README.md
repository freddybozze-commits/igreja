# IEPP Curitiba — PWA 4.0

Esta versão foi reconstruída como **Progressive Web App (PWA)**. Não usa Flutter, APK, EXE, BAT, SH, Node, npm ou etapa de compilação.

## Como funciona

- Abra pelo navegador usando um endereço HTTPS.
- Em celulares compatíveis, o navegador oferece **Instalar app / Adicionar à tela inicial**.
- Depois de instalada, a aplicação abre em modo independente, semelhante a um app nativo.
- O Service Worker guarda a interface e o conteúdo local para uso offline.
- Sem Supabase configurado, o conteúdo público funciona em modo demonstração a partir de `data/content.json`.
- Com Supabase configurado, cada pessoa pode criar conta, entrar, editar seu perfil e enviar pedidos de oração vinculados ao seu cadastro.

## Estrutura

```text
iepp_curitiba_pwa/
├── index.html                 # PWA público
├── admin.html                 # painel administrativo web
├── manifest.webmanifest       # instalação do PWA
├── sw.js                      # cache/offline
├── css/
│   ├── styles.css
│   └── admin.css
├── js/
│   ├── app.js
│   ├── supabase-config.js
│   ├── supabase-service.js
│   ├── admin.js
│   └── admin-service.js
├── data/
│   └── content.json
├── assets/
│   ├── images/
│   └── icons/
└── supabase.sql
```

## Telas disponíveis

- Início
- Palavras / publicações
- Agenda
- Pedido de oração
- Perfil da igreja
- Ministérios
- Bíblia offline
- Cadastro, login e perfil individual

## Publicação sem compilação

Você pode enviar a pasta inteira para qualquer hospedagem HTTPS de arquivos estáticos, por exemplo:

- Netlify Drop
- GitHub Pages
- Cloudflare Pages
- Vercel
- Hospedagem própria com HTTPS

Não altere a estrutura das pastas durante o upload.

> Abrir `index.html` diretamente com `file://` não ativa corretamente Service Worker/PWA. Use uma hospedagem HTTPS ou um servidor web local durante o desenvolvimento.

## Supabase

Leia `CONFIGURAR_SUPABASE.md`. O Supabase é opcional para testar a interface, mas necessário para cadastro, login e dados online.

## Versão

PWA 4.0.0 — Android, iOS, autenticação individual e Supabase.
