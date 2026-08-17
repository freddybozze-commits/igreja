import {
  getRemoteContent, getCurrentUser, onAuthChange,
  sendPrayerRequest, signIn, signOut, signUp, updateProfile
} from './supabase-service.js';

const main = document.querySelector('#mainContent');
const drawer = document.querySelector('#drawer');
const drawerBackdrop = document.querySelector('#drawerBackdrop');
const toast = document.querySelector('#toast');
const detailDialog = document.querySelector('#detailDialog');
const installButton = document.querySelector('#installButton');
const themeButton = document.querySelector('#themeButton');
const connectionStatus = document.querySelector('#connectionStatus');

const state = {
  data: null,
  deferredInstallPrompt: null,
  postFilter: 'Todos',
  postSearch: '',
  route: 'home',
  user: null,
  authMode: 'login'
};

const e = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function safeUrl(value = '') {
  const raw = String(value).trim();
  if (raw.startsWith('assets/') || raw.startsWith('./assets/')) return raw;
  try {
    const url = new URL(raw, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : 'assets/images/logo igreja.png';
  } catch {
    return 'assets/images/logo igreja.png';
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('iepp-theme', theme);
  themeButton.textContent = theme === 'dark' ? '☀' : '◐';
  themeButton.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
  themeButton.title = theme === 'dark' ? 'Clarear site' : 'Escurecer site';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#151515' : '#f3f4f5');
}

function initTheme() {
  const saved = localStorage.getItem('iepp-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));
}

function openDrawer() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  drawerBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  drawerBackdrop.hidden = true;
  document.body.style.overflow = '';
}

function updateConnection() {
  const online = navigator.onLine;
  connectionStatus.textContent = online ? '● Online' : '● Offline';
  connectionStatus.style.color = online ? '#30b36b' : '#d04a56';
}

function navigate(route, options = {}) {
  const next = route || 'home';
  if (options.replace) history.replaceState(null, '', `#${next}`);
  else if (location.hash.slice(1) !== next) location.hash = next;
  else renderRoute(next);
  closeDrawer();
}

function currentRoute() {
  return (location.hash || '#home').slice(1).split('?')[0] || 'home';
}

function setActiveNav(route) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.route === route);
  });
}

function pageHead(title, subtitle = '') {
  return `<header class="page-head"><div><h1>${e(title)}</h1>${subtitle ? `<p>${e(subtitle)}</p>` : ''}</div></header>`;
}

function sectionHead(title, action = '') {
  return `<div class="section-head"><h2>${e(title)}</h2>${action}</div>`;
}

function postCard(post) {
  const image = safeUrl(post.image || 'assets/images/logo igreja.png');
  return `
    <article class="content-card" data-detail-type="post" data-detail-id="${e(post.id)}">
      <button class="media open-detail" aria-label="Abrir ${e(post.title)}">
        <img src="${e(image)}" alt="${e(post.title)}" loading="lazy">
        <span class="badge">${e(post.category || 'Publicação')}</span>
      </button>
      <div class="card-body">
        <h3>${e(post.title)}</h3>
        <p>${e(post.subtitle || post.description || '')}</p>
        <div class="meta"><span>◷ ${e(post.date || '')}</span><span>IEPP Curitiba</span></div>
      </div>
    </article>`;
}

function eventRow(event) {
  return `
    <button class="event-row open-detail" data-detail-type="event" data-detail-id="${e(event.id)}">
      <img class="event-thumb" src="${e(safeUrl(event.image))}" alt="" loading="lazy">
      <div style="text-align:left">
        <h3>${e(event.title)}</h3>
        <p>◷ ${e(event.time || '')}</p>
        <p>⌖ ${e(event.location || 'IEPP Curitiba')}</p>
      </div>
      <div class="event-date">${e(event.date || '')}</div>
    </button>`;
}

function highlight(item) {
  return `
    <button class="highlight" data-route="${e(item.route || 'ministries')}" aria-label="${e(item.title)}">
      <span class="highlight-ring"><img src="${e(safeUrl(item.image))}" alt="" loading="lazy"></span>
      <strong>${e(item.title)}</strong>
    </button>`;
}

