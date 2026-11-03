import { MathfieldElement } from 'mathlive';
import './styles.css';
import { EXAMPLES, TABS } from './toolbar.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const STORAGE_KEY = 'bettermathtype:document';
const RECENT_KEY = 'bettermathtype:recent';
const THEME_KEY = 'bettermathtype:theme';
const ONBOARDING_KEY = 'bettermathtype:onboarded';
const REPO_URL = 'https://github.com/mki169/bettermathtype';
const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const SIZES = [10, 11, 12, 14, 18, 24, 36];
const ZOOMS = [1, 1.25, 1.5, 1.75, 2, 2.5];
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const MOD_LABEL = isMac ? '⌘' : 'Ctrl+';

const state = {
  latex: '',
  size: 12,
  previewMode: 'inline',
  baseline: false,
  autosave: true,
  theme: 'system',
  zoom: 1.5,
  activeTab: 'home',
  result: null,
  renderVersion: 0,
  renderTimer: null,
  renderPromise: null,
  busy: false,
  engineReady: false,
  recent: [],
  lastSavedAt: 0,
};

MathfieldElement.fontsDirectory = '/mathlive-fonts';
const mf = document.createElement('math-field');
mf.id = 'mathfield';
mf.className = 'math-field';
mf.setAttribute('aria-label', 'Equation editor');
mf.setAttribute('virtual-keyboard-mode', 'off');
mf.setAttribute('smart-fence', '');
mf.setAttribute('smart-superscript', '');
$('#mathfieldSlot').replaceWith(mf);
const ribbonBody = $('#ribbonBody');
const ribbonTabs = $('#ribbonTabs');
const searchInput = $('#toolSearch');
const searchResults = $('#searchResults');
const examplesBtn = $('#examplesBtn');
const examplesMenu = $('#examplesMenu');
const inlinePreview = $('#inlinePreview');
const inlineEquation = $('#inlineEquation');
const displayEquation = $('#displayEquation');
const previewEmpty = $('#previewEmpty');
const wordPage = $('#wordPage');
const baselineGuide = $('#baselineGuide');
const dimensionsLabel = $('#dimensionsLabel');
const copySvgBtn = $('#copySvgBtn');
const headerCopyBtn = $('#headerCopyBtn');
const downloadSvgBtn = $('#downloadSvgBtn');
const copyLatexBtn = $('#copyLatexBtn');
const latexCode = $('#latexCode');
const emptyHint = $('#emptyHint');
const statusBadge = $('#statusBadge');
const saveState = $('#saveState');
const engineStatus = $('#engineStatus');
const engineLed = $('#engineLed');
const zoomValue = $('#zoomValue');
const toastStack = $('#toastStack');
const tooltip = $('#tooltip');
const infoDialog = $('#infoDialog');
const copyDialog = $('#copyDialog');
const svgSource = $('#svgSource');
const fileInput = $('#fileInput');
const themeToggleBtn = $('#themeToggleBtn');
const welcomeDialog = $('#welcomeDialog');

const iconCache = new Map();
let hiddenMeasure;
let enginePromise;
let toastSequence = 0;
let tipTarget = null;
let renderCache = new Map();

const flatTools = [];
for (const tab of TABS) {
  tab.groups.forEach((group, groupIndex) => {
    group.items.forEach((tool, itemIndex) => {
      flatTools.push({
        ...tool,
        key: `${tab.id}:${groupIndex}:${itemIndex}`,
        tabId: tab.id,
        tabLabel: tab.label,
        groupLabel: group.label,
        searchText: `${tool.label} ${tool.keywords} ${group.label} ${tab.label} ${tool.latex}`.toLowerCase(),
      });
    });
  });
}
const toolByKey = new Map(flatTools.map((tool) => [tool.key, tool]));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function plural(value, singular, pluralForm = `${singular}s`) {
  return value === 1 ? singular : pluralForm;
}

function formatNumber(value) {
  return Number(value.toFixed(2)).toString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function svgDataUrl(svgString) {
  return `data:image/svg+xml;base64,${utf8ToBase64(svgString)}`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read image data.'));
    reader.readAsDataURL(blob);
  });
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function addPngDpi(blob, dpi) {
  const source = new Uint8Array(await blob.arrayBuffer());
  if (source.length < 33) return blob;
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4);
  view.setUint32(8, pixelsPerMeter);
  view.setUint32(12, pixelsPerMeter);
  chunk[16] = 1;
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const output = new Uint8Array(source.length + chunk.length);
  output.set(source.subarray(0, 33), 0);
  output.set(chunk, 33);
  output.set(source.subarray(33), 33 + chunk.length);
  return new Blob([output], { type: 'image/png' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function showToast(message, { error = false, duration = 2800 } = {}) {
  const toast = document.createElement('div');
  toast.className = `toast${error ? ' is-error' : ''}`;
  toast.dataset.toast = String(++toastSequence);
  toast.innerHTML = `<span class="toast-icon">${error ? '!' : '✓'}</span><span>${escapeHtml(message)}</span>`;
  toastStack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 180);
  }, duration);
}

function applyPlatformLabels() {
  if (isMac) {
    $('#pasteShortcut').textContent = '⌘V';
    return;
  }
  const map = {
    '⌘N': 'Ctrl+N',
    '⌘O': 'Ctrl+O',
    '⌘S': 'Ctrl+S',
    '⇧⌘E': 'Ctrl+Shift+E',
    '⇧⌘C': 'Ctrl+Shift+C',
    '⌥⇧⌘C': 'Ctrl+Alt+Shift+C',
    '⌥⌘C': 'Ctrl+Alt+C',
    '⌥⌘V': 'Ctrl+Alt+V',
    '⌘⌫': 'Ctrl+Backspace',
    '⌘Z': 'Ctrl+Z',
    '⇧⌘Z': 'Ctrl+Shift+Z',
    '⌘A': 'Ctrl+A',
    '⌘0': 'Ctrl+0',
    '⌘K': 'Ctrl+K',
    '⌘V': 'Ctrl+V',
  };
  $$('.menu-shortcut, .key-hints kbd, .search-box kbd, .paste-tip kbd').forEach((el) => {
    const label = el.textContent.trim();
    if (map[label]) el.textContent = map[label];
  });
  $('#pasteShortcut').textContent = 'Ctrl+V';
}

function waitForEngine() {
  if (enginePromise) return enginePromise;
  enginePromise = new Promise((resolve, reject) => {
    const started = performance.now();
    const check = () => {
      if (window.MathJax?.tex2svgPromise) {
        resolve(window.MathJax);
        return;
      }
      if (performance.now() - started > 30000) {
        reject(new Error('The MathJax rendering engine did not finish loading.'));
        return;
      }
      setTimeout(check, 60);
    };
    check();
  });
  return enginePromise;
}

function setEngineState(mode, message) {
  engineLed.classList.toggle('is-ready', mode === 'ready');
  engineLed.classList.toggle('is-error', mode === 'error');
  engineStatus.textContent = message;
}

