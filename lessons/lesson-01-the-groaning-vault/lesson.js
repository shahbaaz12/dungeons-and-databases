const scenarios = {
  'working-set': {
    label: 'Evening reports',
    workload: 'Customer order history',
    query: `SELECT *\nFROM orders\nWHERE customer_id = 84217\nORDER BY created_at DESC\nLIMIT 50;`,
    metrics: { latency: '842 ms', buffer: '71.8%', cpu: '46%', pressure: '18.4k' },
    notes: { latency: 'response time', buffer: 'pages found in memory', cpu: 'primary utilization', pressure: 'physical pages / sec' },
    dynamicLabel: 'Disk reads',
    chart: [28, 52, 44, 68, 79, 71, 90, 82],
    answer: 'io',
    success: 'The working set has outgrown memory. CPU still has room, but the falling buffer-hit ratio forces thousands of page reads from disk.',
    retry: {
      cpu: 'CPU is only 46%. It is busy waiting for pages, not exhausted by computation.',
      maintenance: 'No cleanup is running in this scene. Follow the hit ratio and physical reads.',
      writes: 'This is a read workload. The evidence points to where its pages are coming from.'
    }
  },
  retention: {
    label: 'Archive night',
    workload: 'Delete six-month-old orders',
    query: `DELETE FROM orders\nWHERE created_at < DATE '2021-01-01';`,
    metrics: { latency: '6.2 hr', buffer: '93.4%', cpu: '58%', pressure: '640 GB' },
    notes: { latency: 'estimated completion', buffer: 'pages found in memory', cpu: 'primary utilization', pressure: 'WAL + dead-row churn' },
    dynamicLabel: 'Data churn',
    chart: [45, 48, 52, 61, 68, 77, 83, 91],
    answer: 'maintenance',
    success: 'The machine is not simply out of compute. Row-by-row deletion creates WAL, dead tuples, index cleanup, and future vacuum work. This is lifecycle pressure—the first strong reason to explore time partitions.',
    retry: {
      cpu: 'CPU is elevated, but it does not explain a six-hour row-by-row cleanup or 640 GB of churn.',
      io: 'I/O is involved, but ask why so much work exists at all. The boundary between old and current data is the clue.',
      writes: 'This generates writes, but customer traffic did not exceed the write ceiling. The archive operation itself is the problem.'
    }
  },
  'write-surge': {
    label: 'Festival launch',
    workload: 'Sustained checkout writes',
    query: `INSERT INTO orders (...)\nVALUES (...);\n-- 14,000 commits / second`,
    metrics: { latency: '1.24 s', buffer: '98.9%', cpu: '92%', pressure: '37 ms' },
    notes: { latency: 'commit p95', buffer: 'pages found in memory', cpu: 'primary utilization', pressure: 'WAL flush queue' },
    dynamicLabel: 'Commit queue',
    chart: [42, 58, 70, 82, 91, 94, 96, 98],
    answer: 'writes',
    success: 'The pages are mostly in memory, yet CPU and the commit queue are saturated. This is a single-primary write ceiling. Local partitions alone cannot add another machine.',
    retry: {
      cpu: 'CPU is saturated, but it is part of a broader write-path ceiling. Notice the healthy buffer hit ratio and queued commits.',
      io: 'A 98.9% hit ratio argues against read thrashing. The queue is on durable commits.',
      maintenance: 'This is live checkout traffic, not a data-retention operation.'
    }
  }
};

let savedEvidence = [];

try {
  savedEvidence = JSON.parse(localStorage.getItem('dnd-lesson-01-evidence') || '[]');
} catch {
  localStorage.removeItem('dnd-lesson-01-evidence');
}

const state = {
  current: 'working-set',
  solved: new Set((Array.isArray(savedEvidence) ? savedEvidence : []).filter((id) => Object.hasOwn(scenarios, id))),
  running: false
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  scenarioLabel: $('[data-scenario-label]'),
  workloadName: $('[data-workload-name]'),
  query: $('[data-query]'),
  runButton: $('[data-run-workload]'),
  runLabel: $('[data-run-label]'),
  runIcon: $('[data-run-icon]'),
  runNote: $('[data-run-note]'),
  metricsPanel: $('[data-metrics-panel]'),
  evidenceState: $('[data-evidence-state]'),
  diagnosis: $('[data-diagnosis]'),
  dragonResponse: $('[data-dragon-response]'),
  dynamicMetricLabel: $('[data-dynamic-metric-label]'),
  progressBar: $('[data-progress-bar]'),
  progressLabel: $('[data-progress-label]'),
  chartBars: $$('[data-chart-bars] i')
};