function renderHome() {
  const d = state.data;
  const verse = d.verses[new Date().getDate() % d.verses.length];
  const topPosts = d.posts.filter((x) => x.published !== false).slice(0, 3);
  const events = d.events.filter((x) => x.published !== false).slice(0, 3);
  const c = d.church;

  main.innerHTML = `
    <div class="home-layout">
      <div>
        <section class="hero">
          <img class="hero-image" src="${e(safeUrl(d.hero.image))}" alt="${e(d.hero.title)}">
          <div class="hero-content">
            <span class="hero-eyebrow">${e(d.hero.eyebrow)}</span>
            <h1>${e(d.hero.title)}</h1>
            <p>${e(d.hero.subtitle)}</p>
            <div class="hero-actions">
              <button class="btn orange" data-route="agenda">Ver programação</button>
              <a class="btn ghost" href="${e(c.links.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>
            </div>
          </div>
        </section>

        <div class="quick-links" aria-label="Acessos rápidos">
          <a class="quick-link" href="${e(c.links.whatsapp)}" target="_blank" rel="noopener"><span>◉</span><strong>WhatsApp</strong></a>
          <a class="quick-link" href="${e(c.links.maps)}" target="_blank" rel="noopener"><span>⌖</span><strong>Endereço</strong></a>
          <a class="quick-link" href="${e(c.links.linktree)}" target="_blank" rel="noopener"><span>↗</span><strong>Links</strong></a>
        </div>

        <section class="section">
          ${sectionHead('Destaques')}
          <div class="highlights">${d.highlights.map(highlight).join('')}</div>
        </section>

        <section class="section">
          ${sectionHead('Últimas publicações', '<button data-route="posts">Ver todas</button>')}
          <div class="card-grid three">${topPosts.map(postCard).join('')}</div>
        </section>
      </div>

      <aside class="home-side">
        <section>
          ${sectionHead('Próximos encontros', '<button data-route="agenda">Agenda</button>')}
          <div class="event-list">${events.map(eventRow).join('')}</div>
        </section>
        <section class="section verse-card">
          <blockquote>“${e(verse.text)}”</blockquote>
          <cite>${e(verse.reference)}</cite>
        </section>
      </aside>
    </div>`;
}

function renderPosts() {
  const posts = state.data.posts.filter((x) => x.published !== false);
  const categories = ['Todos', ...new Set(posts.map((p) => p.category).filter(Boolean))];
  const search = state.postSearch.toLocaleLowerCase('pt-BR');
  const filtered = posts.filter((p) => {
    const categoryOk = state.postFilter === 'Todos' || p.category === state.postFilter;
    const haystack = `${p.title} ${p.subtitle || ''} ${p.category || ''}`.toLocaleLowerCase('pt-BR');
    return categoryOk && (!search || haystack.includes(search));
  });

  main.innerHTML = `
    ${pageHead('Palavras e publicações', 'Mensagens, cultos e programações da IEPP Curitiba.')}
    <div class="search-box"><input id="postSearch" type="search" placeholder="Buscar publicação" value="${e(state.postSearch)}" autocomplete="off"></div>
    <div class="chips">${categories.map((cat) => `<button class="chip ${cat === state.postFilter ? 'active' : ''}" data-filter="${e(cat)}">${e(cat)}</button>`).join('')}</div>
    <section class="section">
      <div class="card-grid three">${filtered.length ? filtered.map(postCard).join('') : '<div class="empty-state">Nenhuma publicação encontrada.</div>'}</div>
    </section>`;

  const searchInput = document.querySelector('#postSearch');
  searchInput?.addEventListener('input', (event) => {
    state.postSearch = event.target.value;
    clearTimeout(renderPosts.timer);
    renderPosts.timer = setTimeout(renderPosts, 120);
  });
}

function renderAgenda() {
  const events = state.data.events.filter((x) => x.published !== false);
  main.innerHTML = `
    ${pageHead('Agenda', 'Cultos, conferências e encontros da igreja.')}
    <section class="event-list">${events.map(eventRow).join('')}</section>`;
}