function createMeasureContainer() {
  hiddenMeasure = document.createElement('div');
  hiddenMeasure.id = 'mathjax-measure';
  hiddenMeasure.setAttribute('aria-hidden', 'true');
  hiddenMeasure.style.cssText = [
    'position:fixed',
    'left:-100000px',
    'top:0',
    'visibility:hidden',
    'pointer-events:none',
    'font-family:"Times New Roman","STIX Two Text","Times",serif',
    `font-size:${state.size}pt`,
    'width:max-content',
    'height:auto',
    'overflow:visible',
    'white-space:nowrap',
    'z-index:-1',
  ].join(';');
  document.body.appendChild(hiddenMeasure);
}

function normalizePlaceholders(latex) {
  let value = String(latex || '');
  for (let i = 0; i < 20; i += 1) {
    const next = value.replace(/\\placeholder(?:\[[^\]]*\])?\{([^{}]*)\}/g, '$1');
    if (next === value) break;
    value = next;
  }
  return value.replace(/\\placeholder(?:\[[^\]]*\])?/g, '');
}

function flattenSvgUses(root) {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  for (const use of Array.from(root.querySelectorAll('use'))) {
    const href = use.getAttribute('xlink:href') || use.getAttribute('href');
    if (!href || !href.startsWith('#')) {
      use.remove();
      continue;
    }
    const definition = root.querySelector(`#${CSS.escape(href.slice(1))}`);
    if (!definition || definition.tagName.toLowerCase() !== 'path') {
      use.remove();
      continue;
    }
    const path = definition.cloneNode(true);
    path.removeAttribute('id');
    if (!path.hasAttribute('fill')) path.setAttribute('fill', '#000000');
    const wrapper = document.createElementNS(svgNamespace, 'g');
    for (const attribute of Array.from(use.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name === 'href' || name === 'xlink:href' || name === 'xmlns:xlink') continue;
      wrapper.setAttribute(attribute.name, attribute.value);
    }
    wrapper.appendChild(path);
    use.replaceWith(wrapper);
  }
  root.querySelectorAll('rect').forEach((rect) => {
    if (!rect.hasAttribute('fill')) rect.setAttribute('fill', '#000000');
  });
  root.querySelectorAll('defs').forEach((definition) => {
    const children = Array.from(definition.children);
    if (children.every((child) => child.tagName.toLowerCase() === 'path')) definition.remove();
  });
  return root;
}

function cacheKey(latex, size) {
  return `${size}|${latex}`;
}

function measureResult(rawLatex) {
  const cleaned = normalizePlaceholders(rawLatex).trim();
  if (!cleaned) {
    return { empty: true };
  }
  if (cacheKey(cleaned, state.size) && iconCache.has(cacheKey(cleaned, state.size))) {
    return { empty: false, cached: iconCache.get(cacheKey(cleaned, state.size)) };
  }
  return { empty: false, latex: cleaned };
}

async function typeset(latex) {
  const cleaned = normalizePlaceholders(latex).trim();
  if (!cleaned) return null;
  const key = cacheKey(cleaned, state.size);
  if (iconCache.has(key)) return iconCache.get(key);

  const MathJaxEngine = await waitForEngine();
  hiddenMeasure.style.fontSize = `${state.size}pt`;
  const node = await MathJaxEngine.tex2svgPromise(cleaned, { display: true });
  const svg = node.querySelector('svg');
  if (!svg) {
    throw new Error('The output engine returned no SVG.');
  }
  const errorNode = node.querySelector('[data-mjx-error], mjx-merror');
  if (errorNode) {
    const errorText = errorNode.getAttribute('data-mjx-error') || errorNode.textContent || 'The expression could not be typeset.';
    throw new Error(errorText.trim());
  }

  hiddenMeasure.replaceChildren(node);
  const rect = svg.getBoundingClientRect();
  const viewBox = (svg.getAttribute('viewBox') || '0 0 1000 1000').trim().split(/[\s,]+/).map(Number);
  if (!rect.width || !rect.height || viewBox.length !== 4 || !viewBox[2] || !viewBox[3]) {
    hiddenMeasure.replaceChildren();
    throw new Error('The output engine returned invalid SVG dimensions.');
  }

  const widthPt = rect.width * 0.75;
  const heightPt = rect.height * 0.75;
  const depthUnits = Math.max(0, viewBox[3] + viewBox[1]);
  const depthPt = (depthUnits / viewBox[3]) * heightPt;
  const ariaLabel = node.getAttribute('aria-label') || 'Mathematical equation';

  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', `${formatNumber(widthPt)}pt`);
  clone.setAttribute('height', `${formatNumber(heightPt)}pt`);
  clone.removeAttribute('style');
  clone.setAttribute('color', '#000000');
  clone.setAttribute('role', 'img');
  clone.setAttribute('aria-label', ariaLabel);
  clone.removeAttribute('aria-hidden');
  clone.removeAttribute('focusable');
  clone.removeAttribute('tabindex');

  if (!clone.querySelector('title')) {
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = ariaLabel;
    clone.insertBefore(title, clone.firstChild);
  } else {
    clone.querySelector('title').textContent = ariaLabel;
  }

  clone.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((el) => el.remove());
  clone.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || name === 'href' || name === 'xlink:href') {
        if (name === 'href' || name === 'xlink:href') {
          const value = attr.value.trim();
          if (!value.startsWith('#')) el.removeAttribute(attr.name);
        } else {
          el.removeAttribute(attr.name);
        }
      }
    }
  });

  flattenSvgUses(clone);

  let svgString = new XMLSerializer().serializeToString(clone);
  svgString = svgString.replaceAll('currentColor', '#000000');
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const result = {
    latex: cleaned,
    svg: svgString,
    widthPt,
    heightPt,
    depthPt,
    ariaLabel,
    size: state.size,
  };
  iconCache.set(key, result);
  if (iconCache.size > 120) {
    const firstKey = iconCache.keys().next().value;
    iconCache.delete(firstKey);
  }
  hiddenMeasure.replaceChildren();
  return result;
}

function updateLatexCode() {
  const latex = mf?.value || '';
  latexCode.textContent = latex || 'Your LaTeX will appear here';
  latexCode.classList.toggle('is-empty', !latex);
  emptyHint.classList.toggle('is-hidden', Boolean(latex));
}

function setStatus(mode, text) {
  statusBadge.classList.toggle('is-busy', mode === 'busy');
  statusBadge.classList.toggle('is-error', mode === 'error');
  statusBadge.innerHTML = `<span class="quiet-dot"></span> ${escapeHtml(text)}`;
}

function updateHistoryButtons() {
  const undo = $('#undoBtn');
  const redo = $('#redoBtn');
  if (!mf) {
    undo.disabled = true;
    redo.disabled = true;
    return;
  }
  undo.disabled = !mf.canUndo;
  redo.disabled = !mf.canRedo;
}

