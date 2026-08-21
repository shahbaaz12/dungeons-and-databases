const workloads = {
  hot: {
    kicker: 'Repeated customer dashboard',
    title: 'Four-page working set',
    sequence: [3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6]
  },
  local: {
    kicker: 'Recent orders from one district',
    title: 'Eight-page working set',
    sequence: [8, 9, 10, 11, 12, 13, 14, 15, 8, 10, 12, 14, 9, 11, 13, 15, 8, 9, 10, 11, 12, 13, 14, 15]
  },
  wide: {
    kicker: 'Random history across six years',
    title: 'Sixteen-page working set',
    sequence: [1, 14, 27, 6, 19, 31, 10, 23, 3, 16, 29, 8, 21, 0, 12, 25, 1, 14, 27, 6, 19, 31, 10, 23, 3, 16, 29, 8, 21, 0, 12, 25]
  }
};

let savedPatterns = [];
try {
  savedPatterns = JSON.parse(localStorage.getItem('dnd-lesson-02-patterns') || '[]');
} catch {
  localStorage.removeItem('dnd-lesson-02-patterns');
}

const state = {
  workload: 'hot',
  capacity: 8,
  frames: [],
  hand: 0,
  index: 0,
  hits: 0,
  loads: 0,
  evictions: 0,
  lastPage: null,
  lastFrame: null,
  lastEvictedFrame: null,
  running: false,
  explored: new Set((Array.isArray(savedPatterns) ? savedPatterns : []).filter((id) => Object.hasOwn(workloads, id)))
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  simulator: $('#buffer-simulator'),
  workloadKicker: $('[data-workload-kicker]'),
  workloadTitle: $('[data-workload-title]'),
  frameCount: $('[data-frame-count]'),
  frameLabel: $('[data-frame-label]'),
  accessSequence: $('[data-access-sequence]'),
  diskPages: $('[data-disk-pages]'),
  bufferFrames: $('[data-buffer-frames]'),
  ioGate: $('.io-gate'),
  ioIcon: $('[data-io-icon]'),
  ioState: $('[data-io-state]'),
  ioDetail: $('[data-io-detail]'),
  clockPosition: $('[data-clock-position]'),
  reset: $('[data-reset]'),
  step: $('[data-step]'),
  run: $('[data-run]'),
  dragonResponse: $('[data-dragon-response]'),
  progressBar: $('[data-progress-bar]'),
  progressLabel: $('[data-progress-label]')
};

function setDragon(message, tone = 'neutral') {
  elements.dragonResponse.dataset.tone = tone;
  const heading = elements.dragonResponse.querySelector('span');
  heading.textContent = tone === 'success' ? 'The Archivist approves' : tone === 'warning' ? 'The Archivist warns' : 'The Archivist is watching';
  elements.dragonResponse.querySelector('p').textContent = message;
}

function updateProgress() {
  const count = state.explored.size;
  elements.progressLabel.textContent = `${count} / 3`;
  elements.progressBar.style.setProperty('--progress', `${(count / 3) * 100}%`);
}

function createEmptyFrames() {
  state.frames = Array.from({ length: state.capacity }, () => null);
}

function renderDisk() {
  const residentPages = new Set(state.frames.filter(Boolean).map((frame) => frame.page));
  elements.diskPages.replaceChildren(...Array.from({ length: 32 }, (_, page) => {
    const item = document.createElement('span');
    item.className = 'disk-page';
    item.textContent = String(page).padStart(2, '0');
    item.dataset.inBuffer = String(residentPages.has(page));
    item.dataset.current = String(state.lastPage === page);
    item.setAttribute('aria-label', `Disk page ${page}${residentPages.has(page) ? ', copied in buffer pool' : ''}`);
    return item;
  }));
}

