(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const Core = window.AtlasCore;
  const labels = { balanced: 'Equal-weight mean', performance: 'Performance', reliability: 'Reliability', scalability: 'Scalability', security: 'Security' };
  const tierNames = { tier1: 'Concepts & Tools', tier2: 'Constraints & Bounds', tier3: 'Abstract Goals', tier4: 'Achievements' };
  const buttons = new Map(), wrappers = new Map();
  let data, model, origin = null, achievement = null, domain = 'all', query = '', matrix = false;
  let phase = 'closed', session = 0, returnFocus = null, bubbleId = null, bubbleFocus = null;
  let drag = null, suppressClickUntil = 0, drawFrame = 0;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const el = (tag, cls, text) => {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const svgEl = (tag, attrs = {}, text) => {
    const item = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) item.setAttribute(k, v);
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const number = value => value === null ? 'Not scored' : `${Number(value.toFixed(2))}/10`;
  const inDomain = id => domain === 'all' || model.nodes.get(id).domains?.includes(domain);
  const currentPath = () => model.trace(achievement);
  const pause = ms => new Promise(resolve => setTimeout(resolve, motion.matches ? 0 : ms));

  fetch('data.json').then(response => {
    if (!response.ok) throw Error(`Data request failed (${response.status})`);
    return response.json();
  }).then(value => {
    data = value; model = Core.createModel(data); init();
  }).catch(error => {
    $('#selectionInfo').textContent = 'Unable to load the atlas. Upload the complete folder to a static host, or serve it over HTTP. Opening index.html as a local file is not supported.';
    console.error(error);
  });

  function init() {
    $('#nodeCount').textContent = model.nodes.size;
    $('#editorialNotice').textContent = data.editorialNotice;
    $('#dataWarnings').textContent = model.warnings.length
      ? `Data note: ${model.warnings.length} mapping entries are stored under a different tier key than their target node. They are routed to the target's actual tier and duplicate pairs are drawn once; the supplied data file has not been changed.`
      : 'The supplied data file has not been changed.';
    for (const [tier, nodes] of Object.entries(data.tiers)) {
      for (const node of nodes) $('#'+tier).append(makeNode(node, tier));
    }
    buildDomains();
    $('#search').addEventListener('input', event => { query = event.target.value.trim().toLowerCase(); refresh(); });
    $('#clear').onclick = () => {
      origin = achievement = null; domain = 'all'; query = ''; $('#search').value = '';
      buildDomains(); refresh();
    };
    $('#matrixToggle').onclick = () => {
      matrix = !matrix;
      $('#matrixToggle').setAttribute('aria-pressed', String(matrix));
      $('#matrixToggle').classList.toggle('active', matrix);
      $('#atlas').classList.toggle('matrix-on', matrix);
      for (const [id, button] of buttons) addScoreBars(button, model.nodes.get(id));
      scheduleLinks();
    };
    $('#explore').onclick = () => achievement && openCinema(achievement);
    $('#dropbar').onclick = () => achievement && openCinema(achievement);
    $('#closeCinema').onclick = closeCinema;
    $('#impactMode').onchange = renderBubbles;
    $('#bubbleZoom').onchange = () => $('#ringScroll').classList.toggle('zoomed', $('#bubbleZoom').checked);
    let downPoint = null;
    $('#cinema').addEventListener('pointerdown', event => { downPoint = { x: event.clientX, y: event.clientY, session }; });
    $('#cinema').addEventListener('click', event => {
      if (phase !== 'open' || (event.detail && downPoint?.session !== session)) return;
      if (downPoint && Math.hypot(event.clientX - downPoint.x, event.clientY - downPoint.y) > 10) return;
      if (!event.target.closest('[data-keep-open], .ring-node')) closeCinema();
    });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => { if (drag) endDrag(false); scheduleLinks(); });
    window.addEventListener('blur', () => endDrag(false));
    $('#page').addEventListener('transitionend', event => {
      if (event.target === $('#page') && event.propertyName === 'transform') scheduleLinks();
    });
    if ('ResizeObserver' in window) new ResizeObserver(scheduleLinks).observe($('#atlas'));
    if (document.fonts) document.fonts.ready.then(scheduleLinks);
    refresh();
  }

  function buildDomains() {
    $('#domains').replaceChildren();
    for (const item of [{ id: 'all', label: 'All domains' }, ...data.domains]) {
      const button = el('button', 'domain-pill' + (domain === item.id ? ' active' : ''), item.label);
      button.setAttribute('aria-pressed', String(domain === item.id));
      button.onclick = () => {
        domain = item.id;
        if (achievement && !inDomain(achievement)) achievement = null;
        if (origin && model.tierOf.get(origin) === 'tier4' && !inDomain(origin)) origin = null;
        buildDomains(); refresh();
      };
      $('#domains').append(button);
    }
  }

  function makeNode(node, tier) {
    const wrap = el('div', 'node-wrap');
    const button = el('button', `node t${tier.slice(-1)}`);
    button.dataset.id = node.id;
    button.dataset.tier = tier;
    button.append(el('span', 'label', node.label));
    const parent = node.parentId ? model.nodes.get(node.parentId).label : null;
    button.append(el('span', 'meta', parent ? `↳ ${parent}` : `TIER ${tier.slice(-1)} · ROOT`));
    button.title = parent ? `${node.label} — parent: ${parent}` : node.label;
    button.onclick = () => {
      if (phase !== 'closed' || performance.now() < suppressClickUntil) return;
      choose(node.id); refresh();
    };
    wrap.append(button);
    if (tier === 'tier4') {
      wrap.classList.add('achievement-wrap');
      const handle = el('button', 'drag-handle', '⠿');
      handle.setAttribute('aria-label', `Drag ${node.label}; press Enter to open its bubble view`);
      handle.title = 'Drag to the glass bar, or click to explore';
      handle.onclick = () => {
        if (performance.now() >= suppressClickUntil) openCinema(node.id);
      };
      handle.addEventListener('pointerdown', event => beginDrag(event, node.id));
      button.addEventListener('pointerdown', event => beginDrag(event, node.id));
      for (const target of [handle, button]) target.addEventListener('contextmenu', event => event.preventDefault());
      wrap.append(handle);
    }
    buttons.set(node.id, button); wrappers.set(node.id, wrap);
    return wrap;
  }

  function choose(id) {
    if (model.tierOf.get(id) === 'tier4') {
      // Keep a lower origin only when this achievement really reaches it.
      const keepOrigin = origin && model.tierOf.get(origin) !== 'tier4' && model.candidates(origin).includes(id);
      if (!keepOrigin) origin = id;
      achievement = id;
    } else {
      origin = id; achievement = null;
    }
  }

  function refresh() {
    const path = currentPath();
    const candidates = origin && model.tierOf.get(origin) !== 'tier4' ? model.candidates(origin) : [];
    const lit = new Set(achievement ? path.ids : candidates);
    if (origin) lit.add(origin);
    let visible = 0, visibleAchievements = 0;
    for (const [id, button] of buttons) {
      const node = model.nodes.get(id), tier = model.tierOf.get(id);
      const matchesDomain = tier !== 'tier4' || inDomain(id);
      const matchesSearch = tier !== 'tier4' || !query || `${node.label} ${id}`.toLowerCase().includes(query) ||
        (node.domains || []).some(d => data.domains.find(item => item.id === d)?.label.toLowerCase().includes(query));
      const pinned = id === origin || path.ids.has(id);
      const shown = matchesDomain && (matchesSearch || pinned);
      wrappers.get(id).classList.toggle('filtered', !shown);
      if (shown) { visible++; if (tier === 'tier4') visibleAchievements++; }
      button.classList.toggle('selected', id === origin);
      button.classList.toggle('related', lit.has(id) && id !== origin);
      button.classList.toggle('active-achievement', id === achievement);
      button.classList.toggle('dimmed', Boolean(origin) && !lit.has(id));
      button.setAttribute('aria-pressed', String(id === origin || id === achievement));
      button.setAttribute('aria-label', `${node.label}, Tier ${tier.slice(-1)}${id === origin ? ', original source' : ''}${id === achievement ? ', active achievement' : candidates.includes(id) ? ', reachable achievement' : ''}`);
    }
    $('#empty').classList.toggle('hidden', visible > 0);
    $('#achievementEmpty').classList.toggle('hidden', visibleAchievements > 0);
    $('#explore').disabled = !achievement;
    if (!origin) $('#selectionInfo').textContent = 'Select any node to begin. The white outline will mark your original source.';
    else if (achievement) {
      $('#selectionInfo').textContent = `${model.nodes.get(origin).label} → ${model.nodes.get(achievement).label} · ${path.ids.size - 1} related nodes · ${path.edges.length} recorded links.`;
    } else {
      const available = candidates.filter(id => !wrappers.get(id).classList.contains('filtered')).length;
      $('#selectionInfo').textContent = candidates.length
        ? `${model.nodes.get(origin).label} · ${candidates.length} reachable achievements (${available} visible). Choose a highlighted achievement to expand its path.`
        : `${model.nodes.get(origin).label} · No achievement path is recorded for this node. Missing links are not inferred from its parent category.`;
    }
    renderPathList(path);
    scheduleLinks();
  }

  function renderPathList(path) {
    const host = $('#pathList'); host.replaceChildren();
    $('#pathCount').textContent = path.edges.length ? `(${path.edges.length} path links)` : '';
    if (!achievement) host.append(el('p', '', 'Select an achievement to see its explicit path.'));
    else {
      const list = el('ul', 'path-list');
      for (const edge of path.edges) list.append(el('li', '', `${model.nodes.get(edge.from).label} → ${model.nodes.get(edge.to).label}`));
      host.append(list);
    }
    if (origin) {
      const hierarchy = model.edges.filter(e => e.kind === 'hierarchy' && (e.from === origin || e.to === origin));
      if (hierarchy.length) {
        host.append(el('h3', '', 'Source hierarchy (not an impact path)'));
        const list = el('ul', 'path-list');
        for (const edge of hierarchy) list.append(el('li', '', `${model.nodes.get(edge.from).label} → ${model.nodes.get(edge.to).label}`));
        host.append(list);
      }
    }
  }

  function addScoreBars(button, node) {
    button.querySelector('.score-bars')?.remove();
    if (!matrix) return;
    const box = el('span', 'score-bars');
    for (const dimension of Core.DIMENSIONS) {
      const value = Core.score(node, dimension), row = el('span', 'score-row');
      row.title = `${labels[dimension]}: ${number(value)}`;
      row.append(el('span', 'score-initial', labels[dimension].slice(0, 1)));
      const track = el('span', 'score-track'), bar = el('i');
      bar.style.width = `${value === null ? 0 : value * 10}%`; track.append(bar);
      row.append(track, el('span', 'score-number', value === null ? '—' : String(value)));
      box.append(row);
    }
    button.append(box);
  }

  function scheduleLinks() {
    cancelAnimationFrame(drawFrame); drawFrame = requestAnimationFrame(drawLinks);
  }
  function drawLinks() {
    const svg = $('#links'), bounds = $('#atlas').getBoundingClientRect();
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    if (!achievement) return;
    // Mask every card so genuine graph edges never cover node labels.
    const defs = svgEl('defs'), mask = svgEl('mask', { id: 'cardMask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: bounds.width, height: bounds.height });
    mask.append(svgEl('rect', { width: bounds.width, height: bounds.height, fill: 'white' }));
    const boxes = new Map();
    for (const [id, button] of buttons) {
      if (wrappers.get(id).classList.contains('filtered')) continue;
      const r = button.getBoundingClientRect();
      const box = { x: r.left - bounds.left, y: r.top - bounds.top, width: r.width, height: r.height };
      boxes.set(id, box);
      mask.append(svgEl('rect', { x: box.x - 2, y: box.y - 2, width: box.width + 4, height: box.height + 4, rx: 10, fill: 'black' }));
    }
    defs.append(mask); svg.append(defs);
    const group = svgEl('g', { mask: 'url(#cardMask)' });
    for (const edge of currentPath().edges) {
      const from = boxes.get(edge.from), to = boxes.get(edge.to);
      if (!from || !to) continue;
      const x1 = from.x + from.width / 2, y1 = from.y + from.height / 2;
      const x2 = to.x + to.width / 2, y2 = to.y + to.height / 2, mid = (y1 + y2) / 2;
      group.append(svgEl('path', { d: `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`, class: 'link-path' }));
    }
    svg.append(group);
  }

  function beginDrag(event, id) {
    if (phase !== 'closed' || event.button !== 0 || drag) return;
    drag = { id, pointerId: event.pointerId, target: event.currentTarget, x: event.clientX, y: event.clientY, active: false, ghost: null };
    drag.holdTimer = setTimeout(() => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag.armed = true; moveDrag(event);
    }, 260);
    drag.target.setPointerCapture(event.pointerId);
    drag.target.addEventListener('pointermove', moveDrag);
    drag.target.addEventListener('pointerup', releaseDrag);
    drag.target.addEventListener('pointercancel', cancelDrag);
    drag.target.addEventListener('lostpointercapture', cancelDrag);
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.active && !drag.armed && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
    clearTimeout(drag.holdTimer);
    if (event.cancelable) event.preventDefault();
    if (!drag.active) {
      drag.active = true;
      drag.ghost = el('div', 'drag-ghost', model.nodes.get(drag.id).label);
      drag.ghost.setAttribute('aria-hidden', 'true'); document.body.append(drag.ghost);
      buttons.get(drag.id).classList.add('dragging');
      document.body.classList.add('is-dragging'); $('#dropbar').classList.add('visible');
    }
    drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
    const rect = $('#dropbar').getBoundingClientRect();
    const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
    const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
    const attraction = Math.max(0, 1 - Math.hypot(dx, dy) / 100);
    drag.ghost.classList.toggle('near', attraction > .1);
    drag.ghost.style.transform = `translate(-50%,-50%) scale(${1 - attraction * .85})`;
    drag.ghost.style.filter = `blur(${attraction * 2}px)`;
    drag.over = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    $('#dropbar').classList.toggle('over', drag.over);
    if (drag.over && !drag.dropTimer) drag.dropTimer = setTimeout(() => endDrag(true), motion.matches ? 80 : 160);
    if (!drag.over) { clearTimeout(drag.dropTimer); drag.dropTimer = null; }
  }
  function releaseDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    moveDrag(event); endDrag(true);
  }
  function cancelDrag() { endDrag(false); }
  function endDrag(commit) {
    if (!drag) return;
    const current = drag; drag = null;
    clearTimeout(current.holdTimer); clearTimeout(current.dropTimer);
    const rect = current.ghost?.getBoundingClientRect();
    current.target.removeEventListener('pointermove', moveDrag);
    current.target.removeEventListener('pointerup', releaseDrag);
    current.target.removeEventListener('pointercancel', cancelDrag);
    current.target.removeEventListener('lostpointercapture', cancelDrag);
    if (current.target.hasPointerCapture(current.pointerId)) current.target.releasePointerCapture(current.pointerId);
    if (current.active) suppressClickUntil = performance.now() + 400;
    current.ghost?.remove(); buttons.get(current.id).classList.remove('dragging');
    document.body.classList.remove('is-dragging'); $('#dropbar').classList.remove('visible', 'over');
    if (commit && current.active && current.over) openCinema(current.id, rect);
  }

  async function openCinema(id, startRect) {
    if (phase !== 'closed' || model.tierOf.get(id) !== 'tier4') return;
    choose(id); refresh();
    phase = 'opening'; const token = ++session; bubbleId = id; bubbleFocus = null;
    returnFocus = document.activeElement;
    $('#cinemaTitle').textContent = model.nodes.get(id).label;
    $('#bubbleZoom').checked = false; $('#ringScroll').classList.remove('zoomed');
    renderBubbles();
    const modal = $('#cinema');
    modal.inert = false; modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open', 'preparing'); modal.classList.remove('closing');
    $('#closeCinema').focus({ preventScroll: true });
    $('#page').inert = true; $('#page').setAttribute('aria-hidden', 'true');
    document.body.classList.add('modal-open');
    $('#dropbar').classList.add('visible', 'absorbing');
    const rect = startRect || buttons.get(id).getBoundingClientRect();
    const ghost = el('div', 'absorb-ghost', model.nodes.get(id).label);
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    document.body.append(ghost);
    const bar = $('#dropbar').getBoundingClientRect();
    if (!motion.matches && ghost.animate) {
      const animation = ghost.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1, filter: 'blur(0px)' },
        { transform: `translate(${bar.left + bar.width / 2 - rect.left - rect.width / 2}px,${bar.top + bar.height / 2 - rect.top - rect.height / 2}px) scale(.08)`, opacity: 0, filter: 'blur(5px)' }
      ], { duration: 360, easing: 'cubic-bezier(.3,0,.7,1)', fill: 'forwards' });
      animations.add(animation);
      await animation.finished.catch(() => {}); animations.delete(animation);
    }
    ghost.remove();
    if (token !== session) return;
    $('#dropbar').classList.add('docked');
    await pause(420);
    if (token !== session) return;
    modal.classList.remove('preparing'); phase = 'open';
  }

  async function closeCinema() {
    if (phase === 'closed' || phase === 'closing') return;
    phase = 'closing'; const token = ++session;
    for (const animation of animations) animation.cancel();
    animations.clear();
    $('.absorb-ghost')?.remove();
    $('#cinema').classList.add('closing');
    $('#dropbar').classList.remove('visible', 'absorbing', 'docked', 'over');
    await pause(180);
    if (token !== session) return;
    $('#cinema').classList.remove('open', 'preparing', 'closing');
    $('#page').inert = false; $('#page').removeAttribute('aria-hidden');
    document.body.classList.remove('modal-open'); phase = 'closed';
    const target = returnFocus && returnFocus !== document.body && returnFocus.isConnected ? returnFocus : buttons.get(achievement);
    target?.focus({ preventScroll: true });
    $('#cinema').inert = true; $('#cinema').setAttribute('aria-hidden', 'true');
    scheduleLinks();
  }

  function renderBubbles() {
    if (!bubbleId) return;
    const trace = model.trace(bubbleId), mode = $('#impactMode').value;
    const items = [...trace.ids].filter(id => id !== bubbleId).map(id => model.nodes.get(id));
    items.sort((a, b) => model.tierOf.get(b.id).localeCompare(model.tierOf.get(a.id)) || a.label.localeCompare(b.label));
    const layout = Core.rings(items), svg = $('#ringSvg');
    svg.replaceChildren(); svg.setAttribute('viewBox', `0 0 ${layout.size} ${layout.size}`);
    svg.style.setProperty('--diagram-size', `${layout.size}px`);
    const center = layout.size / 2;
    const rings = new Set(layout.positions.map(p => p.ring));
    for (const ring of rings) svg.append(svgEl('circle', { cx: center, cy: center, r: 180 + ring * 110, class: 'ring-guide', 'aria-hidden': 'true' }));
    svg.append(svgEl('circle', { cx: center, cy: center + 5, r: 106, class: 'ring-center-orb', 'aria-hidden': 'true' }));
    svg.append(svgEl('text', { x: center, y: center - 35, class: 'ring-center-kicker', 'text-anchor': 'middle', 'aria-hidden': 'true' }, 'CONNECTED TO'));
    const words = model.nodes.get(bubbleId).label.split(' '), lines = []; let line = '';
    for (const word of words) {
      if ((line + ' ' + word).trim().length > 19 && line) { lines.push(line); line = word; }
      else line = (line + ' ' + word).trim();
    }
    if (line) lines.push(line);
    lines.forEach((text, i) => svg.append(svgEl('text', { x: center, y: center - 7 + i * 23, class: 'ring-center-title', 'text-anchor': 'middle', 'aria-hidden': 'true' }, text)));
    svg.append(svgEl('text', { x: center, y: center + 65, class: 'ring-center-kicker', 'text-anchor': 'middle', 'aria-hidden': 'true' }, `${items.length} RELATED NODES`));
    $('#bubbleList').replaceChildren();
    layout.positions.forEach((position, index) => {
      const node = model.nodes.get(position.id), value = Core.score(node, mode), radius = Core.radius(value);
      const group = svgEl('g', { class: 'ring-node', transform: `translate(${position.x},${position.y})`, role: 'button', tabindex: '0', 'data-bubble-id': node.id, 'aria-label': `${index + 1}. ${node.label}, ${labels[mode]}: ${number(value)}` });
      group.style.setProperty('--bubble-color', `hsl(${position.hue} 72% 67%)`);
      group.append(svgEl('title', {}, `${node.label} · ${tierNames[model.tierOf.get(node.id)]} · ${labels[mode]}: ${number(value)}`));
      group.append(svgEl('circle', { r: Math.max(25, radius), class: 'bubble-hit', fill: 'transparent' }));
      const shape = svgEl('g', { class: 'bubble-pop' });
      shape.style.setProperty('--pop-delay', `${Math.min(index * 14, 280)}ms`);
      shape.append(svgEl('circle', { r: radius, class: 'score-circle' + (value === null ? ' unscored' : '') }));
      shape.append(svgEl('text', { 'text-anchor': 'middle', dy: '.35em', class: 'bubble-number' }, index + 1));
      group.append(shape);
      const pick = () => inspectBubble(node.id);
      group.addEventListener('click', pick);
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(); }
      });
      svg.append(group);
      const li = el('li'), button = el('button', 'bubble-list-button');
      button.dataset.bubbleId = node.id;
      button.append(el('span', 'list-number', String(index + 1)), el('span', 'list-label', node.label), el('span', 'list-score', number(value)));
      button.onclick = pick; li.append(button); $('#bubbleList').append(li);
    });
    $('#bubbleListTitle').textContent = `${items.length} related nodes · ${labels[mode]}`;
    if (items.length) inspectBubble(items.some(n => n.id === bubbleFocus) ? bubbleFocus : items[0].id);
    else $('#bubbleDetails').textContent = 'No related nodes are recorded for this achievement.';
  }

  function inspectBubble(id) {
    bubbleFocus = id;
    const node = model.nodes.get(id), detail = $('#bubbleDetails'); detail.replaceChildren();
    detail.append(el('span', 'detail-tier', `TIER ${model.tierOf.get(id).slice(-1)} · ${tierNames[model.tierOf.get(id)]}`), el('h3', '', node.label));
    const list = el('dl', 'dimension-values');
    for (const dimension of Core.DIMENSIONS) list.append(el('dt', '', labels[dimension]), el('dd', '', number(Core.score(node, dimension))));
    detail.append(list, el('p', 'detail-note', `Displayed area: ${labels[$('#impactMode').value]} · ${number(Core.score(node, $('#impactMode').value))}. Provisional node rating, not measured impact.`));
    if (node.parentId) detail.append(el('p', 'detail-note', `Parent category: ${model.nodes.get(node.parentId).label}`));
    const via = model.trace(bubbleId).edges.filter(edge => edge.to === id).map(edge => model.nodes.get(edge.from).label);
    detail.append(el('p', 'detail-note', `Recorded link from: ${via.join(', ') || 'none'}.`));
    for (const item of document.querySelectorAll('[data-bubble-id]')) {
      const active = item.dataset.bubbleId === id;
      item.classList.toggle('inspected', active); item.setAttribute('aria-pressed', String(active));
    }
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      if (drag) endDrag(false);
      else closeCinema();
      return;
    }
    if (phase !== 'closed') {
      if (event.key !== 'Tab') return;
      const focusable = [...$('#cinema').querySelectorAll('button, select, input, [tabindex="0"]')].filter(item => !item.disabled && item.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !$('#cinema').contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !$('#cinema').contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); $('#search').focus();
    }
  }
})();