function renderPrayer() {
  main.innerHTML = `
    ${pageHead('Pedido de oração', 'Envie seu pedido com privacidade para a equipe responsável.')}
    <section class="form-card">
      <form id="prayerForm" class="form-grid">
        <div class="field"><label for="prayerName">Nome</label><input id="prayerName" name="name" maxlength="80" required placeholder="Seu nome" value="${e(state.user?.user_metadata?.full_name || '')}"></div>
        <div class="field"><label for="prayerPhone">WhatsApp (opcional)</label><input id="prayerPhone" name="phone" inputmode="tel" maxlength="30" placeholder="(41) 99999-9999" value="${e(state.user?.user_metadata?.phone || '')}"></div>
        <div class="field"><label for="prayerText">Pedido</label><textarea id="prayerText" name="request" maxlength="1500" required placeholder="Escreva seu pedido de oração..."></textarea></div>
        <label style="display:flex;gap:9px;align-items:flex-start;font-size:12px;color:var(--muted)"><input type="checkbox" name="private" checked style="margin-top:2px"> Manter este pedido reservado à equipe de oração.</label>
        <button class="btn orange" type="submit">Enviar pedido</button>
      </form>
    </section>`;

  document.querySelector('#prayerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const payload = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      request: form.elements.request.value.trim(),
      private: form.elements.private.checked
    };
    if (!payload.name || !payload.request) return;
    button.disabled = true;
    button.textContent = 'Enviando…';
    try {
      const result = await sendPrayerRequest(payload);
      form.reset();
      form.elements.private.checked = true;
      showToast(result.mode === 'supabase' ? 'Pedido enviado com sucesso.' : 'Pedido salvo com sucesso.');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível enviar agora. Tente novamente.');
    } finally {
      button.disabled = false;
      button.textContent = 'Enviar pedido';
    }
  });
}

function renderProfile() {
  if (!state.user) {
    const registering = state.authMode === 'register';
    main.innerHTML = `
      ${pageHead(registering ? 'Crie seu cadastro' : 'Bem-vindo', registering ? 'Faça parte da comunidade IEPP Curitiba.' : 'Entre para acessar seu perfil e acompanhar seus pedidos.')}
      <section class="auth-card">
        <div class="auth-brand"><img src="assets/images/logo igreja.png" alt=""><div><strong>Igreja Evangélica</strong><span>Palavra Profética</span></div></div>
        <div class="auth-tabs">
          <button class="${!registering ? 'active' : ''}" data-auth-mode="login">Entrar</button>
          <button class="${registering ? 'active' : ''}" data-auth-mode="register">Cadastrar</button>
        </div>
        <form id="authForm" class="form-grid">
          ${registering ? '<div class="field"><label for="authName">Nome completo</label><input id="authName" name="name" required maxlength="100" autocomplete="name" placeholder="Seu nome"></div><div class="field"><label for="authPhone">WhatsApp</label><input id="authPhone" name="phone" maxlength="30" inputmode="tel" autocomplete="tel" placeholder="(41) 99999-9999"></div>' : ''}
          <div class="field"><label for="authEmail">E-mail</label><input id="authEmail" name="email" required type="email" autocomplete="email" placeholder="voce@email.com"></div>
          <div class="field"><label for="authPassword">Senha</label><input id="authPassword" name="password" required type="password" minlength="6" autocomplete="${registering ? 'new-password' : 'current-password'}" placeholder="Mínimo de 6 caracteres"></div>
          <button class="btn silver" type="submit">${registering ? 'Criar meu cadastro' : 'Entrar'}</button>
          <p class="form-message" id="authMessage" role="status"></p>
        </form>
      </section>`;
    bindAuthForm();
    return;
  }

  const meta = state.user.user_metadata || {};
  main.innerHTML = `
    ${pageHead('Meu perfil', 'Seus dados de membro da IEPP Curitiba.')}
    <section class="member-card">
      <div class="member-avatar">${e((meta.full_name || state.user.email || 'M').charAt(0).toUpperCase())}</div>
      <div><span class="member-label">MEMBRO</span><h2>${e(meta.full_name || 'Complete seu perfil')}</h2><p>${e(state.user.email)}</p></div>
    </section>
    <section class="form-card section">
      <form id="profileForm" class="form-grid">
        <div class="field"><label for="profileName">Nome completo</label><input id="profileName" name="name" required maxlength="100" value="${e(meta.full_name || '')}" autocomplete="name"></div>
        <div class="field"><label for="profilePhone">WhatsApp</label><input id="profilePhone" name="phone" maxlength="30" value="${e(meta.phone || '')}" inputmode="tel" autocomplete="tel"></div>
        <div class="field"><label for="profileBirth">Data de nascimento</label><input id="profileBirth" name="birthDate" type="date" value="${e(meta.birth_date || '')}"></div>
        <button class="btn silver" type="submit">Salvar meus dados</button>
        <button class="btn light" id="logoutButton" type="button">Sair da conta</button>
      </form>
    </section>`;
  bindProfileForm();
}