function renderFrames() {
  elements.bufferFrames.replaceChildren(...state.frames.map((frame, index) => {
    const item = document.createElement('div');
    item.className = 'buffer-frame';
    item.dataset.filled = String(Boolean(frame));
    item.dataset.current = String(index === state.lastFrame);
    item.dataset.evicted = String(index === state.lastEvictedFrame);
    item.dataset.hand = String(index === state.hand);

    const label = document.createElement('span');
    label.textContent = `Frame ${index + 1}`;
    const value = document.createElement('strong');
    value.textContent = frame ? `Page ${frame.page}` : 'Empty';
    const usage = document.createElement('small');
    usage.textContent = frame ? `usage ${frame.usage} / 5` : 'available';
    item.append(label, value, usage);
    return item;
  }));
  elements.clockPosition.textContent = `Frame ${state.hand + 1}`;
}

function renderSequence() {
  const sequence = workloads[state.workload].sequence;
  elements.accessSequence.replaceChildren(...sequence.map((page, index) => {
    const item = document.createElement('i');
    item.textContent = page;
    if (index < state.index) item.dataset.state = 'past';
    if (index === state.index) item.dataset.state = 'current';
    item.setAttribute('aria-label', `Access ${index + 1}: page ${page}`);
    return item;
  }));
}

function renderMetrics() {
  const accesses = state.hits + state.loads;
  const ratio = accesses === 0 ? 0 : Math.round((state.hits / accesses) * 100);
  const cost = state.hits + state.loads * 1000;
  $('[data-metric="accesses"]').textContent = accesses;
  $('[data-total-accesses]').textContent = `of ${workloads[state.workload].sequence.length}`;
  $('[data-metric="hits"]').textContent = state.hits;
  $('[data-hit-ratio]').textContent = `${ratio}% hit ratio`;
  $('[data-metric="loads"]').textContent = state.loads;
  $('[data-metric="evictions"]').textContent = state.evictions;
  $('[data-metric="cost"]').textContent = cost.toLocaleString();
}

function renderControls() {
  const complete = state.index >= workloads[state.workload].sequence.length;
  elements.step.disabled = state.running || complete;
  elements.run.disabled = state.running || complete;
  elements.reset.disabled = state.running || state.index === 0;
  elements.frameCount.disabled = state.running;
  $$('.workload-tab').forEach((tab) => { tab.disabled = state.running; });
  elements.run.textContent = state.running ? 'Running…' : complete ? 'Trace complete' : 'Run remaining';
}

function renderAll() {
  renderDisk();
  renderFrames();
  renderSequence();
  renderMetrics();
  renderControls();
}

function resetSimulation(message = true) {
  if (state.running) return;
  createEmptyFrames();
  state.hand = 0;
  state.index = 0;
  state.hits = 0;
  state.loads = 0;
  state.evictions = 0;
  state.lastPage = null;
  state.lastFrame = null;
  state.lastEvictedFrame = null;
  elements.ioGate.removeAttribute('data-state');
  elements.ioIcon.textContent = '?';
  elements.ioState.textContent = 'Awaiting access';
  elements.ioDetail.textContent = 'Choose Next access or Run remaining';
  if (message) setDragon('The pool is empty again. The first touch of every page must come from disk.');
  renderAll();
}

function findVictimFrame() {
  const emptyIndex = state.frames.findIndex((frame) => frame === null);
  if (emptyIndex !== -1) {
    state.hand = emptyIndex;
    return emptyIndex;
  }

  while (true) {
    const frame = state.frames[state.hand];
    if (frame.usage === 0) return state.hand;
    frame.usage -= 1;
    state.hand = (state.hand + 1) % state.capacity;
  }
}

function completePattern() {
  state.explored.add(state.workload);
  localStorage.setItem('dnd-lesson-02-patterns', JSON.stringify([...state.explored]));
  updateProgress();

  const accesses = state.hits + state.loads;
  const hitRatio = Math.round((state.hits / accesses) * 100);
  if (state.workload === 'wide') {
    setDragon(`Only ${hitRatio}% of accesses hit memory. The working set is wider than the ${state.capacity}-frame pool, so useful pages are continually displaced. This is thrashing.`, 'warning');
  } else if (state.capacity >= new Set(workloads[state.workload].sequence).size) {
    setDragon(`${hitRatio}% of accesses hit memory. Once the working set warmed up, its pages survived because traffic touched them again before eviction.`, 'success');
  } else {
    setDragon(`The access pattern is local, but ${state.capacity} frames cannot hold all of its hot pages. Add frames and run the same trace again.`, 'warning');
  }
}