function updateCopyState() {
  const disabled = !state.result;
  copySvgBtn.disabled = disabled;
  headerCopyBtn.disabled = disabled;
  downloadSvgBtn.disabled = disabled;
}

function updateDimensions(result) {
  const sizeTexts = $$('[data-size-text]');
  sizeTexts.forEach((el) => {
    el.textContent = String(state.size);
  });
  $('#headerSizeLabel').textContent = `${state.size} pt · Word`;
  $('#pageSizeLabel').textContent = String(state.size);
  if (!result) {
    dimensionsLabel.textContent = 'No equation yet';
    return;
  }
  dimensionsLabel.textContent = `${formatNumber(result.widthPt)} × ${formatNumber(result.heightPt)} pt · ${state.size} pt type`;
}

function makeEquationImage(result, { display = false } = {}) {
  const image = new Image();
  image.className = 'equation-svg';
  image.alt = result.ariaLabel;
  image.draggable = false;
  image.dataset.latex = result.latex;
  image.src = svgDataUrl(result.svg);
  image.style.width = `${formatNumber(result.widthPt)}pt`;
  image.style.height = `${formatNumber(result.heightPt)}pt`;
  image.style.verticalAlign = display ? 'middle' : `-${formatNumber(result.depthPt)}pt`;
  return image;
}

function applyResult(result) {
  if (!result) {
    state.result = null;
    inlineEquation.replaceChildren();
    displayEquation.replaceChildren();
    previewEmpty.hidden = false;
    wordPage.classList.remove('has-equation');
    inlinePreview.hidden = true;
    displayEquation.hidden = true;
    baselineGuide.hidden = true;
    updateDimensions(null);
    updateCopyState();
    return;
  }

  state.result = result;
  const inlineImage = makeEquationImage(result);
  const displayImage = makeEquationImage(result, { display: true });
  inlineEquation.replaceChildren(inlineImage);
  displayEquation.replaceChildren(displayImage);
  previewEmpty.hidden = true;
  wordPage.classList.add('has-equation');
  const showInline = state.previewMode === 'inline';
  inlinePreview.hidden = !showInline;
  displayEquation.hidden = showInline;
  updateDimensions(result);
  updateCopyState();
  requestAnimationFrame(updateBaselineGuide);
}

function setPreviewMode(mode) {
  state.previewMode = mode === 'display' ? 'display' : 'inline';
  const showInline = state.previewMode === 'inline';
  if (state.result) {
    inlinePreview.hidden = !showInline;
    displayEquation.hidden = showInline;
  }
  $$('[data-preview-mode]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.previewMode === state.previewMode);
  });
  updateMenuChecks();
  requestAnimationFrame(updateBaselineGuide);
  scheduleSave();
}

function setBaseline(value) {
  state.baseline = Boolean(value);
  updateMenuChecks();
  updateBaselineGuide();
  scheduleSave();
}

function updateBaselineGuide() {
  const show = state.baseline && state.result && state.previewMode === 'inline' && !inlinePreview.hidden;
  if (!show) {
    baselineGuide.hidden = true;
    return;
  }
  const image = inlineEquation.querySelector('img');
  if (!image) {
    baselineGuide.hidden = true;
    return;
  }
  const pageRect = wordPage.getBoundingClientRect();
  const imageRect = image.getBoundingClientRect();
  const depthPx = state.result.depthPt * (96 / 72);
  const baselineY = imageRect.bottom - depthPx - pageRect.top;
  baselineGuide.style.top = `${baselineY}px`;
  baselineGuide.style.bottom = 'auto';
  baselineGuide.style.setProperty('--x-height', `${state.size * (96 / 72) * 0.45}px`);
  baselineGuide.hidden = false;
}

function markRendering(text = 'Rendering…') {
  setStatus('busy', text);
}

async function renderLatest({ silent = false } = {}) {
  const version = ++state.renderVersion;
  const latex = mf?.value || '';
  const cleaned = normalizePlaceholders(latex).trim();

  if (!cleaned) {
    applyResult(null);
    setStatus('idle', 'Ready');
    return null;
  }

  if (!silent) markRendering();
  try {
    const result = await typeset(latex);
    if (version !== state.renderVersion) return null;
    applyResult(result);
    setStatus('idle', 'Ready');
    return result;
  } catch (error) {
    if (version !== state.renderVersion) return null;
    const message = error instanceof Error ? error.message : String(error);
    applyResult(null);
    setStatus('error', 'Output error');
    dimensionsLabel.textContent = 'The output engine could not typeset this expression';
    if (!silent) showToast(message || 'The expression could not be typeset.', { error: true, duration: 3600 });
    return null;
  }
}

function scheduleRender(delay = 100) {
  clearTimeout(state.renderTimer);
  state.renderTimer = setTimeout(() => {
    state.renderPromise = renderLatest();
  }, delay);
}

function onEquationChanged() {
  state.latex = mf?.value || '';
  updateLatexCode();
  updateHistoryButtons();
  scheduleRender(90);
  scheduleSave();
}

async function setEquation(latex, { focus = true, render = true } = {}) {
  if (!mf) return;
  mf.value = latex || '';
  state.latex = mf.value;
  updateLatexCode();
  updateHistoryButtons();
  if (focus) mf.focus();
  if (render) await renderLatest();
  scheduleSave({ immediate: true });
}

async function insertTool(tool) {
  if (!tool || !mf) return;
  mf.focus();
  mf.insert(tool.latex, { selectionMode: 'placeholder' });
  onEquationChanged();
  closeAllOverlays();
}

function renderTabs() {
  ribbonTabs.innerHTML = TABS.map((tab) => {
    const count = tab.groups.reduce((sum, group) => sum + group.items.length, 0);
    return `<button type="button" class="ribbon-tab${tab.id === state.activeTab ? ' is-active' : ''}" role="tab" aria-selected="${tab.id === state.activeTab}" data-tab="${tab.id}" title="${escapeHtml(tab.label)} · ${count} tools">${escapeHtml(tab.label)}</button>`;
  }).join('');
  ribbonTabs.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeTab = button.dataset.tab;
      renderTabs();
      renderToolbar();
    });
  });
}

function renderToolbar() {
  const tab = TABS.find((entry) => entry.id === state.activeTab) || TABS[0];
  ribbonBody.innerHTML = tab.groups.map((group, groupIndex) => {
    const buttons = group.items.map((tool, itemIndex) => {
      const key = `${tab.id}:${groupIndex}:${itemIndex}`;
      const label = escapeHtml(tool.label);
      return `<button type="button" class="tool-button" data-tool-key="${key}" aria-label="${label}" title="${label}">
        <span class="mi">${tool.icon}</span>
      </button>`;
    }).join('');
    return `<div class="tool-group"><div class="tool-row">${buttons}</div><span class="tool-group-label">${escapeHtml(group.label)}</span></div>`;
  }).join('');
}

