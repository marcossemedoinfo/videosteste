/**
 * FutStream — Agenda de Jogos ao Vivo + Player IPTV (.m3u / .m3u8)
 * Projeto estático zero-build compatível com execução local, GitHub Pages e Netlify.
 */

const STORAGE_KEYS = {
  playlists: 'futstream_playlists_v1',
  favorites: 'futstream_favorites_v1',
  localRawM3u: 'futstream_local_m3u_v1',
  customChannels: 'futstream_custom_channels_v1',
};

const DEFAULT_PLAYLISTS = [
  {
    id: 'iptv-org-sports',
    name: 'Esportes Abertos (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    tag: 'sports',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'iptv-org-br',
    name: 'Brasil TV Aberta (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/countries/br.m3u',
    tag: 'br',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'iptv-org-movies',
    name: 'Filmes Grátis / Abertos (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    tag: 'movies',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'iptv-org-series',
    name: 'Séries Grátis / Abertas (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/categories/series.m3u',
    tag: 'series',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'iptv-org-entertainment',
    name: 'Entretenimento Aberto (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    tag: 'entertainment',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'iptv-org-kids',
    name: 'Infantil & Desenhos (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    tag: 'kids',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'iptv-org-documentary',
    name: 'Documentários (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    tag: 'documentary',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'iptv-org-por',
    name: 'Canais em Português (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/languages/por.m3u',
    tag: 'por',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'iptv-org-news',
    name: 'Notícias ao Vivo (iptv-org)',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    tag: 'news',
    enabled: false,
    builtIn: true,
  },
  {
    id: 'free-tv-world',
    name: 'TV Aberta Mundial (Free-TV/IPTV)',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    tag: 'freetv',
    enabled: false,
    builtIn: true,
  },
];

const CHANNEL_FILTER_KEYWORDS = {
  custom: 'meus links',
  sports: 'sport',
  movies: 'movie',
  series: 'series',
  entertainment: 'entertainment',
  kids: 'kids',
  documentary: 'documentary',
  br: 'brazil',
};

const ESPN_LEAGUES = [
  { path: 'soccer/bra.1', label: 'Brasileirão Série A' },
  { path: 'soccer/bra.2', label: 'Brasileirão Série B' },
  { path: 'soccer/conmebol.libertadores', label: 'Copa Libertadores' },
  { path: 'soccer/conmebol.sudamericana', label: 'Copa Sul-Americana' },
  { path: 'soccer/uefa.champions', label: 'UEFA Champions League' },
  { path: 'soccer/eng.1', label: 'Premier League' },
  { path: 'soccer/esp.1', label: 'La Liga' },
  { path: 'soccer/ita.1', label: 'Serie A Italiana' },
  { path: 'soccer/ger.1', label: 'Bundesliga' },
  { path: 'soccer/fra.1', label: 'Ligue 1' },
  { path: 'soccer/por.1', label: 'Liga Portugal' },
  { path: 'soccer/arg.1', label: 'Liga Argentina' },
  { path: 'basketball/nba', label: 'NBA' },
  { path: 'soccer/all', label: 'Futebol Mundial' },
];

const CHANNELS_PAGE_SIZE = 60;

const state = {
  activeTab: 'matches',
  searchQuery: '',
  dateOffset: 0,
  statusFilter: 'all',
  leagueFilter: 'all',
  channelFilter: 'all',
  categoryFilter: 'all',
  httpsOnly: true,
  visibleChannelLimit: CHANNELS_PAGE_SIZE,
  matches: [],
  channels: [],
  isLoadingPlaylists: true,
  playlists: mergeBuiltInPlaylists(loadStoredJson(STORAGE_KEYS.playlists, DEFAULT_PLAYLISTS)),
  localRawLists: loadStoredJson(STORAGE_KEYS.localRawM3u, []),
  customChannels: loadStoredJson(STORAGE_KEYS.customChannels, []),
  favorites: new Set(loadStoredJson(STORAGE_KEYS.favorites, [])),
  hlsInstance: null,
  currentStreamUrl: '',
  currentMatch: null,
};

// ---------------- Utilitários ----------------

function mergeBuiltInPlaylists(stored) {
  const list = Array.isArray(stored) ? stored.slice() : [];
  const existingIds = new Set(list.map((p) => p.id));
  for (const def of DEFAULT_PLAYLISTS) {
    if (!existingIds.has(def.id)) {
      list.push(structuredClone(def));
    }
  }
  return list;
}

function loadStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignora caso localStorage esteja indisponível ou cheio
  }
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const NON_STREAM_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'youtu.be', 'twitch.tv', 'www.twitch.tv', 'dailymotion.com', 'www.dailymotion.com']);

function isSafeHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isDirectStreamUrl(url) {
  if (!isSafeHttpUrl(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return !NON_STREAM_HOSTS.has(host);
  } catch {
    return false;
  }
}

function formatDateYmd(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatMatchTime(isoDate) {
  if (!isoDate) return '--:--';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
  const words = String(name || 'TV').trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() || '').join('') || 'TV';
}

async function fetchTextWithProxyFallback(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (directError) {
    // Quando hospedado no Netlify (ou netlify dev), tenta fallback pela Netlify Function para listas sem CORS
    const proxyUrl = `/.netlify/functions/m3u-proxy?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      return await proxyRes.text();
    }
    throw directError;
  }
}

// ---------------- Parser M3U ----------------

function parseM3U(content, sourceTag = 'custom', sourceName = 'Lista') {
  const lines = String(content || '').replace(/\r/g, '').split('\n');
  const parsed = [];
  let pendingMeta = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const commaIdx = line.indexOf(',');
      const attrsPart = commaIdx >= 0 ? line.slice(0, commaIdx) : line;
      const title = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : 'Canal sem nome';
      const logoMatch = attrsPart.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = attrsPart.match(/group-title="([^"]*)"/i);
      const idMatch = attrsPart.match(/tvg-id="([^"]*)"/i);

      pendingMeta = {
        name: title || 'Canal sem nome',
        logo: logoMatch && isSafeHttpUrl(logoMatch[1]) ? logoMatch[1] : '',
        group: (groupMatch?.[1] || sourceName).split(';')[0].trim() || 'Geral',
        tvgId: idMatch?.[1] || '',
        sourceTag,
      };
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    if (isDirectStreamUrl(line)) {
      const meta = pendingMeta || {
        name: sourceName,
        logo: '',
        group: 'Direto',
        tvgId: '',
        sourceTag,
      };
      parsed.push({
        id: `${sourceTag}:${line}`,
        name: meta.name,
        logo: meta.logo,
        group: meta.group,
        tvgId: meta.tvgId,
        sourceTags: [meta.sourceTag],
        url: line,
        isHttps: line.startsWith('https://'),
      });
      pendingMeta = null;
    }
  }

  return parsed;
}

// ---------------- Carga de Jogos (ESPN Pública) ----------------

function parseEspnEvent(event, fallbackLeagueName) {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const competitors = comp.competitors || [];
  const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
  const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];
  if (!home || !away) return null;

  const statusType = event.status?.type || {};
  const broadcasts = [];
  for (const b of comp.broadcasts || []) {
    for (const name of b.names || []) {
      if (name && !broadcasts.includes(name)) broadcasts.push(name);
    }
  }

  return {
    id: String(event.id),
    league: fallbackLeagueName,
    date: event.date,
    timeLabel: formatMatchTime(event.date),
    state: statusType.state || 'pre', // 'in', 'pre', 'post'
    statusDetail: event.status?.displayClock && statusType.state === 'in'
      ? `${event.status.displayClock} • Ao Vivo`
      : statusType.state === 'post'
        ? 'Encerrado'
        : formatMatchTime(event.date),
    venue: comp.venue?.fullName || '',
    broadcasts,
    home: {
      name: home.team?.displayName || home.team?.shortDisplayName || 'Mandante',
      short: home.team?.abbreviation || '',
      logo: isSafeHttpUrl(home.team?.logo) ? home.team.logo : '',
      score: home.score ?? '0',
    },
    away: {
      name: away.team?.displayName || away.team?.shortDisplayName || 'Visitante',
      short: away.team?.abbreviation || '',
      logo: isSafeHttpUrl(away.team?.logo) ? away.team.logo : '',
      score: away.score ?? '0',
    },
  };
}

async function loadMatches() {
  const grid = document.getElementById('matchesGrid');
  grid.innerHTML = '<div class="skeleton-state">Buscando jogos ao vivo e agenda do dia...</div>';

  const ymd = formatDateYmd(state.dateOffset);
  const results = await Promise.allSettled(
    ESPN_LEAGUES.map(async (lg) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${lg.path}/scoreboard?dates=${ymd}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const leagueLabel = data.leagues?.[0]?.name || lg.label;
      return (data.events || [])
        .map((ev) => parseEspnEvent(ev, leagueLabel))
        .filter(Boolean);
    })
  );

  const byId = new Map();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const match of r.value) {
      if (!byId.has(match.id)) {
        byId.set(match.id, match);
      }
    }
  }

  const stateRank = { in: 0, pre: 1, post: 2 };
  state.matches = Array.from(byId.values()).sort((a, b) => {
    const rankDiff = (stateRank[a.state] ?? 3) - (stateRank[b.state] ?? 3);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  populateLeagueFilter();
  renderMatches();
  updateCounters();
}

function populateLeagueFilter() {
  const select = document.getElementById('leagueFilter');
  const prev = state.leagueFilter;
  const leagues = Array.from(new Set(state.matches.map((m) => m.league))).sort();

  select.innerHTML = '<option value="all">Todos os campeonatos</option>' +
    leagues.map((lg) => `<option value="${escapeHtml(lg)}">${escapeHtml(lg)}</option>`).join('');

  state.leagueFilter = leagues.includes(prev) ? prev : 'all';
  select.value = state.leagueFilter;
}

function renderMatches() {
  const grid = document.getElementById('matchesGrid');
  const q = state.searchQuery.trim().toLowerCase();

  const filtered = state.matches.filter((m) => {
    if (state.statusFilter !== 'all' && m.state !== state.statusFilter) return false;
    if (state.leagueFilter !== 'all' && m.league !== state.leagueFilter) return false;
    if (q) {
      const hay = `${m.home.name} ${m.away.name} ${m.league} ${m.broadcasts.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = '<div class="skeleton-state">Nenhum jogo encontrado para os filtros selecionados.</div>';
    return;
  }

  grid.innerHTML = filtered.map((m) => {
    const badgeClass = m.state === 'in' ? 'live' : m.state === 'post' ? 'post' : 'pre';
    const badgeText = m.state === 'in' ? `● ${escapeHtml(m.statusDetail)}` : escapeHtml(m.statusDetail);
    const showScore = m.state === 'in' || m.state === 'post';
    const broadcastLabel = m.broadcasts.length ? `📺 ${escapeHtml(m.broadcasts.join(', '))}` : '📡 Abrir no player';

    return `
      <article class="match-card ${m.state === 'in' ? 'is-live' : ''}" data-match-id="${escapeHtml(m.id)}" tabindex="0">
        <div class="match-top">
          <span class="league-pill">${escapeHtml(m.league)}</span>
          <span class="status-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="match-teams">
          <div class="team-row">
            <div class="team-info">
              ${m.home.logo ? `<img class="team-logo" src="${escapeHtml(m.home.logo)}" alt="" loading="lazy" />` : ''}
              <span class="team-name">${escapeHtml(m.home.name)}</span>
            </div>
            <span class="team-score">${showScore ? escapeHtml(m.home.score) : '-'}</span>
          </div>
          <div class="team-row">
            <div class="team-info">
              ${m.away.logo ? `<img class="team-logo" src="${escapeHtml(m.away.logo)}" alt="" loading="lazy" />` : ''}
              <span class="team-name">${escapeHtml(m.away.name)}</span>
            </div>
            <span class="team-score">${showScore ? escapeHtml(m.away.score) : '-'}</span>
          </div>
        </div>
        <div class="match-footer">
          <span class="broadcast-tag">${broadcastLabel}</span>
          <span class="watch-cta">Assistir ▶</span>
        </div>
      </article>
    `;
  }).join('');
}

// ---------------- Carga de Listas IPTV ----------------

function mergeChannelsIntoMap(channelMap, parsedChannels) {
  for (const ch of parsedChannels) {
    const existing = channelMap.get(ch.url);
    if (!existing) {
      channelMap.set(ch.url, ch);
      continue;
    }
    if (ch.isCustom) {
      existing.isCustom = true;
    }
    for (const tag of ch.sourceTags) {
      if (!existing.sourceTags.includes(tag)) {
        existing.sourceTags.push(tag);
      }
    }
  }
}

async function loadAllPlaylists() {
  state.isLoadingPlaylists = true;
  const enabled = state.playlists.filter((p) => p.enabled);
  const channelMap = new Map();

  const fetched = await Promise.allSettled(
    enabled.map(async (pl) => {
      const text = await fetchTextWithProxyFallback(pl.url);
      return parseM3U(text, pl.tag || 'custom', pl.name);
    })
  );

  const customMapped = state.customChannels
    .filter((c) => isSafeHttpUrl(c.url))
    .map((c) => ({
      id: `custom:${c.url}`,
      name: c.name || 'Meu Link',
      logo: '',
      group: c.group || 'Meus Links',
      tvgId: '',
      sourceTags: ['custom'],
      url: c.url,
      isHttps: c.url.startsWith('https://'),
      isCustom: true,
    }));
  mergeChannelsIntoMap(channelMap, customMapped);

  for (const res of fetched) {
    if (res.status === 'fulfilled') {
      mergeChannelsIntoMap(channelMap, res.value);
    }
  }

  for (const localList of state.localRawLists) {
    mergeChannelsIntoMap(channelMap, parseM3U(localList.content, 'local', localList.name));
  }

  state.channels = Array.from(channelMap.values());
  state.isLoadingPlaylists = false;
  populateCategoryFilter();
  renderChannels();
  renderPlaylistsManager();
  updateCounters();

  if (state.currentMatch) {
    const searchVal = document.getElementById('sidebarChannelSearch').value;
    renderSidebarChannels(getSuggestedChannelsForMatch(state.currentMatch), searchVal);
  }
}

function populateCategoryFilter() {
  const select = document.getElementById('categoryFilter');
  const prev = state.categoryFilter;
  const groups = Array.from(new Set(state.channels.map((c) => c.group))).sort();

  select.innerHTML = '<option value="all">Todas as categorias</option>' +
    groups.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');

  state.categoryFilter = groups.includes(prev) ? prev : 'all';
  select.value = state.categoryFilter;
}

function getFilteredChannels() {
  const q = state.searchQuery.trim().toLowerCase();
  const groupKeyword = CHANNEL_FILTER_KEYWORDS[state.channelFilter];

  return state.channels.filter((ch) => {
    if (state.httpsOnly && !ch.isHttps) return false;
    if (state.channelFilter === 'favorites' && !state.favorites.has(ch.url)) return false;
    if (groupKeyword && !ch.sourceTags.includes(state.channelFilter) && !ch.group.toLowerCase().includes(groupKeyword)) {
      return false;
    }
    if (state.categoryFilter !== 'all' && ch.group !== state.categoryFilter) return false;
    if (q && !`${ch.name} ${ch.group}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderChannels() {
  const grid = document.getElementById('channelsGrid');
  const infoBar = document.getElementById('channelsInfoBar');
  const loadMoreBtn = document.getElementById('loadMoreChannelsBtn');

  const filtered = getFilteredChannels();
  const visible = filtered.slice(0, state.visibleChannelLimit);

  infoBar.textContent = `Exibindo ${visible.length} de ${filtered.length} canais encontrados` +
    (state.httpsOnly ? ' (somente HTTPS compatíveis com navegador)' : '');

  if (!visible.length) {
    grid.innerHTML = '<div class="skeleton-state">Nenhum canal encontrado. Ajuste os filtros ou adicione uma lista em "Minhas Listas".</div>';
    loadMoreBtn.classList.add('hidden');
    return;
  }

  grid.innerHTML = visible.map((ch) => {
    const isFav = state.favorites.has(ch.url);
    return `
      <article class="channel-card" data-channel-url="${escapeHtml(ch.url)}">
        <div class="channel-card-top">
          ${ch.logo
            ? `<img class="channel-logo" src="${escapeHtml(ch.logo)}" alt="" loading="lazy" onerror="this.style.display='none'" />`
            : `<div class="channel-logo-fallback">${escapeHtml(getInitials(ch.name))}</div>`
          }
          <div class="channel-meta">
            <div class="channel-name" title="${escapeHtml(ch.name)}">${escapeHtml(ch.name)}</div>
            <div class="channel-group">${escapeHtml(ch.group)}</div>
          </div>
        </div>
        <div class="channel-card-bottom">
          <span class="proto-pill ${ch.isHttps ? 'https' : 'http'}">${ch.isHttps ? 'HTTPS' : 'HTTP (VLC)'}</span>
          <div class="channel-actions">
            ${ch.isCustom
              ? `<button class="btn-icon mini" type="button" data-delete-custom-url="${escapeHtml(ch.url)}" title="Remover link" aria-label="Remover ${escapeHtml(ch.name)}">✕</button>`
              : ''
            }
            <button
              class="fav-btn ${isFav ? 'active' : ''}"
              type="button"
              data-fav-url="${escapeHtml(ch.url)}"
              title="Favoritar canal"
              aria-label="Favoritar ${escapeHtml(ch.name)}"
            >${isFav ? '★' : '☆'}</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  loadMoreBtn.classList.toggle('hidden', visible.length >= filtered.length);
}

function renderPlaylistsManager() {
  const container = document.getElementById('playlistsList');
  const allItems = [
    ...state.playlists.map((p) => ({ ...p, kind: 'url' })),
    ...state.localRawLists.map((l) => ({ ...l, url: 'Lista local colada manualmente', enabled: true, kind: 'raw' })),
  ];

  container.innerHTML = allItems.map((item) => `
    <div class="playlist-item">
      <div class="playlist-item-info">
        <div class="playlist-item-title">${escapeHtml(item.name)}</div>
        <div class="playlist-item-url">${escapeHtml(item.url)}</div>
      </div>
      <div class="playlist-item-actions">
        ${item.kind === 'url'
          ? `<button class="btn btn-secondary compact" type="button" data-toggle-playlist="${escapeHtml(item.id)}">
              ${item.enabled ? 'Ativa' : 'Inativa'}
            </button>`
          : ''
        }
        ${!item.builtIn
          ? `<button class="btn-icon" type="button" data-delete-playlist="${escapeHtml(item.id)}" data-kind="${item.kind}" title="Remover">✕</button>`
          : ''
        }
      </div>
    </div>
  `).join('');
}

function updateCounters() {
  const liveCount = state.matches.filter((m) => m.state === 'in').length;
  document.getElementById('liveCountBadge').textContent = String(liveCount);
  document.getElementById('channelCountBadge').textContent = String(
    state.channels.filter((c) => !state.httpsOnly || c.isHttps).length
  );
}

// ---------------- Player HLS ----------------

function destroyHls() {
  if (state.hlsInstance) {
    state.hlsInstance.destroy();
    state.hlsInstance = null;
  }
  const video = document.getElementById('videoPlayer');
  video.removeAttribute('src');
  video.load();
}

function showPlayerOverlay(title, desc) {
  document.getElementById('overlayTitle').textContent = title;
  document.getElementById('overlayDesc').textContent = desc;
  document.getElementById('playerOverlayMessage').classList.remove('hidden');
}

function hidePlayerOverlay() {
  document.getElementById('playerOverlayMessage').classList.add('hidden');
}

function playStream(streamUrl, title = '') {
  if (!isSafeHttpUrl(streamUrl)) return;

  destroyHls();
  hidePlayerOverlay();
  state.currentStreamUrl = streamUrl;

  const video = document.getElementById('videoPlayer');
  const copyBtn = document.getElementById('copyStreamUrlBtn');
  const qualitySelect = document.getElementById('qualitySelect');

  copyBtn.classList.remove('hidden');
  qualitySelect.classList.add('hidden');
  qualitySelect.innerHTML = '<option value="-1">Qualidade: Auto</option>';

  if (title) {
    document.getElementById('playerModalSubtitle').textContent = `Reproduzindo: ${title}`;
  }

  // Bloqueio comum de conteúdo misto (stream HTTP em site HTTPS)
  if (window.location.protocol === 'https:' && streamUrl.startsWith('http://')) {
    showPlayerOverlay(
      'Stream HTTP bloqueado pelo navegador',
      'Sites em HTTPS não permitem reproduzir links http:// puros diretamente. Escolha um canal com selo HTTPS ou clique em "Copiar URL (VLC)" no topo para abrir no VLC Player.'
    );
    highlightActiveSidebarChannel(streamUrl);
    return;
  }

  if (window.Hls && window.Hls.isSupported() && !streamUrl.endsWith('.mp4')) {
    const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
    state.hlsInstance = hls;
    hls.loadSource(streamUrl);
    hls.attachMedia(video);

    hls.on(window.Hls.Events.MANIFEST_PARSED, (_evt, data) => {
      if (data.levels && data.levels.length > 1) {
        data.levels.forEach((lvl, idx) => {
          const label = lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)} kbps`;
          const opt = document.createElement('option');
          opt.value = String(idx);
          opt.textContent = label;
          qualitySelect.appendChild(opt);
        });
        qualitySelect.classList.remove('hidden');
      }
      video.play().catch(() => {});
    });

    hls.on(window.Hls.Events.ERROR, (_evt, data) => {
      if (!data.fatal) return;
      showPlayerOverlay(
        'Não foi possível carregar este stream',
        'O servidor do canal pode estar offline ou bloqueando CORS no navegador. Tente outro canal na lista ao lado ou copie a URL para abrir no VLC.'
      );
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl') || streamUrl.endsWith('.mp4')) {
    video.src = streamUrl;
    video.play().catch(() => {});
  } else {
    showPlayerOverlay('Formato não suportado neste navegador', 'Tente outro canal ou copie a URL para o VLC.');
  }

  highlightActiveSidebarChannel(streamUrl);
}

function getSuggestedChannelsForMatch(match) {
  const compatible = state.channels.filter((c) => c.isHttps || window.location.protocol !== 'https:');
  const keywords = [
    ...(match?.broadcasts || []),
    match?.league || '',
  ]
    .join(' ')
    .toLowerCase()
    .split(/[\s,/+-]+/)
    .filter((w) => w.length >= 3);

  const scored = compatible.map((ch) => {
    const nameLower = ch.name.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (nameLower.includes(kw)) score += 10;
    }
    if (ch.sourceTags.includes('sports') || ch.group.toLowerCase().includes('sport')) score += 3;
    if (state.favorites.has(ch.url)) score += 2;
    return { ch, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((item) => item.ch);
}

function renderSidebarChannels(channels, search = '') {
  const list = document.getElementById('sidebarChannelList');
  const q = search.trim().toLowerCase();
  const filtered = (q ? channels.filter((c) => `${c.name} ${c.group}`.toLowerCase().includes(q)) : channels).slice(0, 80);

  if (!filtered.length) {
    list.innerHTML = state.isLoadingPlaylists
      ? '<p class="muted-text">Carregando listas de canais...</p>'
      : '<p class="muted-text">Nenhum canal compatível encontrado.</p>';
    return;
  }

  list.innerHTML = filtered.map((ch) => `
    <button
      class="sidebar-channel-btn ${state.currentStreamUrl === ch.url ? 'active' : ''}"
      type="button"
      data-play-url="${escapeHtml(ch.url)}"
      data-play-name="${escapeHtml(ch.name)}"
    >
      <span>${escapeHtml(ch.name)}</span>
      <span class="proto-pill ${ch.isHttps ? 'https' : 'http'}">${ch.isHttps ? 'HD' : 'HTTP'}</span>
    </button>
  `).join('');
}

function highlightActiveSidebarChannel(url) {
  document.querySelectorAll('.sidebar-channel-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.playUrl === url);
  });
}

function openMatchPlayer(match) {
  state.currentMatch = match;
  state.currentStreamUrl = '';
  destroyHls();

  const modal = document.getElementById('playerModal');
  const liveBadge = document.getElementById('playerLiveBadge');
  const titleEl = document.getElementById('playerModalTitle');
  const subtitleEl = document.getElementById('playerModalSubtitle');

  liveBadge.textContent = match.state === 'in' ? 'AO VIVO' : match.statusDetail.toUpperCase();
  titleEl.textContent = `${match.home.name} ${match.state !== 'pre' ? `${match.home.score} x ${match.away.score}` : 'vs'} ${match.away.name}`;
  subtitleEl.textContent = match.broadcasts.length
    ? `${match.league} • Transmissão informada: ${match.broadcasts.join(', ')}`
    : `${match.league} • Escolha um canal aberto ou cole um link .m3u8`;

  const suggested = getSuggestedChannelsForMatch(match);
  document.getElementById('sidebarChannelsHeading').textContent = '📺 Canais Sugeridos / Esportes';
  document.getElementById('sidebarChannelSearch').value = '';
  renderSidebarChannels(suggested);

  showPlayerOverlay(
    'Escolha um canal para assistir',
    match.broadcasts.length
      ? `Emissora informada pela agenda: ${match.broadcasts.join(', ')}. Selecione um canal público na barra lateral ou cole uma URL .m3u8 acima dela.`
      : 'Selecione um dos canais abertos na barra lateral ou cole qualquer URL .m3u8 no campo ao lado.'
  );

  modal.classList.remove('hidden');
}

function openChannelPlayer(channel) {
  state.currentMatch = null;
  const modal = document.getElementById('playerModal');

  document.getElementById('playerLiveBadge').textContent = 'AO VIVO';
  document.getElementById('playerModalTitle').textContent = channel.name;
  document.getElementById('playerModalSubtitle').textContent = channel.group;
  document.getElementById('sidebarChannelsHeading').textContent = '📺 Trocar Canal';
  document.getElementById('sidebarChannelSearch').value = '';

  const allCompatible = getFilteredChannels();
  renderSidebarChannels(allCompatible.length ? allCompatible : state.channels);

  modal.classList.remove('hidden');
  playStream(channel.url, channel.name);
}

function closePlayer() {
  destroyHls();
  state.currentMatch = null;
  state.currentStreamUrl = '';
  document.getElementById('playerModal').classList.add('hidden');
}

// ---------------- Eventos ----------------

function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach((p) => {
        p.classList.toggle('active', p.id === `tab-${state.activeTab}`);
      });
    });
  });

  // Busca global
  document.getElementById('globalSearch').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    state.visibleChannelLimit = CHANNELS_PAGE_SIZE;
    renderMatches();
    renderChannels();
  });

  // Filtros de jogos
  document.querySelectorAll('.date-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.dateOffset = Number(chip.dataset.dateOffset || 0);
      document.querySelectorAll('.date-chip').forEach((c) => c.classList.toggle('active', c === chip));
      loadMatches();
    });
  });

  document.querySelectorAll('.status-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.statusFilter = chip.dataset.status;
      document.querySelectorAll('.status-chip').forEach((c) => c.classList.toggle('active', c === chip));
      renderMatches();
    });
  });

  document.getElementById('leagueFilter').addEventListener('change', (e) => {
    state.leagueFilter = e.target.value;
    renderMatches();
  });

  // Clique ou Enter em card de jogo
  const matchesGrid = document.getElementById('matchesGrid');
  matchesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.match-card');
    if (!card) return;
    const match = state.matches.find((m) => m.id === card.dataset.matchId);
    if (match) openMatchPlayer(match);
  });
  matchesGrid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.match-card');
    if (!card) return;
    e.preventDefault();
    const match = state.matches.find((m) => m.id === card.dataset.matchId);
    if (match) openMatchPlayer(match);
  });

  // Filtros de canais
  document.querySelectorAll('.channel-filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.channelFilter = chip.dataset.channelFilter;
      state.visibleChannelLimit = CHANNELS_PAGE_SIZE;
      document.querySelectorAll('.channel-filter-chip').forEach((c) => c.classList.toggle('active', c === chip));
      renderChannels();
    });
  });

  document.getElementById('categoryFilter').addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    state.visibleChannelLimit = CHANNELS_PAGE_SIZE;
    renderChannels();
  });

  document.getElementById('httpsOnlyToggle').addEventListener('change', (e) => {
    state.httpsOnly = e.target.checked;
    state.visibleChannelLimit = CHANNELS_PAGE_SIZE;
    renderChannels();
    updateCounters();
  });

  document.getElementById('loadMoreChannelsBtn').addEventListener('click', () => {
    state.visibleChannelLimit += CHANNELS_PAGE_SIZE;
    renderChannels();
  });

  // Clique em canal, remover link ou favorito
  document.getElementById('channelsGrid').addEventListener('click', async (e) => {
    const delBtn = e.target.closest('[data-delete-custom-url]');
    if (delBtn) {
      e.stopPropagation();
      const targetUrl = delBtn.dataset.deleteCustomUrl;
      state.customChannels = state.customChannels.filter((c) => c.url !== targetUrl);
      saveStoredJson(STORAGE_KEYS.customChannels, state.customChannels);
      await loadAllPlaylists();
      return;
    }

    const favBtn = e.target.closest('[data-fav-url]');
    if (favBtn) {
      e.stopPropagation();
      const url = favBtn.dataset.favUrl;
      if (state.favorites.has(url)) state.favorites.delete(url);
      else state.favorites.add(url);
      saveStoredJson(STORAGE_KEYS.favorites, Array.from(state.favorites));
      renderChannels();
      return;
    }

    const card = e.target.closest('.channel-card');
    if (!card) return;
    const channel = state.channels.find((c) => c.url === card.dataset.channelUrl);
    if (channel) openChannelPlayer(channel);
  });

  // Gerenciar Listas
  document.getElementById('addPlaylistForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('playlistNameInput').value.trim();
    const url = document.getElementById('playlistUrlInput').value.trim();
    if (!name || !isSafeHttpUrl(url)) return;

    state.playlists.push({
      id: `pl-${Date.now()}`,
      name,
      url,
      tag: 'custom',
      enabled: true,
      builtIn: false,
    });
    saveStoredJson(STORAGE_KEYS.playlists, state.playlists);
    e.target.reset();
    await loadAllPlaylists();
  });

  document.getElementById('directStreamForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('directStreamTitle').value.trim() || 'Stream Direto';
    const url = document.getElementById('directStreamUrl').value.trim();
    if (!isSafeHttpUrl(url)) return;
    openChannelPlayer({ name: title, group: 'Stream Direto', url, isHttps: url.startsWith('https://') });
  });

  document.getElementById('pasteM3uForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('pasteM3uName').value.trim();
    const content = document.getElementById('pasteM3uContent').value;
    if (!name || !content.trim()) return;

    state.localRawLists.push({ id: `raw-${Date.now()}`, name, content });
    saveStoredJson(STORAGE_KEYS.localRawM3u, state.localRawLists);
    e.target.reset();
    await loadAllPlaylists();
  });

  document.getElementById('playlistsList').addEventListener('click', async (e) => {
    const toggleBtn = e.target.closest('[data-toggle-playlist]');
    if (toggleBtn) {
      const target = state.playlists.find((p) => p.id === toggleBtn.dataset.togglePlaylist);
      if (target) {
        target.enabled = !target.enabled;
        saveStoredJson(STORAGE_KEYS.playlists, state.playlists);
        await loadAllPlaylists();
      }
      return;
    }

    const delBtn = e.target.closest('[data-delete-playlist]');
    if (delBtn) {
      const id = delBtn.dataset.deletePlaylist;
      if (delBtn.dataset.kind === 'raw') {
        state.localRawLists = state.localRawLists.filter((l) => l.id !== id);
        saveStoredJson(STORAGE_KEYS.localRawM3u, state.localRawLists);
      } else {
        state.playlists = state.playlists.filter((p) => p.id !== id);
        saveStoredJson(STORAGE_KEYS.playlists, state.playlists);
      }
      await loadAllPlaylists();
    }
  });

  // Modal Adicionar Link Manual
  const addLinkModal = document.getElementById('addLinkModal');
  const closeAddLink = () => addLinkModal.classList.add('hidden');

  document.getElementById('openAddLinkBtn').addEventListener('click', () => {
    addLinkModal.classList.remove('hidden');
    document.getElementById('addLinkTitle').focus();
  });
  document.getElementById('closeAddLinkBtn').addEventListener('click', closeAddLink);
  document.getElementById('closeAddLinkBackdrop').addEventListener('click', closeAddLink);

  document.getElementById('addLinkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('addLinkTitle').value.trim() || 'Meu Link';
    const group = document.getElementById('addLinkGroup').value.trim() || 'Meus Links';
    const url = document.getElementById('addLinkUrl').value.trim();
    const shouldSave = document.getElementById('addLinkSaveToggle').checked;
    if (!isSafeHttpUrl(url)) return;

    const channelObj = {
      name: title,
      group,
      url,
      isHttps: url.startsWith('https://'),
      isCustom: true,
    };

    if (shouldSave) {
      const exists = state.customChannels.some((c) => c.url === url);
      if (!exists) {
        state.customChannels.unshift({ name: title, group, url });
        saveStoredJson(STORAGE_KEYS.customChannels, state.customChannels);
      }
      await loadAllPlaylists();
    }

    e.target.reset();
    document.getElementById('addLinkGroup').value = 'Meus Links';
    document.getElementById('addLinkSaveToggle').checked = true;
    closeAddLink();
    openChannelPlayer(channelObj);
  });

  // Player modal controls
  document.getElementById('closePlayerBtn').addEventListener('click', closePlayer);
  document.getElementById('closePlayerBackdrop').addEventListener('click', closePlayer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('playerModal').classList.contains('hidden')) closePlayer();
      if (!addLinkModal.classList.contains('hidden')) closeAddLink();
    }
  });

  document.getElementById('qualitySelect').addEventListener('change', (e) => {
    if (state.hlsInstance) {
      state.hlsInstance.currentLevel = Number(e.target.value);
    }
  });

  document.getElementById('copyStreamUrlBtn').addEventListener('click', async () => {
    if (!state.currentStreamUrl) return;
    try {
      await navigator.clipboard.writeText(state.currentStreamUrl);
      const btn = document.getElementById('copyStreamUrlBtn');
      const prev = btn.textContent;
      btn.textContent = '✓ Copiado!';
      setTimeout(() => { btn.textContent = prev; }, 1600);
    } catch {
      window.prompt('Copie a URL abaixo:', state.currentStreamUrl);
    }
  });

  document.getElementById('modalCustomStreamForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('modalCustomStreamUrl').value.trim();
    if (!isSafeHttpUrl(url)) return;
    playStream(url, 'Stream personalizado');
  });

  document.getElementById('sidebarChannelSearch').addEventListener('input', (e) => {
    const baseList = state.currentMatch
      ? getSuggestedChannelsForMatch(state.currentMatch)
      : getFilteredChannels();
    renderSidebarChannels(baseList, e.target.value);
  });

  document.getElementById('sidebarChannelList').addEventListener('click', (e) => {
    const btn = e.target.closest('.sidebar-channel-btn');
    if (!btn) return;
    playStream(btn.dataset.playUrl, btn.dataset.playName);
  });

  document.getElementById('refreshAllBtn').addEventListener('click', () => {
    loadMatches();
    loadAllPlaylists();
  });
}

// ---------------- Inicialização ----------------

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadMatches();
  loadAllPlaylists();
  // Atualiza placares ao vivo automaticamente a cada 60 segundos
  setInterval(loadMatches, 60000);
});