function authErrorMessage(error) {
  const message = String(error?.message || '');
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('User already registered')) return 'Este e-mail já possui cadastro.';
  if (message.includes('SUPABASE_NOT_CONFIGURED')) return 'Serviço indisponível no momento.';
  return message || 'Não foi possível concluir. Tente novamente.';
}

function bindAuthForm() {
  document.querySelector('#authForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const message = form.querySelector('#authMessage');
    button.disabled = true;
    button.textContent = 'Aguarde…';
    message.textContent = '';
    try {
      if (state.authMode === 'register') {
        const result = await signUp({ name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), email: form.elements.email.value.trim(), password: form.elements.password.value });
        if (!result.session) message.textContent = 'Cadastro criado! Confira seu e-mail para confirmar a conta.';
        else showToast('Cadastro criado com sucesso!');
      } else {
        await signIn({ email: form.elements.email.value.trim(), password: form.elements.password.value });
        showToast('Login realizado com sucesso.');
      }
    } catch (error) {
      message.textContent = authErrorMessage(error);
      message.classList.add('error');
    } finally {
      button.disabled = false;
      button.textContent = state.authMode === 'register' ? 'Criar meu cadastro' : 'Entrar';
    }
  });
}

function bindProfileForm() {
  document.querySelector('#profileForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      state.user = await updateProfile({ name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), birthDate: form.elements.birthDate.value });
      showToast('Perfil atualizado.');
      renderProfile();
    } catch (error) { showToast(authErrorMessage(error)); }
    finally { button.disabled = false; }
  });
  document.querySelector('#logoutButton')?.addEventListener('click', async () => {
    await signOut();
    showToast('Você saiu da conta.');
  });
}

function renderMinistries() {
  main.innerHTML = `
    ${pageHead('Ministérios', 'Conheça algumas áreas de cuidado e serviço da IEPP Curitiba.')}
    <div class="ministry-grid">${state.data.ministries.map((m) => `
      <article class="ministry-card"><img src="${e(safeUrl(m.image))}" alt="" loading="lazy"><div><h3>${e(m.title)}</h3><p>${e(m.description)}</p></div></article>`).join('')}</div>`;
}

function renderBible() {
  const verses = state.data.verses;
  main.innerHTML = `
    ${pageHead('Bíblia', 'Versículos disponíveis para consulta rápida no modo offline.')}
    <div class="search-box"><input id="bibleSearch" type="search" placeholder="Buscar versículo ou referência" autocomplete="off"></div>
    <section id="bibleList" class="section bible-list">${verses.map((v) => `<article class="bible-item"><strong>${e(v.reference)}</strong><p>${e(v.text)}</p></article>`).join('')}</section>`;
  document.querySelector('#bibleSearch')?.addEventListener('input', (event) => {
    const query = event.target.value.toLocaleLowerCase('pt-BR').trim();
    const filtered = verses.filter((v) => `${v.reference} ${v.text}`.toLocaleLowerCase('pt-BR').includes(query));
    document.querySelector('#bibleList').innerHTML = filtered.length
      ? filtered.map((v) => `<article class="bible-item"><strong>${e(v.reference)}</strong><p>${e(v.text)}</p></article>`).join('')
      : '<div class="empty-state">Nenhum versículo encontrado.</div>';
  });
}

function renderNotFound() {
  main.innerHTML = `${pageHead('Página não encontrada')}<div class="empty-state"><p>Esta área não existe.</p><button class="btn" data-route="home">Voltar ao início</button></div>`;
}