function renderExamples() {
  examplesMenu.innerHTML = EXAMPLES.map((example, index) => `
    <button type="button" class="example-item" data-example="${index}" role="menuitem">
      <span class="example-name">${escapeHtml(example.name)}</span>
      <span class="example-meta">${escapeHtml(example.latex)}</span>
    </button>
  `).join('');
}

function closeAllOverlays() {
  $$('.menu-group.is-open').forEach((group) => group.classList.remove('is-open'));
  examplesMenu.hidden = true;
  examplesBtn.setAttribute('aria-expanded', 'false');
  hideSearchResults();
  hideTooltip();
}

function toggleMenu(group) {
  const wasOpen = group.classList.contains('is-open');
  $$('.menu-group.is-open').forEach((entry) => entry.classList.remove('is-open'));
  if (!wasOpen) group.classList.add('is-open');
}

function setupMenus() {
  $$('.menu-trigger').forEach((trigger) => {
    const group = trigger.closest('.menu-group');
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      closeAllOverlays();
      toggleMenu(group);
    });
    trigger.addEventListener('pointerenter', () => {
      if ($$('.menu-group.is-open').length > 0 && !group.classList.contains('is-open')) {
        $$('.menu-group.is-open').forEach((entry) => entry.classList.remove('is-open'));
        group.classList.add('is-open');
      }
    });
  });

  $$('.menu-dropdown').forEach((menu) => {
    menu.addEventListener('click', (event) => {
      const item = event.target.closest('.menu-item');
      if (!item || item.disabled) return;
      event.stopPropagation();
      const action = item.dataset.action;
      closeAllOverlays();
      if (action) runAction(action, item);
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.menu-group')) {
      $$('.menu-group.is-open').forEach((group) => group.classList.remove('is-open'));
    }
    if (!event.target.closest('.examples-wrap')) {
      examplesMenu.hidden = true;
      examplesBtn.setAttribute('aria-expanded', 'false');
    }
    if (!event.target.closest('.search-box') && !event.target.closest('#searchResults')) {
      hideSearchResults();
    }
  });
}

const actionHandlers = {
  new: () => setEquation(''),
  open: () => fileInput.click(),
  'save-tex': () => saveTeX(),
  'download-svg': () => downloadSvg(),
  'download-png': () => downloadPng(),
  'copy-svg': () => copySvg(),
  'copy-vector': () => copySvgVector(),
  'copy-latex': () => copyLatex(),
  undo: () => runEditorCommand('undo'),
  redo: () => runEditorCommand('redo'),
  'select-all': () => {
    if (!mf) return;
    mf.focus();
    mf.executeCommand('selectAll');
  },
  'paste-latex': () => pasteLatex(),
  clear: () => setEquation(''),
  'preview-inline': () => setPreviewMode('inline'),
  'preview-display': () => setPreviewMode('display'),
  'toggle-baseline': () => setBaseline(!state.baseline),
  'toggle-preview': () => {
    const workspace = $('#workspace');
    workspace.classList.toggle('preview-hidden');
    updateMenuChecks();
    requestAnimationFrame(updateBaselineGuide);
  },
  'zoom-reset': () => setZoom(1.5),
  size: (item) => setFontSize(Number(item.dataset.size)),
  'toggle-autosave': () => {
    state.autosave = !state.autosave;
    updateMenuChecks();
    saveState.textContent = state.autosave ? 'Saved locally' : 'Autosave off';
    if (state.autosave) scheduleSave({ immediate: true });
    showToast(state.autosave ? 'Autosave enabled' : 'Autosave disabled');
  },
  'toggle-theme': () => toggleTheme(),
  'system-theme': () => {
    setTheme('system');
    showToast('Following system theme');
  },
  'clear-local': () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore storage errors
    }
    state.recent = [];
    renderRecent();
    showToast('Local settings and history cleared');
  },
  'font-help': () => openInfo('font'),
  shortcuts: () => openInfo('shortcuts'),
  'word-help': () => openInfo('word'),
  about: () => openInfo('about'),
  'star-github': () => window.open(REPO_URL, '_blank', 'noopener,noreferrer'),
};

function runAction(action, item) {
  const handler = actionHandlers[action];
  if (handler) handler(item);
}

function runEditorCommand(command) {
  if (!mf) return;
  mf.focus();
  mf.executeCommand(command);
  setTimeout(updateHistoryButtons, 0);
  onEquationChanged();
}

function setupToolbar() {
  renderTabs();
  renderToolbar();

  ribbonBody.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.tool-button')) event.preventDefault();
  });

  ribbonBody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tool-key]');
    if (!button) return;
    const tool = toolByKey.get(button.dataset.toolKey);
    insertTool(tool);
  });

  ribbonBody.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      ribbonBody.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }, { passive: false });

  ribbonTabs.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = Array.from(ribbonTabs.querySelectorAll('[data-tab]'));
    const current = tabs.findIndex((tab) => tab.dataset.tab === state.activeTab);
    let next = current;
    if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    state.activeTab = tabs[next].dataset.tab;
    renderTabs();
    renderToolbar();
    ribbonTabs.querySelector(`[data-tab="${state.activeTab}"]`)?.focus();
  });

  searchInput.addEventListener('input', updateSearchResults);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) updateSearchResults();
  });
  searchInput.addEventListener('keydown', (event) => {
    const results = $$('.search-result', searchResults);
    const selected = results.findIndex((button) => button.classList.contains('is-selected'));
    if (event.key === 'Escape') {
      hideSearchResults();
      searchInput.blur();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!results.length) return;
      event.preventDefault();
      let next = selected;
      if (event.key === 'ArrowDown') next = (selected + 1) % results.length;
      if (event.key === 'ArrowUp') next = (selected - 1 + results.length) % results.length;
      results.forEach((button) => button.classList.remove('is-selected'));
      results[next].classList.add('is-selected');
      results[next].scrollIntoView({ block: 'nearest' });
      return;
    }
    if (event.key === 'Enter') {
      if (!results.length) return;
      event.preventDefault();
      results[selected >= 0 ? selected : 0].click();
    }
  });

  searchResults.addEventListener('click', (event) => {
    const result = event.target.closest('[data-search-key]');
    if (!result) return;
    const tool = toolByKey.get(result.dataset.searchKey);
    searchInput.value = '';
    hideSearchResults();
    insertTool(tool);
  });

  examplesBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = examplesMenu.hidden;
    closeAllOverlays();
    if (open) {
      examplesMenu.hidden = false;
      examplesBtn.setAttribute('aria-expanded', 'true');
    }
  });

  examplesMenu.addEventListener('click', (event) => {
    const item = event.target.closest('[data-example]');
    if (!item) return;
    const example = EXAMPLES[Number(item.dataset.example)];
    if (!example) return;
    examplesMenu.hidden = true;
    examplesBtn.setAttribute('aria-expanded', 'false');
    setEquation(example.latex);
    showToast(`Loaded ${example.name}`);
  });
}

