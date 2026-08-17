import {
  observeAuth,
  signIn,
  signOutAdmin,
  isAdminUser,
  listDocuments,
  saveDocument,
  removeDocument,
  uploadContentImage
} from './admin-service.js';

const loginView = document.querySelector('#loginView');
const dashboardView = document.querySelector('#dashboardView');
const adminContent = document.querySelector('#adminContent');
const logoutButton = document.querySelector('#logoutButton');
const downloadAdminButton = document.querySelector('#downloadAdminButton');
const adminUser = document.querySelector('#adminUser');
const adminToast = document.querySelector('#adminToast');

const state = {
  user: null,
  tab: 'overview',
  posts: [],
  events: [],
  highlights: [],
  prayers: [],
  loading: false,
  deferredInstallPrompt: null
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
  [loginView, dashboardView].forEach((item) => item.hidden = item !== view);
}

const adminSections = new Set(['overview', 'posts', 'events', 'highlights', 'prayers']);

function currentAdminRoute() {
  const parts = (location.hash || '#overview').slice(1).split('/').filter(Boolean);
  const section = adminSections.has(parts[0]) ? parts[0] : 'overview';
  return { section, action: parts[1] || '', id: parts[2] || '' };
}

function navigateAdmin(path) {
  const hash = `#${path}`;
  if (location.hash === hash) renderAdmin();
  else location.hash = hash;
}