const renderers = {
  home: renderHome,
  posts: renderPosts,
  agenda: renderAgenda,
  prayer: renderPrayer,
  profile: renderProfile,
  ministries: renderMinistries,
  bible: renderBible
};

function renderRoute(route) {
  if (!state.data) return;
  state.route = route;
  setActiveNav(route);
  (renderers[route] || renderNotFound)();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function openDetail(type, id) {
  const list = type === 'event' ? state.data.events : state.data.posts;
  const item = list.find((x) => String(x.id) === String(id));
  if (!item) return;
  const maps = state.data.church.links.maps;
  detailDialog.innerHTML = `
    <button class="dialog-close" data-close-dialog aria-label="Fechar">×</button>
    <img class="dialog-media" src="${e(safeUrl(item.image))}" alt="${e(item.title)}">
    <div class="dialog-body">
      <span class="status-pill online">${e(type === 'event' ? (item.date || 'Evento') : (item.category || 'Publicação'))}</span>
      <h2>${e(item.title)}</h2>
      <p style="color:var(--muted);line-height:1.6">${e(item.description || item.subtitle || '')}</p>
      ${type === 'event' ? `<p><strong>Horário:</strong> ${e(item.time || '')}<br><strong>Local:</strong> ${e(item.location || 'IEPP Curitiba')}</p><a class="btn" href="${e(maps)}" target="_blank" rel="noopener">Como chegar</a>` : ''}
    </div>`;
  detailDialog.showModal();
}

async function loadData() {
  const response = await fetch('data/content.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Falha ao carregar dados locais');
  const local = await response.json();
  state.data = local;
  renderRoute(currentRoute());

  const remote = await getRemoteContent();
  if (remote) {
    if (remote.posts?.length) state.data.posts = remote.posts;
    if (remote.events?.length) state.data.events = remote.events;
    if (remote.highlights?.length) state.data.highlights = remote.highlights;
    renderRoute(currentRoute());
  }
}

function setupEvents() {
  document.querySelector('#menuButton').addEventListener('click', openDrawer);
  document.querySelector('#drawerClose').addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);
  themeButton.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

  document.addEventListener('click', (event) => {
    const authMode = event.target.closest('[data-auth-mode]');
    if (authMode) {
      state.authMode = authMode.dataset.authMode;
      renderProfile();
      return;
    }
    const routeTarget = event.target.closest('[data-route]');
    if (routeTarget) {
      event.preventDefault();
      navigate(routeTarget.dataset.route);
      return;
    }
    const filter = event.target.closest('[data-filter]');
    if (filter) {
      state.postFilter = filter.dataset.filter;
      renderPosts();
      return;
    }
    const detail = event.target.closest('.open-detail');
    if (detail) {
      const card = detail.closest('[data-detail-type]') || detail;
      openDetail(card.dataset.detailType || detail.dataset.detailType, card.dataset.detailId || detail.dataset.detailId);
      return;
    }
    if (event.target.closest('[data-close-dialog]')) detailDialog.close();
  });

  window.addEventListener('hashchange', () => renderRoute(currentRoute()));
  window.addEventListener('online', () => { updateConnection(); showToast('Conexão restaurada.'); });
  window.addEventListener('offline', () => { updateConnection(); showToast('Você está offline. O conteúdo salvo continua disponível.'); });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener('click', async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    installButton.hidden = true;
    showToast('IEPP Curitiba instalado.');
  });
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js', { scope: './' });
    } catch (error) {
      console.warn('Service Worker não registrado:', error);
    }
  }
}

async function start() {
  initTheme();
  updateConnection();
  setupEvents();
  state.user = await getCurrentUser();
  onAuthChange((user) => {
    state.user = user;
    if (state.route === 'profile') renderProfile();
  });
  if (!location.hash) history.replaceState(null, '', '#home');
  await registerServiceWorker();
  try {
    await loadData();
  } catch (error) {
    console.error(error);
    main.innerHTML = `<div class="empty-state"><h2>Não foi possível iniciar</h2><p>Tente novamente em alguns instantes.</p></div>`;
  }
}

start();