function updateSearchResults() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    hideSearchResults();
    return;
  }
  const terms = query.split(/\s+/).filter(Boolean);
  const matches = flatTools
    .filter((tool) => terms.every((term) => tool.searchText.includes(term)))
    .slice(0, 36);
  if (!matches.length) {
    searchResults.innerHTML = `<div class="search-empty">No symbols or templates match “${escapeHtml(searchInput.value.trim())}”.</div>`;
    searchResults.hidden = false;
    return;
  }
  searchResults.innerHTML = `<div class="search-results-title">${matches.length} ${plural(matches.length, 'match', 'matches')}</div>${matches.map((tool, index) => `
    <button type="button" class="search-result${index === 0 ? ' is-selected' : ''}" data-search-key="${tool.key}">
      <span class="search-result-icon mi">${tool.icon}</span>
      <span class="search-result-copy">
        <span class="search-result-label">${escapeHtml(tool.label)}</span>
        <span class="search-result-meta">${escapeHtml(tool.groupLabel)} · ${escapeHtml(tool.latex)}</span>
      </span>
      <span class="search-result-tab">${escapeHtml(tool.tabLabel)}</span>
    </button>
  `).join('')}`;
  searchResults.hidden = false;
}

function hideSearchResults() {
  searchResults.hidden = true;
  searchResults.innerHTML = '';
}

function showTooltip(target) {
  const text = target.getAttribute('data-tip') || target.getAttribute('title');
  if (!text) return;
  if (!target.hasAttribute('data-tip')) {
    target.setAttribute('data-tip', text);
    target.removeAttribute('title');
  }
  tipTarget = target;
  tooltip.textContent = text;
  tooltip.hidden = false;
  const rect = target.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  left = clamp(left, 8, window.innerWidth - tipRect.width - 8);
  let top = rect.bottom + 7;
  if (top + tipRect.height > window.innerHeight - 8) top = rect.top - tipRect.height - 7;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  tipTarget = null;
  tooltip.hidden = true;
}

function setupTooltips() {
  document.addEventListener('pointerover', (event) => {
    const target = event.target.closest('[data-tip], .tool-button[title], .icon-button[title]');
    if (!target || target === tipTarget) return;
    if (!target.getAttribute('data-tip') && target.hasAttribute('title')) {
      target.setAttribute('data-tip', target.getAttribute('title'));
      target.removeAttribute('title');
    }
    if (target.getAttribute('data-tip')) showTooltip(target);
  });
  document.addEventListener('pointerout', (event) => {
    if (!tipTarget) return;
    if (event.relatedTarget && tipTarget.contains(event.relatedTarget)) return;
    hideTooltip();
  });
  document.addEventListener('scroll', hideTooltip, true);
  window.addEventListener('resize', hideTooltip);
}

function storedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function effectiveTheme() {
  if (state.theme === 'system') return themeQuery.matches ? 'dark' : 'light';
  return state.theme;
}

function applyTheme() {
  const theme = effectiveTheme();
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d131c' : '#f7f8fb');
  if (themeToggleBtn) {
    const isDark = theme === 'dark';
    const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggleBtn.setAttribute('aria-pressed', String(isDark));
    themeToggleBtn.setAttribute('aria-label', label);
    themeToggleBtn.title = label;
  }
}

function setTheme(theme) {
  state.theme = theme === 'light' || theme === 'dark' ? theme : 'system';
  try {
    if (state.theme === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, state.theme);
  } catch {
    // ignore storage errors
  }
  applyTheme();
  updateMenuChecks();
}

function toggleTheme() {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
}

function setupTheme() {
  state.theme = storedTheme() || 'system';
  applyTheme();
  themeToggleBtn?.addEventListener('click', toggleTheme);
  const handleSystemChange = () => {
    if (state.theme === 'system') applyTheme();
  };
  if (typeof themeQuery.addEventListener === 'function') {
    themeQuery.addEventListener('change', handleSystemChange);
  } else if (typeof themeQuery.addListener === 'function') {
    themeQuery.addListener(handleSystemChange);
  }
}

function updateMenuChecks() {
  const previewChecks = $$('[data-check="preview"]');
  previewChecks.forEach((item) => {
    const isInline = item.dataset.action === 'preview-inline';
    item.classList.toggle('is-checked', isInline === (state.previewMode === 'inline'));
    const check = item.querySelector('.menu-check');
    if (check) check.textContent = item.classList.contains('is-checked') ? '✓' : '';
  });

  $$('[data-check="baseline"]').forEach((item) => {
    item.classList.toggle('is-checked', state.baseline);
    const check = item.querySelector('.menu-check');
    if (check) check.textContent = state.baseline ? '✓' : '';
  });

  $$('[data-check="size"]').forEach((item) => {
    const active = Number(item.dataset.size) === state.size;
    item.classList.toggle('is-checked', active);
    const check = item.querySelector('.menu-check');
    if (check) check.textContent = active ? '✓' : '';
  });

  $$('[data-check="autosave"]').forEach((item) => {
    item.classList.toggle('is-checked', state.autosave);
    const check = item.querySelector('.menu-check');
    if (check) check.textContent = state.autosave ? '✓' : '';
  });

  $$('[data-check="theme"]').forEach((item) => {
    const active = state.theme === 'dark';
    item.classList.toggle('is-checked', active);
    const check = item.querySelector('.menu-check');
    if (check) check.textContent = active ? '✓' : '';
  });

  $$('[data-check="system-theme"]').forEach((item) => {
    const active = state.theme === 'system';
    item.classList.toggle('is-checked', active);
    const check = item.querySelector('.menu-check');
    if (check) check.textContent = active ? '✓' : '';
  });

  const previewToggle = $('[data-action="toggle-preview"]');
  if (previewToggle) {
    const visible = !$('#workspace').classList.contains('preview-hidden');
    previewToggle.classList.toggle('is-checked', visible);
    const check = previewToggle.querySelector('.menu-check');
    if (check) check.textContent = visible ? '✓' : '';
  }
}

function setFontSize(size) {
  if (!SIZES.includes(size)) return;
  state.size = size;
  if (hiddenMeasure) hiddenMeasure.style.fontSize = `${size}pt`;
  updateDimensions(state.result);
  updateMenuChecks();
  scheduleRender(0);
  scheduleSave();
}

function applyZoom() {
  if (!mf) return;
  mf.style.fontSize = `${16 * state.zoom}px`;
  zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
}

function setZoom(zoom) {
  state.zoom = clamp(zoom, 1, 2.5);
  applyZoom();
  scheduleSave();
  requestAnimationFrame(updateBaselineGuide);
}

function zoomStep(direction) {
  const current = ZOOMS.reduce((best, value) => Math.abs(value - state.zoom) < Math.abs(best - state.zoom) ? value : best, ZOOMS[0]);
  const index = ZOOMS.indexOf(current);
  setZoom(ZOOMS[clamp(index + direction, 0, ZOOMS.length - 1)]);
}

