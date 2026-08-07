# Configurar Firebase no PWA

O PWA usa diretamente o SDK Web oficial do Firebase no navegador. Não existe compilação.

## 1. Criar o aplicativo Web

No Firebase Console:

1. Abra o projeto da IEPP Curitiba.
2. Vá em **Configurações do projeto > Seus apps**.
3. Adicione um aplicativo **Web (`</>`)**.
4. Copie o objeto de configuração exibido.

## 2. Preencher `js/firebase-config.js`

Substitua os campos vazios:

```js
export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

Esses identificadores do SDK Web são próprios para uso no cliente. A segurança real deve ficar nas regras do Firestore e Storage incluídas neste projeto.

## 3. Ativar Authentication

No Firebase Console:

1. **Authentication > Sign-in method**.
2. Ative **E-mail/senha**.
3. Crie o usuário administrativo.
4. Copie o UID desse usuário.

## 4. Criar administrador

No Firestore, crie a coleção:

```text
admins
```

Crie um documento cujo **ID seja exatamente o UID** do usuário administrativo. Exemplo:

```text
admins/UID_DO_USUARIO
```

Campos sugeridos:

```json
{
  "name": "Administrador IEPP",
  "role": "admin"
}
```

## 5. Criar banco e Storage

Ative:

- Cloud Firestore
- Firebase Storage

Use as regras dos arquivos `firestore.rules` e `storage.rules` deste pacote.

## 6. Coleções usadas

```text
posts
  title
  subtitle
  category
  date
  image
  published

events
  title
  description
  date
  time
  location
  image
  published

prayer_requests
  name
  phone
  request
  private
  status
  createdAt

admins
  [documento com ID igual ao UID do administrador]
```

## 7. Painel

Depois da configuração, abra:

```text
https://seu-dominio/admin.html
```

O painel permite:

- login administrativo;
- criar, editar e excluir publicações;
- criar, editar e excluir eventos;
- fazer upload de imagens para Firebase Storage;
- visualizar pedidos de oração;
- marcar pedidos como atendidos.

## Importante

O arquivo `firebase-config.js` sozinho não concede acesso administrativo. A autorização depende do Firebase Authentication e das regras do banco.