function accessNextPage() {
  const sequence = workloads[state.workload].sequence;
  if (state.index >= sequence.length) return false;

  const page = sequence[state.index];
  state.lastPage = page;
  state.lastEvictedFrame = null;
  const hitIndex = state.frames.findIndex((frame) => frame?.page === page);

  if (hitIndex !== -1) {
    state.hits += 1;
    state.frames[hitIndex].usage = Math.min(5, state.frames[hitIndex].usage + 1);
    state.lastFrame = hitIndex;
    elements.ioGate.dataset.state = 'hit';
    elements.ioIcon.textContent = '✓';
    elements.ioState.textContent = `Buffer hit · page ${page}`;
    elements.ioDetail.textContent = 'Served from a page already in RAM';
  } else {
    state.loads += 1;
    const victim = findVictimFrame();
    if (state.frames[victim]) {
      state.evictions += 1;
      state.lastEvictedFrame = victim;
    }
    state.frames[victim] = { page, usage: 1 };
    state.lastFrame = victim;
    state.hand = (victim + 1) % state.capacity;
    elements.ioGate.dataset.state = 'miss';
    elements.ioIcon.textContent = '↓';
    elements.ioState.textContent = `Disk load · page ${page}`;
    elements.ioDetail.textContent = state.lastEvictedFrame === null ? 'Copied into an empty frame' : `Reused frame ${victim + 1}`;
  }

  state.index += 1;
  renderAll();
  if (state.index >= sequence.length) completePattern();
  return true;
}

function selectWorkload(id) {
  if (state.running) return;
  state.workload = id;
  const workload = workloads[id];
  $$('.workload-tab').forEach((tab) => {
    const active = tab.dataset.workload === id;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  elements.simulator.setAttribute('aria-labelledby', `workload-${id}`);
  elements.workloadKicker.textContent = workload.kicker;
  elements.workloadTitle.textContent = workload.title;
  resetSimulation(false);
  const distinct = new Set(workload.sequence).size;
  setDragon(`${distinct} distinct pages will compete for ${state.capacity} frames. Predict the result, then run the trace.`);
}

function runRemaining() {
  if (state.running || state.index >= workloads[state.workload].sequence.length) return;
  state.running = true;
  renderControls();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = reducedMotion ? 20 : 150;

  const timer = window.setInterval(() => {
    if (!accessNextPage()) {
      window.clearInterval(timer);
      state.running = false;
      renderControls();
      return;
    }
    if (state.index >= workloads[state.workload].sequence.length) {
      window.clearInterval(timer);
      state.running = false;
      renderControls();
    }
  }, delay);
}

const workloadTabs = $$('.workload-tab');
workloadTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectWorkload(tab.dataset.workload));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % workloadTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + workloadTabs.length) % workloadTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = workloadTabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    workloadTabs[nextIndex].focus();
    selectWorkload(workloadTabs[nextIndex].dataset.workload);
  });
});

elements.frameCount.addEventListener('input', () => {
  if (state.running) return;
  state.capacity = Number(elements.frameCount.value);
  elements.frameLabel.textContent = state.capacity;
  resetSimulation(false);
  const distinct = new Set(workloads[state.workload].sequence).size;
  setDragon(`${distinct} distinct pages, ${state.capacity} frames. The ratio has changed; the access pattern has not.`);
});
elements.reset.addEventListener('click', () => resetSimulation());
elements.step.addEventListener('click', accessNextPage);
elements.run.addEventListener('click', runRemaining);

updateProgress();
selectWorkload(state.workload);
