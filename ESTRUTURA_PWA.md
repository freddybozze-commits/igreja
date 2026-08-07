# Mudança de arquitetura

## Antes

Flutter → compilação → APK/artefato executável → instalação.

## Agora

HTML + CSS + JavaScript → hospedagem HTTPS → navegador → instalação opcional como PWA.

## Camadas

```text
Interface pública
  index.html + css/styles.css
        ↓
Roteamento e estado
  js/app.js
        ↓
Dados locais       Firebase Web
content.json       firebase-service.js
        ↘          ↙
         Tela / cache offline

Painel administrativo
  admin.html
        ↓
  js/admin.js
        ↓
  admin-service.js
        ↓
Firebase Auth + Firestore + Storage
```

## Vantagens desta versão

- não precisa gerar APK ou EXE;
- abre por URL;
- pode ser instalada na tela inicial;
- funciona em Android, iPhone e desktop;
- atualização centralizada: publicou o site, todos recebem a nova versão;
- cache offline;
- painel administrativo também funciona no navegador;
- não depende de loja de aplicativos para distribuição interna.
