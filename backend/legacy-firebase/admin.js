import {
  isAdminFirebaseConfigured,
  observeAuth,
  signIn,
  signOutAdmin,
  isAdminUser,
  listDocuments,
  saveDocument,
  removeDocument,
  uploadContentImage
} from './admin-service.js';

const setupView = document.querySelector('#setupView');
const loginView = document.querySelector('#loginView');
const dashboardView = document.querySelector('#dashboardView');
const adminContent = document.querySelector('#adminContent');
const logoutButton = document.querySelector('#logoutButton');
const adminUser = document.querySelector('#adminUser');
const adminToast = document.querySelector('#adminToast');

const state = {
  user: null,
  tab: 'overview',
  posts: [],
  events: [],
  prayers: [],
  loading: false
};

const e = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function showToast(message) {
  adminToast.textContent = message;
  adminToast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => adminToast.classList.remove('show'), 2600);
}

function showOnly(view) {
  [setupView, loginView, dashboardView].forEach((item) => item.hidden = item !== view);
}

async function refreshAll() {
  state.loading = true;
  try {
    [state.posts, state.events, state.prayers] = await Promise.all([
      listDocuments('posts'),
      listDocuments('events'),
      listDocuments('prayers')
    ]);
  } finally {
    state.loading = false;
  }
}

function formatDate(value) {
  if (!value) return '—';
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString('pt-BR');
  if (value.seconds) return new Date(value.seconds * 1000).toLocaleString('pt-BR');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR');
}

function overviewView() {
  const newPrayers = state.prayers.filter((p) => (p.status || 'novo') === 'novo').length;
  return `
    <header class="admin-page-head"><div><h1>Visão geral</h1><p>Conteúdo e pedidos recebidos pelo PWA.</p></div><button class="btn small" data-admin-refresh>Atualizar</button></header>
    <div class="admin-stats">
      <article class="admin-stat"><strong>${state.posts.length}</strong><span>Publicações</span></article>
      <article class="admin-stat"><strong>${state.events.length}</strong><span>Eventos</span></article>
      <article class="admin-stat"><strong>${newPrayers}</strong><span>Pedidos novos</span></article>
    </div>
    <section class="section form-note"><strong>PWA conectado ao Firebase.</strong><br>Use o menu para cadastrar, editar ou excluir publicações e eventos. Pedidos de oração podem ser marcados como atendidos.</section>`;
}