function setDragon(message, tone = 'neutral') {
  elements.dragonResponse.dataset.tone = tone;
  elements.dragonResponse.querySelector('span').textContent = tone === 'success' ? 'The Archivist approves' : tone === 'retry' ? 'Look again' : 'The Archivist is watching';
  elements.dragonResponse.querySelector('p').textContent = message;
}

function updateProgress() {
  const count = state.solved.size;
  elements.progressLabel.textContent = `${count} / 3 found`;
  elements.progressBar.style.setProperty('--progress', `${(count / 3) * 100}%`);
}

function resetEvidence() {
  $$('[data-metric]').forEach((metric) => { metric.textContent = '—'; metric.closest('.metric-card').removeAttribute('data-level'); });
  elements.chartBars.forEach((bar) => { bar.style.height = '4%'; });
  elements.evidenceState.textContent = 'Waiting';
  elements.diagnosis.hidden = true;
  $$('[data-answer]').forEach((button) => button.removeAttribute('data-result'));
  elements.runNote.textContent = 'Metrics will appear after the workload completes.';
  setDragon('Run the workload. Numbers are more loyal than guesses.');
}

function selectScenario(id) {
  if (state.running) return;
  state.current = id;
  const scenario = scenarios[id];

  $$('.scenario-tab').forEach((tab) => {
    const active = tab.dataset.scenario === id;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  $('#scenario-panel').setAttribute('aria-labelledby', `scenario-${id}`);

  elements.scenarioLabel.textContent = scenario.label;
  elements.workloadName.textContent = scenario.workload;
  elements.query.textContent = scenario.query;
  elements.dynamicMetricLabel.textContent = scenario.dynamicLabel;
  resetEvidence();
}

function revealMetrics() {
  const scenario = scenarios[state.current];
  Object.entries(scenario.metrics).forEach(([key, value], index) => {
    const metric = $(`[data-metric="${key}"]`);
    const note = $(`[data-metric-note="${key}"]`);
    metric.textContent = value;
    note.textContent = scenario.notes[key];
    metric.closest('.metric-card').dataset.level = index === 1 && state.current !== 'working-set' ? 'healthy' : 'pressure';
  });

  elements.chartBars.forEach((bar, index) => { bar.style.height = `${scenario.chart[index]}%`; });
  elements.evidenceState.textContent = 'Captured';
  elements.diagnosis.hidden = false;
  elements.runNote.textContent = 'Evidence captured. Choose the pressure that best explains it.';
  elements.runButton.disabled = false;
  elements.runLabel.textContent = 'Run again';
  elements.runIcon.textContent = '↻';
  elements.metricsPanel.setAttribute('aria-busy', 'false');
  state.running = false;
  setDragon('The vault has spoken. Do not chase the largest number; find the relationship between them.');
}

function runScenario() {
  if (state.running) return;
  state.running = true;
  elements.runButton.disabled = true;
  elements.runLabel.textContent = 'Observing…';
  elements.runIcon.textContent = '◌';
  elements.evidenceState.textContent = 'Running';
  elements.metricsPanel.setAttribute('aria-busy', 'true');
  elements.diagnosis.hidden = true;
  elements.runNote.textContent = 'Tracing requests, pages, and resource pressure…';
  $$('[data-metric]').forEach((metric) => { metric.textContent = '…'; });
  elements.chartBars.forEach((bar, index) => { bar.style.height = `${8 + index * 3}%`; });

  const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 900;
  window.setTimeout(revealMetrics, delay);
}

function answerDiagnosis(answer, button) {
  const scenario = scenarios[state.current];
  $$('[data-answer]').forEach((item) => item.removeAttribute('data-result'));

  if (answer === scenario.answer) {
    button.dataset.result = 'correct';
    state.solved.add(state.current);
    localStorage.setItem('dnd-lesson-01-evidence', JSON.stringify([...state.solved]));
    updateProgress();
    setDragon(scenario.success, 'success');
    return;
  }

  button.dataset.result = 'incorrect';
  setDragon(scenario.retry[answer], 'retry');
}

const scenarioTabs = $$('.scenario-tab');

scenarioTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectScenario(tab.dataset.scenario));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % scenarioTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + scenarioTabs.length) % scenarioTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = scenarioTabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    scenarioTabs[nextIndex].focus();
    selectScenario(scenarioTabs[nextIndex].dataset.scenario);
  });
});
elements.runButton.addEventListener('click', runScenario);
$$('[data-answer]').forEach((button) => button.addEventListener('click', () => answerDiagnosis(button.dataset.answer, button)));

updateProgress();
selectScenario(state.current);