function scheduleSave({ immediate = false } = {}) {
  if (!state.autosave) {
    saveState.textContent = 'Autosave off';
    return;
  }
  saveState.textContent = 'Saving…';
  clearTimeout(scheduleSave.timer);
  const commit = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        latex: mf?.value || '',
        size: state.size,
        zoom: state.zoom,
        previewMode: state.previewMode,
        baseline: state.baseline,
        autosave: state.autosave,
      }));
      state.lastSavedAt = Date.now();
      saveState.textContent = 'Saved locally';
    } catch {
      saveState.textContent = 'Local save unavailable';
    }
  };
  if (immediate) commit();
  else scheduleSave.timer = setTimeout(commit, 320);
}

function restoreState() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    data = null;
  }
  if (data && typeof data === 'object') {
    if (typeof data.latex === 'string') state.latex = data.latex;
    if (SIZES.includes(Number(data.size))) state.size = Number(data.size);
    if (typeof data.zoom === 'number') state.zoom = clamp(data.zoom, 1, 2.5);
    if (data.previewMode === 'display' || data.previewMode === 'inline') state.previewMode = data.previewMode;
    state.baseline = Boolean(data.baseline);
    state.autosave = data.autosave !== false;
    saveState.textContent = state.autosave ? 'Saved locally' : 'Autosave off';
  } else {
    state.latex = EXAMPLES[0].latex;
    state.autosave = true;
    saveState.textContent = 'Saved locally';
  }
  try {
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    if (Array.isArray(recent)) {
      state.recent = recent.filter((entry) => typeof entry === 'string' && entry.trim()).slice(0, 5);
    }
  } catch {
    state.recent = [];
  }
}

function saveRecent(latex) {
  const value = String(latex || '').trim();
  if (!value) return;
  state.recent = [value, ...state.recent.filter((entry) => entry !== value)].slice(0, 5);
  renderRecent();
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(state.recent));
  } catch {
    // ignore
  }
}

function renderRecent() {
  const block = $('#recentBlock');
  const list = $('#recentList');
  if (!state.recent.length) {
    block.hidden = true;
    list.replaceChildren();
    return;
  }
  block.hidden = false;
  list.innerHTML = state.recent.map((latex, index) => `<button type="button" class="recent-chip" data-recent="${index}" title="${escapeHtml(latex)}">${escapeHtml(latex)}</button>`).join('');
}

function setupRecent() {
  $('#recentList').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-recent]');
    if (!chip) return;
    const latex = state.recent[Number(chip.dataset.recent)];
    if (latex) setEquation(latex);
  });
}

async function copyText(value, successMessage) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(successMessage);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.cssText = 'position:fixed;left:-10000px;top:0;';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    showToast(copied ? successMessage : 'Clipboard access was blocked', { error: !copied });
  }
}

async function copyLatex() {
  const value = mf?.value || '';
  if (!value.trim()) {
    showToast('There is no LaTeX to copy yet.', { error: true });
    return;
  }
  await copyText(value, 'LaTeX copied');
}

async function ensureResult() {
  const latex = mf?.value || '';
  const cleaned = normalizePlaceholders(latex).trim();
  if (!cleaned) throw new Error('Type an equation first.');
  if (state.result && state.result.latex === cleaned && state.result.size === state.size) {
    return state.result;
  }
  const result = await typeset(latex);
  if (!result) throw new Error('The equation could not be rendered.');
  applyResult(result);
  return result;
}

async function buildClipboardHtml(result, pngBlob) {
  const width = formatNumber(result.widthPt);
  const height = formatNumber(result.heightPt);
  const widthPx = Math.max(1, Math.round(result.widthPt * (96 / 72)));
  const heightPx = Math.max(1, Math.round(result.heightPt * (96 / 72)));
  const depth = formatNumber(result.depthPt);
  const src = await blobToDataUrl(pngBlob);
  return `<span style="position:relative;top:${depth}pt;mso-text-raise:-${depth}pt;mso-no-proof:yes"><img src="${src}" width="${widthPx}" height="${heightPx}" alt="${escapeHtml(result.ariaLabel)}" style="width:${width}pt;height:${height}pt" /></span>`;
}

function svgToPngBlob(svgString, widthPt, heightPt, { scale = 8, dpi = 96 * scale, background = '#ffffff' } = {}) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const width = Math.max(1, Math.round(widthPt * (96 / 72) * scale));
        const height = Math.max(1, Math.round(heightPt * (96 / 72) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (background) {
          context.fillStyle = background;
          context.fillRect(0, 0, width, height);
        } else {
          context.clearRect(0, 0, width, height);
        }
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Could not create the PNG image.'));
            return;
          }
          try {
            resolve(await addPngDpi(blob, dpi));
          } catch (error) {
            reject(error);
          }
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error('Could not rasterize the equation.'));
    image.src = svgDataUrl(svgString);
  });
}

async function copySvg() {
  let result;
  try {
    setStatus('busy', 'Preparing Word image…');
    copySvgBtn.disabled = true;
    headerCopyBtn.disabled = true;
    result = await ensureResult();
  } catch (error) {
    setStatus('error', 'Copy failed');
    showToast(error instanceof Error ? error.message : 'Could not prepare the equation image.', { error: true });
    updateCopyState();
    return;
  }

  try {
    const pngBlob = await svgToPngBlob(result.svg, result.widthPt, result.heightPt);
    const htmlBlob = new Blob([await buildClipboardHtml(result, pngBlob)], { type: 'text/html' });
    const textBlob = new Blob([result.latex], { type: 'text/plain' });

    let copied = false;
    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      const attempts = [
        {
          'text/html': htmlBlob,
          'image/png': pngBlob,
          'text/plain': textBlob,
        },
        {
          'image/png': pngBlob,
          'text/plain': textBlob,
        },
        {
          'image/png': pngBlob,
        },
        {
          'text/plain': textBlob,
        },
      ];
      for (const attempt of attempts) {
        try {
          await navigator.clipboard.write([new ClipboardItem(attempt)]);
          copied = true;
          break;
        } catch {
          // Try the next, more widely supported payload.
        }
      }
    }

    if (!copied) throw new Error('Clipboard access was blocked.');

    saveRecent(result.latex);
    setStatus('idle', 'Ready');
    updateCopyState();
    showToast(`Equation copied at ${state.size} pt — paste into Word with ${isMac ? '⌘V' : 'Ctrl+V'}`);
  } catch (error) {
    setStatus('error', 'Clipboard blocked');
    updateCopyState();
    svgSource.value = result.svg;
    copyDialog.showModal();
    setTimeout(() => {
      svgSource.focus();
      svgSource.select();
    }, 30);
  }
}

async function copySvgVector() {
  let result;
  try {
    result = await ensureResult();
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not prepare the SVG.', { error: true });
    return;
  }

  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      throw new Error('This browser does not support SVG clipboard images.');
    }
    if (typeof ClipboardItem.supports === 'function' && !ClipboardItem.supports('image/svg+xml')) {
      throw new Error('This browser does not support SVG clipboard images.');
    }
    const svgBlob = new Blob([result.svg], { type: 'image/svg+xml' });
    await navigator.clipboard.write([new ClipboardItem({ 'image/svg+xml': svgBlob })]);
    saveRecent(result.latex);
    showToast('SVG copied as a vector image');
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not copy the SVG.', { error: true, duration: 4200 });
  }
}