function documentTable(type, items) {
  const isPost = type === 'posts';
  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Imagem</th><th>Título</th><th>${isPost ? 'Categoria' : 'Data / horário'}</th><th>Publicado</th><th>Ações</th></tr></thead>
        <tbody>
          ${items.length ? items.map((item) => `
            <tr>
              <td><img src="${e(item.image || 'assets/images/logo.png')}" alt=""></td>
              <td><strong>${e(item.title || 'Sem título')}</strong><br><small>${e((item.subtitle || item.description || '').slice(0, 90))}</small></td>
              <td>${isPost ? e(item.category || '—') : `${e(item.date || '—')}<br><small>${e(item.time || '')}</small>`}</td>
              <td>${item.published === false ? 'Não' : 'Sim'}</td>
              <td><div class="admin-row-actions"><button data-admin-edit="${e(type)}" data-id="${e(item.id)}">Editar</button><button class="danger" data-admin-delete="${e(type)}" data-id="${e(item.id)}">Excluir</button></div></td>
            </tr>`).join('') : '<tr><td colspan="5">Nenhum registro.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

function listView(type) {
  const items = type === 'posts' ? state.posts : state.events;
  const title = type === 'posts' ? 'Publicações' : 'Eventos';
  return `
    <header class="admin-page-head"><div><h1>${title}</h1><p>Gerencie o conteúdo exibido no aplicativo.</p></div><button class="btn orange small" data-admin-new="${type}">+ Novo</button></header>
    ${documentTable(type, items)}`;
}

function editorView(type, item = {}) {
  const isPost = type === 'posts';
  const title = item.id ? `Editar ${isPost ? 'publicação' : 'evento'}` : `Nova ${isPost ? 'publicação' : 'programação'}`;
  const subtitle = item.subtitle || item.description || '';
  return `
    <header class="admin-page-head"><div><h1>${title}</h1><p>Salve para publicar as alterações no PWA.</p></div><button class="btn light small" data-admin-cancel="${type}">Cancelar</button></header>
    <div class="admin-editor">
      <form id="contentEditor" class="admin-form" data-type="${type}" data-id="${e(item.id || '')}">
        <div class="field"><label>Título</label><input name="title" required maxlength="140" value="${e(item.title || '')}"></div>
        <div class="field"><label>${isPost ? 'Descrição' : 'Descrição do evento'}</label><textarea name="description" maxlength="1200">${e(subtitle)}</textarea></div>
        ${isPost ? `<div class="field"><label>Categoria</label><input name="category" maxlength="60" value="${e(item.category || 'Cultos')}"></div><div class="field"><label>Data / chamada</label><input name="date" maxlength="80" value="${e(item.date || '')}"></div>` : `<div class="field"><label>Data</label><input name="date" maxlength="80" value="${e(item.date || '')}"></div><div class="field"><label>Horário</label><input name="time" maxlength="80" value="${e(item.time || '')}"></div><div class="field"><label>Local</label><input name="location" maxlength="120" value="${e(item.location || 'IEPP Curitiba')}"></div>`}
        <div class="field"><label>URL da imagem</label><input name="image" id="imageUrl" value="${e(item.image || '')}" placeholder="https://..."></div>
        <div class="field"><label>Ou enviar imagem</label><input class="admin-file" name="imageFile" type="file" accept="image/*"></div>
        <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="published" ${item.published === false ? '' : 'checked'}> Publicado</label>
        <div class="admin-toolbar"><button class="btn orange" type="submit">Salvar</button><button class="btn light" type="button" data-admin-cancel="${type}">Cancelar</button></div>
      </form>
      <aside class="admin-preview"><img id="previewImage" src="${e(item.image || 'assets/images/logo.png')}" alt=""><h3 id="previewTitle">${e(item.title || 'Prévia do conteúdo')}</h3><p id="previewText">${e(subtitle || 'A descrição aparecerá aqui.')}</p></aside>
    </div>`;
}

function prayersView() {
  const sorted = [...state.prayers].sort((a, b) => {
    const aSec = a.createdAt?.seconds || 0;
    const bSec = b.createdAt?.seconds || 0;
    return bSec - aSec;
  });
  return `
    <header class="admin-page-head"><div><h1>Pedidos de oração</h1><p>Conteúdo reservado à equipe autorizada.</p></div><button class="btn small" data-admin-refresh>Atualizar</button></header>
    <div class="prayer-list">${sorted.length ? sorted.map((p) => `
      <article class="prayer-card">
        <div class="prayer-meta"><span>${e(formatDate(p.createdAt))}</span><span>${p.private === false ? 'Compartilhável' : 'Reservado'}</span></div>
        <h3>${e(p.name || 'Sem nome')}</h3>
        ${p.phone ? `<small>${e(p.phone)}</small>` : ''}
        <p>${e(p.request || '')}</p>
        <div class="prayer-actions"><span class="status-pill ${p.status === 'atendido' ? 'online' : 'offline'}">${e(p.status || 'novo')}</span><button class="btn light small" data-prayer-status="${e(p.id)}" data-next-status="${p.status === 'atendido' ? 'novo' : 'atendido'}">${p.status === 'atendido' ? 'Marcar como novo' : 'Marcar atendido'}</button></div>
      </article>`).join('') : '<div class="empty-state">Nenhum pedido recebido.</div>'}</div>`;
}

function renderAdmin() {
  document.querySelectorAll('.admin-tab').forEach((button) => button.classList.toggle('active', button.dataset.adminTab === state.tab));
  if (state.loading) {
    adminContent.innerHTML = '<div class="empty-state">Carregando dados…</div>';
    return;
  }
  if (state.tab === 'overview') adminContent.innerHTML = overviewView();
  else if (state.tab === 'posts') adminContent.innerHTML = listView('posts');
  else if (state.tab === 'events') adminContent.innerHTML = listView('events');
  else if (state.tab === 'prayers') adminContent.innerHTML = prayersView();
}

async function handleEditorSubmit(form) {
  const type = form.dataset.type;
  const id = form.dataset.id || null;
  const isPost = type === 'posts';
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Salvando…';
  try {
    let image = form.elements.image.value.trim();
    const file = form.elements.imageFile.files[0];
    if (file) {
      if (file.size > 6 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 6 MB.');
      image = await uploadContentImage(file, isPost ? 'posts' : 'events');
    }
    const common = {
      title: form.elements.title.value.trim(),
      image,
      published: form.elements.published.checked
    };
    const payload = isPost ? {
      ...common,
      subtitle: form.elements.description.value.trim(),
      category: form.elements.category.value.trim(),
      date: form.elements.date.value.trim()
    } : {
      ...common,
      description: form.elements.description.value.trim(),
      date: form.elements.date.value.trim(),
      time: form.elements.time.value.trim(),
      location: form.elements.location.value.trim()
    };
    await saveDocument(type, payload, id);
    await refreshAll();
    state.tab = type;
    renderAdmin();
    showToast('Conteúdo salvo.');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Não foi possível salvar.');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Salvar';
  }
}

function setupEditorPreview(form) {
  const title = form.querySelector('[name="title"]');
  const description = form.querySelector('[name="description"]');
  const image = form.querySelector('[name="image"]');
  const file = form.querySelector('[name="imageFile"]');
  const update = () => {
    document.querySelector('#previewTitle').textContent = title.value || 'Prévia do conteúdo';
    document.querySelector('#previewText').textContent = description.value || 'A descrição aparecerá aqui.';
    if (image.value) document.querySelector('#previewImage').src = image.value;
  };
  [title, description, image].forEach((input) => input.addEventListener('input', update));
  file.addEventListener('change', () => {
    const selected = file.files[0];
    if (selected) document.querySelector('#previewImage').src = URL.createObjectURL(selected);
  });
}

async function init() {
  if (!isAdminFirebaseConfigured()) {
    showOnly(setupView);
    return;
  }

  showOnly(loginView);
  await observeAuth(async (user) => {
    if (!user) {
      state.user = null;
      logoutButton.hidden = true;
      adminUser.textContent = '';
      showOnly(loginView);
      return;
    }
    try {
      const allowed = await isAdminUser(user.uid);
      if (!allowed) {
        await signOutAdmin();
        document.querySelector('#loginError').textContent = 'Este usuário não está autorizado na coleção admins.';
        return;
      }
      state.user = user;
      adminUser.textContent = user.email || user.uid;
      logoutButton.hidden = false;
      showOnly(dashboardView);
      await refreshAll();
      renderAdmin();
    } catch (error) {
      console.error(error);
      document.querySelector('#loginError').textContent = 'Erro ao verificar permissões administrativas.';
    }
  });
}

document.querySelector('#loginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const errorBox = document.querySelector('#loginError');
  const button = form.querySelector('button[type="submit"]');
  errorBox.textContent = '';
  button.disabled = true;
  button.textContent = 'Entrando…';
  try {
    await signIn(form.elements.email.value.trim(), form.elements.password.value);
  } catch (error) {
    console.error(error);
    errorBox.textContent = error.message || 'E-mail ou senha inválidos.';
  } finally {
    button.disabled = false;
    button.textContent = 'Entrar';
  }
});

logoutButton.addEventListener('click', signOutAdmin);

document.addEventListener('click', async (event) => {
  const tab = event.target.closest('[data-admin-tab]');
  if (tab) {
    state.tab = tab.dataset.adminTab;
    renderAdmin();
    return;
  }

  if (event.target.closest('[data-admin-refresh]')) {
    await refreshAll();
    renderAdmin();
    showToast('Dados atualizados.');
    return;
  }

  const create = event.target.closest('[data-admin-new]');
  if (create) {
    adminContent.innerHTML = editorView(create.dataset.adminNew);
    setupEditorPreview(document.querySelector('#contentEditor'));
    return;
  }

  const edit = event.target.closest('[data-admin-edit]');
  if (edit) {
    const type = edit.dataset.adminEdit;
    const list = type === 'posts' ? state.posts : state.events;
    const item = list.find((x) => x.id === edit.dataset.id) || {};
    adminContent.innerHTML = editorView(type, item);
    setupEditorPreview(document.querySelector('#contentEditor'));
    return;
  }

  const cancel = event.target.closest('[data-admin-cancel]');
  if (cancel) {
    state.tab = cancel.dataset.adminCancel;
    renderAdmin();
    return;
  }

  const remove = event.target.closest('[data-admin-delete]');
  if (remove) {
    const type = remove.dataset.adminDelete;
    if (!confirm('Excluir este registro? Esta ação não pode ser desfeita.')) return;
    try {
      await removeDocument(type, remove.dataset.id);
      await refreshAll();
      renderAdmin();
      showToast('Registro excluído.');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível excluir.');
    }
    return;
  }

  const prayer = event.target.closest('[data-prayer-status]');
  if (prayer) {
    try {
      await saveDocument('prayers', { status: prayer.dataset.nextStatus }, prayer.dataset.prayerStatus);
      await refreshAll();
      renderAdmin();
      showToast('Status atualizado.');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível atualizar.');
    }
  }
});

document.addEventListener('submit', async (event) => {
  if (event.target.id === 'contentEditor') {
    event.preventDefault();
    await handleEditorSubmit(event.target);
  }
});

init();