async function refreshAll() {
  state.loading = true;
  try {
    [state.posts, state.events, state.highlights, state.prayers] = await Promise.all([
      listDocuments('posts'),
      listDocuments('events'),
      listDocuments('highlights'),
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

function formatDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function overviewView() {
  const newPrayers = state.prayers.filter((p) => (p.status || 'received') === 'received').length;
  return `
    <header class="admin-page-head"><div><h1>Visão geral</h1></div><button class="btn small" data-admin-refresh>Atualizar</button></header>
    <div class="admin-stats">
      <article class="admin-stat"><strong>${state.posts.length}</strong><span>Publicações</span></article>
      <article class="admin-stat"><strong>${state.events.length}</strong><span>Eventos</span></article>
      <article class="admin-stat"><strong>${state.highlights.length}</strong><span>Destaques</span></article>
      <article class="admin-stat"><strong>${newPrayers}</strong><span>Pedidos novos</span></article>
    </div>`;
}

function documentTable(type, items) {
  const isPost = type === 'posts';
  const isHighlight = type === 'highlights';
  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Imagem</th><th>Título</th><th>${isPost ? 'Categoria' : isHighlight ? 'Ordem / destino' : 'Data / horário'}</th><th>Publicado</th><th>Ações</th></tr></thead>
        <tbody>
          ${items.length ? items.map((item) => `
            <tr>
              <td class="admin-cell-image"><img src="${e(item.image || 'assets/images/logo igreja.png')}" alt=""></td>
              <td class="admin-cell-title"><strong>${e(item.title || 'Sem título')}</strong><br><small>${e((item.subtitle || item.description || '').slice(0, 90))}</small></td>
              <td data-label="${isPost ? 'Categoria' : isHighlight ? 'Ordem / destino' : 'Data / horário'}">${isPost ? e(item.category || '—') : isHighlight ? `${e(item.sort_order ?? 0)} · ${e(item.route || 'ministries')}` : e(formatDate(item.starts_at))}</td>
              <td data-label="Publicado">${item.published === false ? 'Não' : 'Sim'}</td>
              <td class="admin-cell-actions"><div class="admin-row-actions"><button data-admin-edit="${e(type)}" data-id="${e(item.id)}">Editar</button><button class="danger" data-admin-delete="${e(type)}" data-id="${e(item.id)}">Excluir</button></div></td>
            </tr>`).join('') : '<tr><td colspan="5">Nenhum registro.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

function listView(type) {
  const items = type === 'posts' ? state.posts : type === 'events' ? state.events : state.highlights;
  const title = type === 'posts' ? 'Publicações' : type === 'events' ? 'Eventos' : 'Destaques';
  return `
    <header class="admin-page-head"><div><h1>${title}</h1></div><button class="btn orange small" data-admin-new="${type}">+ Novo</button></header>
    ${documentTable(type, items)}`;
}

function editorView(type, item = {}) {
  const isPost = type === 'posts';
  const isHighlight = type === 'highlights';
  const label = isPost ? 'publicação' : isHighlight ? 'destaque' : 'evento';
  const title = item.id ? `Editar ${label}` : `${isPost ? 'Nova' : 'Novo'} ${label}`;
  const subtitle = item.subtitle || item.description || '';
  return `
    <header class="admin-page-head"><div><h1>${title}</h1></div><button class="btn light small" data-admin-cancel="${type}">Cancelar</button></header>
    <div class="admin-editor">
      <form id="contentEditor" class="admin-form" data-type="${type}" data-id="${e(item.id || '')}">
        <div class="field"><label>Título</label><input name="title" required maxlength="140" value="${e(item.title || '')}"></div>
        ${isHighlight ? '' : `<div class="field"><label>${isPost ? 'Descrição' : 'Descrição do evento'}</label><textarea name="description" maxlength="1200">${e(subtitle)}</textarea></div>`}
        ${isPost ? `<div class="field"><label>Categoria</label><input name="category" maxlength="60" value="${e(item.category || 'Cultos')}"></div><div class="field"><label>Data / chamada</label><input name="date" maxlength="80" value="${e(item.date || '')}"></div>` : isHighlight ? `<div class="field"><label>Ordem</label><input name="sort_order" type="number" min="0" step="1" value="${e(item.sort_order ?? 0)}"></div><div class="field"><label>Destino ao clicar</label><select name="route"><option value="ministries" ${item.route === 'ministries' ? 'selected' : ''}>Ministérios</option><option value="agenda" ${item.route === 'agenda' ? 'selected' : ''}>Agenda</option><option value="posts" ${item.route === 'posts' ? 'selected' : ''}>Publicações</option><option value="home" ${item.route === 'home' ? 'selected' : ''}>Início</option></select></div>` : `<div class="field"><label>Data e horário</label><input name="starts_at" type="datetime-local" value="${e(formatDateTimeLocal(item.starts_at))}"></div><div class="field"><label>Local</label><input name="location" maxlength="120" value="${e(item.location || 'IEPP Curitiba')}"></div>`}
        <div class="field"><label>URL da imagem</label><input name="image" id="imageUrl" value="${e(item.image || '')}" placeholder="https://..."></div>
        <div class="field"><label>Ou enviar imagem</label><input class="admin-file" name="imageFile" type="file" accept="image/*"></div>
        <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="published" ${item.published === false ? '' : 'checked'}> Publicado</label>
        <div class="admin-toolbar"><button class="btn orange" type="submit">Salvar</button><button class="btn light" type="button" data-admin-cancel="${type}">Cancelar</button></div>
      </form>
      <aside class="admin-preview ${isHighlight ? 'highlight-preview' : ''}"><img id="previewImage" src="${e(item.image || 'assets/images/logo igreja.png')}" alt=""><h3 id="previewTitle">${e(item.title || 'Prévia do conteúdo')}</h3>${isHighlight ? '' : `<p id="previewText">${e(subtitle || 'A descrição aparecerá aqui.')}</p>`}</aside>
    </div>`;
}

function prayersView() {
  const sorted = [...state.prayers].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return `
    <header class="admin-page-head"><div><h1>Pedidos de oração</h1></div><button class="btn small" data-admin-refresh>Atualizar</button></header>
    <div class="prayer-list">${sorted.length ? sorted.map((p) => `
      <article class="prayer-card">
        <div class="prayer-meta"><span>${e(formatDate(p.created_at))}</span><span>${p.is_private === false ? 'Compartilhável' : 'Reservado'}</span></div>
        <h3>${e(p.name || 'Sem nome')}</h3>
        ${p.phone ? `<small>${e(p.phone)}</small>` : ''}
        <p>${e(p.request || '')}</p>
        <div class="prayer-actions"><span class="status-pill ${p.status === 'answered' ? 'online' : 'offline'}">${p.status === 'answered' ? 'Atendido' : 'Novo'}</span><button class="btn light small" data-prayer-status="${e(p.id)}" data-next-status="${p.status === 'answered' ? 'received' : 'answered'}">${p.status === 'answered' ? 'Marcar como novo' : 'Marcar atendido'}</button></div>
      </article>`).join('') : '<div class="empty-state">Nenhum pedido recebido.</div>'}</div>`;
}

function renderAdmin() {
  const route = currentAdminRoute();
  state.tab = route.section;
  document.querySelectorAll('.admin-tab').forEach((button) => button.classList.toggle('active', button.dataset.adminTab === state.tab));
  if (state.loading) {
    adminContent.innerHTML = '<div class="empty-state">Carregando dados…</div>';
    return;
  }
  if (route.action === 'new' && ['posts', 'events', 'highlights'].includes(route.section)) {
    adminContent.innerHTML = editorView(route.section);
    setupEditorPreview(document.querySelector('#contentEditor'));
  } else if (route.action === 'edit' && route.id && ['posts', 'events', 'highlights'].includes(route.section)) {
    const item = state[route.section].find((entry) => entry.id === route.id) || {};
    adminContent.innerHTML = editorView(route.section, item);
    setupEditorPreview(document.querySelector('#contentEditor'));
  } else if (state.tab === 'overview') adminContent.innerHTML = overviewView();
  else if (['posts', 'events', 'highlights'].includes(state.tab)) adminContent.innerHTML = listView(state.tab);
  else if (state.tab === 'prayers') adminContent.innerHTML = prayersView();
  adminContent.scrollTop = 0;
}

async function handleEditorSubmit(form) {
  const type = form.dataset.type;
  const id = form.dataset.id || null;
  const isPost = type === 'posts';
  const isHighlight = type === 'highlights';
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Salvando…';
  try {
    let image = form.elements.image.value.trim();
    const file = form.elements.imageFile.files[0];
    if (file) {
      if (file.size > 6 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 6 MB.');
      image = await uploadContentImage(file, type);
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
    } : isHighlight ? {
      ...common,
      route: form.elements.route.value,
      sort_order: Number(form.elements.sort_order.value) || 0
    } : {
      ...common,
      description: form.elements.description.value.trim(),
      starts_at: form.elements.starts_at.value ? new Date(form.elements.starts_at.value).toISOString() : null,
      location: form.elements.location.value.trim()
    };
    await saveDocument(type, payload, id);
    await refreshAll();
    navigateAdmin(type);
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
    const previewText = document.querySelector('#previewText');
    if (previewText && description) previewText.textContent = description.value || 'A descrição aparecerá aqui.';
    if (image.value) document.querySelector('#previewImage').src = image.value;
  };
  [title, description, image].filter(Boolean).forEach((input) => input.addEventListener('input', update));
  file.addEventListener('change', () => {
    const selected = file.files[0];
    if (selected) document.querySelector('#previewImage').src = URL.createObjectURL(selected);
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  state.deferredInstallPrompt = event;
});

window.addEventListener('appinstalled', () => {
  state.deferredInstallPrompt = null;
  downloadAdminButton.textContent = 'Instalado';
  downloadAdminButton.disabled = true;
  showToast('Aplicativo instalado.');
});

downloadAdminButton?.addEventListener('click', async () => {
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    showToast('O aplicativo já está instalado.');
    return;
  }
  if (state.deferredInstallPrompt) {
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    return;
  }
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  showToast(isIos ? 'Use Compartilhar e escolha “Adicionar à Tela de Início”.' : 'Use a opção “Instalar aplicativo” no menu do navegador.');
});

async function registerAdminServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./sw.js', { scope: './' });
  } catch (error) {
    console.warn('Não foi possível preparar a instalação.', error);
  }
}

async function init() {
  registerAdminServiceWorker();
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
      const allowed = await isAdminUser(user.id);
      if (!allowed) {
        await signOutAdmin();
        document.querySelector('#loginError').textContent = 'Este usuário não possui a função admin.';
        return;
      }
      state.user = user;
      adminUser.textContent = user.email || user.id;
      logoutButton.hidden = false;
      showOnly(dashboardView);
      if (!location.hash) history.replaceState(null, '', '#overview');
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
  if (event.target.closest('[data-admin-refresh]')) {
    await refreshAll();
    renderAdmin();
    showToast('Dados atualizados.');
    return;
  }

  const create = event.target.closest('[data-admin-new]');
  if (create) {
    navigateAdmin(`${create.dataset.adminNew}/new`);
    return;
  }

  const edit = event.target.closest('[data-admin-edit]');
  if (edit) {
    const type = edit.dataset.adminEdit;
    navigateAdmin(`${type}/edit/${edit.dataset.id}`);
    return;
  }

  const cancel = event.target.closest('[data-admin-cancel]');
  if (cancel) {
    navigateAdmin(cancel.dataset.adminCancel);
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

window.addEventListener('hashchange', () => {
  if (state.user) renderAdmin();
});

document.addEventListener('submit', async (event) => {
  if (event.target.id === 'contentEditor') {
    event.preventDefault();
    await handleEditorSubmit(event.target);
  }
});

init();