async function downloadSvg() {
  try {
    const result = await ensureResult();
    downloadBlob(new Blob([result.svg], { type: 'image/svg+xml' }), `equation-${state.size}pt.svg`);
    showToast('SVG downloaded');
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not download the SVG.', { error: true });
  }
}

async function downloadPng() {
  try {
    const result = await ensureResult();
    const blob = await svgToPngBlob(result.svg, result.widthPt, result.heightPt);
    downloadBlob(blob, `equation-${state.size}pt.png`);
    showToast('PNG downloaded');
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not download the PNG.', { error: true });
  }
}

function saveTeX() {
  const latex = mf?.value || '';
  if (!latex.trim()) {
    showToast('There is no equation to save.', { error: true });
    return;
  }
  downloadBlob(new Blob([`\\[\n${latex}\n\\]\n`], { type: 'application/x-tex' }), 'equation.tex');
  showToast('TeX file downloaded');
}

function stripTeXWrapper(value) {
  let text = String(value || '').trim();
  text = text.replace(/^\\\[/, '').replace(/\\\]$/, '');
  text = text.replace(/^\$\$/, '').replace(/\$\$$/, '');
  text = text.replace(/^\$/, '').replace(/\$$/, '');
  text = text.replace(/^\\\(/, '').replace(/\\\)$/, '');
  text = text.replace(/^\\begin\{(?:equation\*?|displaymath|align\*?)\}/, '');
  text = text.replace(/\\end\{(?:equation\*?|displaymath|align\*?)\}$/, '');
  return text.trim();
}

async function pasteLatex() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      showToast('The clipboard is empty.', { error: true });
      return;
    }
    if (!mf) return;
    mf.focus();
    mf.insert(stripTeXWrapper(text), { selectionMode: 'item' });
    onEquationChanged();
    showToast('LaTeX pasted');
  } catch {
    showToast('Clipboard read access was blocked.', { error: true });
  }
}

function openInfo(kind) {
  const content = {
    shortcuts: {
      eyebrow: 'Quick reference',
      title: 'Keyboard shortcuts',
      html: `
        <p>Most shortcuts work with <code>⌘</code> on macOS and <code>Ctrl</code> on Windows.</p>
        <div class="shortcut-table">
          <div>Copy for Word</div><div><kbd>⇧⌘C</kbd></div>
          <div>Copy SVG (vector)</div><div><kbd>⌥⇧⌘C</kbd></div>
          <div>Copy LaTeX</div><div><kbd>⌥⌘C</kbd></div>
          <div>Save TeX file</div><div><kbd>⌘S</kbd></div>
          <div>Open TeX file</div><div><kbd>⌘O</kbd></div>
          <div>Search tools</div><div><kbd>⌘K</kbd></div>
          <div>Reset editor zoom</div><div><kbd>⌘0</kbd></div>
          <div>Undo / redo</div><div><kbd>⌘Z</kbd> / <kbd>⇧⌘Z</kbd></div>
          <div>Select all in equation</div><div><kbd>⌘A</kbd></div>
          <div>Delete equation</div><div><kbd>⌘⌫</kbd></div>
        </div>
        <h3>Editor tips</h3>
        <ul>
          <li>Type <code>\\frac</code>, <code>\\sqrt</code>, <code>\\int</code>, or any other LaTeX command directly.</li>
          <li>Select part of an equation, then click a template to wrap the selection.</li>
          <li>Use <kbd>Tab</kbd> to move between empty template slots.</li>
        </ul>
      `,
    },
    word: {
      eyebrow: 'Microsoft Word',
      title: 'Pasting into Word',
      html: `
        <p>The Word copy is a high-resolution PNG with a white background, sized at exactly <strong>${state.size} pt</strong>.</p>
        <h3>Recommended workflow</h3>
        <ul>
          <li>Click <strong>Copy for Word</strong> (or press <kbd>⇧⌘C</kbd>).</li>
          <li>In Word, place the cursor where the equation should go and press <kbd>⌘V</kbd>.</li>
          <li>Choose <strong>Layout Options → In line with text</strong> if Word does not insert it inline.</li>
        </ul>
        <h3>If Word pastes a blank or oversized image</h3>
        <p>Use <strong>Paste Special</strong> and choose <strong>Picture (PNG)</strong>. The image already includes a white background and the correct DPI metadata.</p>
        <h3>Need a vector?</h3>
        <p>Use <strong>Download SVG</strong> and insert it with <strong>Insert → Pictures</strong>. Word’s clipboard does not reliably accept browser SVG images, so the clipboard uses a PNG for compatibility.</p>
      `,
    },
    font: {
      eyebrow: 'Typography',
      title: 'Times New Roman output',
      html: `
        <p>Equations are typeset with <strong>STIX 2</strong>, a Times-compatible math font designed to match the proportions and texture of Times New Roman.</p>
        <p>MathJax converts every glyph to an SVG path before export. That means Word does not need the STIX font installed, and the equation will look the same on any computer.</p>
        <h3>What is preserved</h3>
        <ul>
          <li>Vector-quality glyphs and rules</li>
          <li>Exact point size (12 pt by default)</li>
          <li>The natural baseline and descent of the equation</li>
        </ul>
      `,
    },
    about: {
      eyebrow: 'BetterMathType',
      title: 'A faster way to MathType',
      html: `
        <p>BetterMathType is a browser-based equation studio built around the workflow that matters most: type math, copy one equation, paste it into Word.</p>
        <h3>Under the hood</h3>
        <ul>
          <li><strong>MathLive</strong> for the structured visual editor and LaTeX input.</li>
          <li><strong>MathJax</strong> with the STIX 2 font for Times-compatible SVG output.</li>
          <li>Clipboard payloads use a high-resolution, white-background PNG for Word plus LaTeX; SVG downloads remain available for vector workflows.</li>
        </ul>
        <p>Everything runs locally in your browser. The current equation and preferences are stored in your browser's local storage.</p>
      `,
    },
  }[kind];
  if (!content) return;
  $('#infoEyebrow').textContent = content.eyebrow;
  $('#infoTitle').textContent = content.title;
  $('#infoBody').innerHTML = content.html;
  applyPlatformLabels();
  infoDialog.showModal();
}

function setupDialogs() {
  $$('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
  $('#downloadFromDialogBtn').addEventListener('click', () => {
    const result = state.result;
    if (!result) {
      showToast('Render an equation first.', { error: true });
      return;
    }
    downloadBlob(new Blob([result.svg], { type: 'image/svg+xml' }), `equation-${state.size}pt.svg`);
    copyDialog.close();
  });
}

function setupOnboarding() {
  if (!welcomeDialog || typeof welcomeDialog.showModal !== 'function') return;
  let completed = false;
  try {
    completed = localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {}
  if (completed) return;
  welcomeDialog.addEventListener('close', () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {}
  }, { once: true });
  if (!welcomeDialog.open) welcomeDialog.showModal();
}

async function setupMathField() {
  await customElements.whenDefined('math-field');
  mf.virtualKeyboardMode = 'off';
  mf.smartFence = true;
  mf.smartSuperscript = true;
  mf.letterShapeStyle = 'tex';
  mf.placeholder = '\\text{Type math or use the toolbar}';
  mf.value = state.latex || EXAMPLES[0].latex;
  state.latex = mf.value;
  applyZoom();
  injectMathLiveFonts();
  updateLatexCode();

  mf.addEventListener('input', onEquationChanged);
  mf.addEventListener('change', onEquationChanged);
  mf.addEventListener('selection-change', () => {
    updateHistoryButtons();
    requestAnimationFrame(updateBaselineGuide);
  });
  mf.addEventListener('focus', updateHistoryButtons);
  mf.addEventListener('blur', updateHistoryButtons);

  $('#editorSurface').addEventListener('pointerdown', (event) => {
    if (event.target === event.currentTarget || event.target.closest('#emptyHint')) {
      event.preventDefault();
      mf.focus();
    }
  });

  setPreviewMode(state.previewMode);
  updateMenuChecks();
  updateHistoryButtons();
  updateDimensions(null);
  updateCopyState();
  renderRecent();
  await renderLatest();
  setTimeout(updateHistoryButtons, 50);
}

function injectMathLiveFonts() {
  if (!mf) return;
  const styleText = `
    .ML__cmr, .ML__mathit, .ML__mathbf, .ML__mathbfit, .ML__text,
    .ML__accent-body, .ML__op-symbol, .ML__small-delim {
      font-family: "Times New Roman", "STIX Two Text", "Times", serif !important;
    }
    .ML__mathit, .ML__mathbfit { font-style: italic !important; }
    .ML__cmr, .ML__text { font-style: normal !important; }
    .ML__text { font-family: "Times New Roman", "STIX Two Text", "Times", serif !important; }
  `;
  const apply = () => {
    const root = mf.shadowRoot;
    if (!root) return false;
    if (root.querySelector('#bettermathtype-fonts')) return true;
    const style = document.createElement('style');
    style.id = 'bettermathtype-fonts';
    style.textContent = styleText;
    root.appendChild(style);
    return true;
  };
  if (apply()) return;
  const observer = new MutationObserver(() => {
    if (apply()) observer.disconnect();
  });
  observer.observe(mf, { childList: true });
  setTimeout(apply, 120);
}

function setupKeyboard() {
  window.addEventListener('keydown', (event) => {
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    const editable = event.target instanceof Element && (event.target.matches('input, textarea, [contenteditable="true"]') || event.target.closest('math-field'));

    if (mod && key === 'k') {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }
    if (mod && event.shiftKey && event.altKey && key === 'c') {
      event.preventDefault();
      copySvgVector();
      return;
    }
    if (mod && event.shiftKey && key === 'c') {
      event.preventDefault();
      copySvg();
      return;
    }
    if (mod && event.altKey && key === 'c') {
      event.preventDefault();
      copyLatex();
      return;
    }
    if (mod && event.shiftKey && key === 'e') {
      event.preventDefault();
      downloadSvg();
      return;
    }
    if (mod && key === 's') {
      event.preventDefault();
      saveTeX();
      return;
    }
    if (mod && key === 'o') {
      event.preventDefault();
      fileInput.click();
      return;
    }
    if (mod && key === 'n') {
      event.preventDefault();
      setEquation('');
      return;
    }
    if (mod && key === '0') {
      event.preventDefault();
      setZoom(1.5);
      return;
    }
    if (mod && key === 'backspace' && !editable) {
      event.preventDefault();
      setEquation('');
      return;
    }
    if (event.key === '?' && !editable) {
      event.preventDefault();
      openInfo('shortcuts');
      return;
    }
    if (event.key === 'Escape') {
      closeAllOverlays();
      $$('.menu-group.is-open').forEach((group) => group.classList.remove('is-open'));
    }
  });
}

function setupZoom() {
  $('#zoomInBtn').addEventListener('click', () => zoomStep(1));
  $('#zoomOutBtn').addEventListener('click', () => zoomStep(-1));
  zoomValue.addEventListener('click', () => setZoom(1.5));
}

function setupFiles() {
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await setEquation(stripTeXWrapper(text));
      showToast(`Loaded ${file.name}`);
    } catch {
      showToast('Could not read that TeX file.', { error: true });
    } finally {
      fileInput.value = '';
    }
  });
}

function setupActions() {
  $('#undoBtn').addEventListener('click', () => runEditorCommand('undo'));
  $('#redoBtn').addEventListener('click', () => runEditorCommand('redo'));
  $('#clearBtn').addEventListener('click', () => setEquation(''));
  $('#copySvgBtn').addEventListener('click', copySvg);
  headerCopyBtn.addEventListener('click', copySvg);
  downloadSvgBtn.addEventListener('click', downloadSvg);
  copyLatexBtn.addEventListener('click', copyLatex);
  $$('[data-preview-mode]').forEach((button) => {
    button.addEventListener('click', () => setPreviewMode(button.dataset.previewMode));
  });
  window.addEventListener('resize', () => {
    requestAnimationFrame(updateBaselineGuide);
  });
  window.addEventListener('beforeunload', () => {
    if (state.autosave) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          latex: mf?.value || '',
          size: state.size,
          zoom: state.zoom,
          previewMode: state.previewMode,
          baseline: state.baseline,
          autosave: state.autosave,
        }));
      } catch {
        // ignore
      }
    }
  });
}

async function init() {
  applyPlatformLabels();
  setupTheme();
  restoreState();
  createMeasureContainer();
  renderExamples();
  setupMenus();
  setupToolbar();
  setupTooltips();
  setupDialogs();
  setupRecent();
  setupKeyboard();
  setupZoom();
  setupFiles();
  setupActions();
  updateMenuChecks();
  updateDimensions(null);
  updateCopyState();
  setEngineState('loading', 'Starting rendering engine…');

  try {
    await setupMathField();
  } catch (error) {
    console.error(error);
    setStatus('error', 'Editor unavailable');
    showToast('The equation editor could not be initialized.', { error: true, duration: 5000 });
  }

  try {
    await waitForEngine();
    state.engineReady = true;
    setEngineState('ready', 'Rendering engine ready · MathJax STIX 2');
    await renderLatest();
  } catch (error) {
    console.error(error);
    setEngineState('error', 'Rendering engine unavailable');
    setStatus('error', 'Output engine failed');
    showToast('The SVG output engine failed to load. Check the browser console.', { error: true, duration: 7000 });
  }

  setupOnboarding();
}

init();
