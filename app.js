const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

let cellCols = 2, cellRows = 1, pixelW, pixelH, pixels;
let mode = 'draw', painting = false, paintValue = 1;
let frames = [], currentFrame = 0;
let isPlaying = false, animFPS = 4, loopAnim = true, onionSkin = false, playTimer = null;

const gridEl = document.getElementById('grid');
const labelEl = document.getElementById('grid-label');
const colsEl = document.getElementById('cols');
const rowsEl = document.getElementById('rows');
const stripEl = document.getElementById('timeline-strip');
const frameCounterEl = document.getElementById('frame-counter');
const playBtnEl = document.getElementById('play-btn');
const fpsValueEl = document.getElementById('fps-value');

function makeEmptyGrid() {
  return Array.from({ length: pixelH }, () => Array.from({ length: pixelW }, () => 0));
}
function cloneGrid(g) { return g.map(r => [...r]); }

function init() {
  cellCols = parseInt(colsEl.value);
  cellRows = parseInt(rowsEl.value);
  pixelW = cellCols * 2;
  pixelH = cellRows * 4;
  if (frames.length === 0) {
    frames = [makeEmptyGrid()];
    currentFrame = 0;
  } else {
    frames = frames.map(old =>
      Array.from({ length: pixelH }, (_, r) =>
        Array.from({ length: pixelW }, (_, c) =>
          r < old.length && c < old[0].length ? old[r][c] : 0
        )
      )
    );
  }
  pixels = frames[currentFrame];
  buildGrid();
  updateOutput();
  renderTimeline();
}

function buildGrid() {
  gridEl.innerHTML = '';
  const prev = onionSkin && currentFrame > 0 ? frames[currentFrame - 1] : null;
  for (let r = 0; r < pixelH; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'grid-row';
    for (let c = 0; c < pixelW; c++) {
      const d = document.createElement('div');
      d.className = 'dot';
      if (pixels[r][c]) d.classList.add('on');
      else if (prev && prev[r][c]) d.classList.add('ghost');
      if (c % 2 === 1 && c < pixelW - 1) d.classList.add('cell-right-edge');
      if (r % 4 === 3 && r < pixelH - 1) d.classList.add('cell-bottom-edge');
      d.dataset.r = r; d.dataset.c = c;
      d.addEventListener('pointerdown', onDotDown);
      d.addEventListener('pointerenter', onDotEnter);
      rowEl.appendChild(d);
    }
    gridEl.appendChild(rowEl);
  }
  const t = cellCols * cellRows;
  labelEl.innerHTML = `${pixelW} &times; ${pixelH} pixels &mdash; ${t} char${t > 1 ? 's' : ''}`;
}

function refreshGridDots() {
  const dots = gridEl.querySelectorAll('.dot');
  const prev = onionSkin && currentFrame > 0 ? frames[currentFrame - 1] : null;
  dots.forEach(d => {
    const r = +d.dataset.r, c = +d.dataset.c, on = !!pixels[r][c];
    d.classList.toggle('on', on);
    d.classList.toggle('ghost', !on && !!prev && !!prev[r][c]);
  });
}

function onDotDown(e) {
  e.preventDefault(); stopPlayback(); painting = true;
  const r = +e.target.dataset.r, c = +e.target.dataset.c;
  paintValue = e.shiftKey || mode === 'erase' ? 0 : (pixels[r][c] ? 0 : 1);
  setPixel(r, c, paintValue); updateOutput();
}
function onDotEnter(e) {
  if (!painting) return;
  setPixel(+e.target.dataset.r, +e.target.dataset.c, paintValue); updateOutput();
}
document.addEventListener('pointerup', () => { painting = false; });

function setPixel(r, c, v) {
  pixels[r][c] = v;
  const d = gridEl.querySelector(`.dot[data-r="${r}"][data-c="${c}"]`);
  if (d) { d.classList.toggle('on', !!v); d.classList.remove('ghost'); }
}

function setMode(m) {
  mode = m;
  document.getElementById('mode-draw').classList.toggle('active', m === 'draw');
  document.getElementById('mode-erase').classList.toggle('active', m === 'erase');
}

function clearGrid() {
  for (let r = 0; r < pixelH; r++) for (let c = 0; c < pixelW; c++) pixels[r][c] = 0;
  buildGrid(); updateOutput();
}
function fillAll() {
  for (let r = 0; r < pixelH; r++) for (let c = 0; c < pixelW; c++) pixels[r][c] = 1;
  buildGrid(); updateOutput();
}
function invertAll() {
  for (let r = 0; r < pixelH; r++) for (let c = 0; c < pixelW; c++) pixels[r][c] = pixels[r][c] ? 0 : 1;
  buildGrid(); updateOutput();
}

function computeBraille(g) {
  if (!g) g = pixels;
  const lines = [];
  for (let cr = 0; cr < cellRows; cr++) {
    let line = '';
    for (let cc = 0; cc < cellCols; cc++) {
      let mask = 0;
      for (let dr = 0; dr < 4; dr++)
        for (let dc = 0; dc < 2; dc++)
          if (g[cr*4+dr][cc*2+dc]) mask |= DOT_BITS[dr][dc];
      line += String.fromCodePoint(0x2800 + mask);
    }
    lines.push(line);
  }
  return lines;
}
function computeASCII(g) {
  if (!g) g = pixels;
  const lines = [];
  for (let r = 0; r < pixelH; r++) {
    let l = '';
    for (let c = 0; c < pixelW; c++) l += g[r][c] ? '##' : '..';
    lines.push(l);
  }
  return lines;
}
function computeTermdot(g) {
  if (!g) g = pixels;
  let s = '';
  for (let r = 0; r < pixelH; r++) for (let c = 0; c < pixelW; c++) s += g[r][c] ? '*' : '.';
  return s;
}

function updateOutput(skipAnim) {
  const bl = computeBraille(), al = computeASCII();
  document.getElementById('out-braille').textContent = bl.join('\n');
  document.getElementById('out-unicode').textContent = bl.map(l =>
    [...l].map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ')
  ).join('\n');
  document.getElementById('out-ascii').textContent = al.join('\n');
  document.getElementById('out-termdot').textContent = '"' + computeTermdot() + '"';
  const js = bl.length === 1 ? `'${bl[0]}'` : bl.map(l => `'${l}'`).join(' + \'\\n\' +\n');
  document.getElementById('out-js').textContent = js;
  updateCurrentThumb();
  if (!skipAnim) updateAnimExport();
}

// Frame management
function addFrame() {
  stopPlayback();
  frames.splice(currentFrame + 1, 0, makeEmptyGrid());
  currentFrame++; pixels = frames[currentFrame];
  buildGrid(); updateOutput(); renderTimeline();
}
function duplicateFrame() {
  stopPlayback();
  frames.splice(currentFrame + 1, 0, cloneGrid(frames[currentFrame]));
  currentFrame++; pixels = frames[currentFrame];
  buildGrid(); updateOutput(); renderTimeline();
}
function deleteFrame() {
  if (frames.length <= 1) return; stopPlayback();
  frames.splice(currentFrame, 1);
  if (currentFrame >= frames.length) currentFrame = frames.length - 1;
  pixels = frames[currentFrame];
  buildGrid(); updateOutput(); renderTimeline();
}
function moveFrameLeft() {
  if (currentFrame <= 0) return; stopPlayback();
  [frames[currentFrame-1], frames[currentFrame]] = [frames[currentFrame], frames[currentFrame-1]];
  currentFrame--; pixels = frames[currentFrame];
  renderTimeline(); updateAnimExport();
}
function moveFrameRight() {
  if (currentFrame >= frames.length - 1) return; stopPlayback();
  [frames[currentFrame+1], frames[currentFrame]] = [frames[currentFrame], frames[currentFrame+1]];
  currentFrame++; pixels = frames[currentFrame];
  renderTimeline(); updateAnimExport();
}
function switchToFrame(i) {
  currentFrame = i; pixels = frames[currentFrame];
  refreshGridDots(); updateOutput(isPlaying); updateActiveThumb();
}

// Playback
function togglePlay() { isPlaying ? stopPlayback() : startPlayback(); }
function startPlayback() {
  if (frames.length <= 1) return;
  isPlaying = true; updatePlayBtn(); playTick();
}
function stopPlayback() {
  isPlaying = false;
  if (playTimer) { clearTimeout(playTimer); playTimer = null; }
  updatePlayBtn(); updateAnimExport();
}
function playTick() {
  if (!isPlaying) return;
  let next = currentFrame + 1;
  if (next >= frames.length) { if (loopAnim) next = 0; else { stopPlayback(); return; } }
  switchToFrame(next);
  playTimer = setTimeout(playTick, 1000 / animFPS);
}
function stepForward() { stopPlayback(); switchToFrame((currentFrame + 1) % frames.length); }
function stepBackward() { stopPlayback(); switchToFrame((currentFrame - 1 + frames.length) % frames.length); }
function setAnimFPS(v) {
  animFPS = parseInt(v); fpsValueEl.textContent = animFPS;
  if (isPlaying) { if (playTimer) clearTimeout(playTimer); playTimer = setTimeout(playTick, 1000/animFPS); }
  updateAnimExport();
}
function toggleLoop() { loopAnim = !loopAnim; document.getElementById('loop-btn').classList.toggle('active', loopAnim); }
function toggleOnion() { onionSkin = !onionSkin; document.getElementById('onion-btn').classList.toggle('active', onionSkin); refreshGridDots(); }
function updatePlayBtn() { playBtnEl.innerHTML = isPlaying ? '&#9646;&#9646; Pause' : '&#9654; Play'; }

// Timeline
function renderTimeline() {
  stripEl.innerHTML = '';
  frames.forEach((frame, i) => {
    const th = document.createElement('div');
    th.className = 'frame-thumb' + (i === currentFrame ? ' active' : '');
    const n = document.createElement('span'); n.className = 'frame-num'; n.textContent = i + 1; th.appendChild(n);
    const p = document.createElement('div'); p.className = 'frame-preview';
    p.textContent = computeBraille(frame).join('\n'); th.appendChild(p);
    th.addEventListener('click', () => { stopPlayback(); switchToFrame(i); });
    stripEl.appendChild(th);
  });
  const ab = document.createElement('button'); ab.className = 'frame-add-btn';
  ab.textContent = '+'; ab.title = 'Add frame (N)'; ab.setAttribute('aria-label','Add frame');
  ab.addEventListener('click', addFrame); stripEl.appendChild(ab);
  updateActiveThumb();
}
function updateActiveThumb() {
  const ts = stripEl.querySelectorAll('.frame-thumb');
  ts.forEach((t, i) => t.classList.toggle('active', i === currentFrame));
  frameCounterEl.textContent = `${currentFrame + 1} / ${frames.length}`;
  if (ts[currentFrame]) ts[currentFrame].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}
function updateCurrentThumb() {
  const ts = stripEl.querySelectorAll('.frame-thumb');
  if (ts[currentFrame]) {
    const p = ts[currentFrame].querySelector('.frame-preview');
    if (p) p.textContent = computeBraille().join('\n');
  }
}

// Animation export
function computeAnimExport() {
  const fmt = document.getElementById('anim-format').value;
  if (fmt === 'js-braille') {
    const items = frames.map(f => { const l = computeBraille(f); return l.length === 1 ? l[0] : l.join('\n'); });
    return 'const frames = [\n' + items.map(s => `  ${JSON.stringify(s)},`).join('\n') + '\n];';
  }
  if (fmt === 'js-termdot') {
    const items = frames.map(f => computeTermdot(f));
    return 'const frames = [\n' + items.map(s => `  ${JSON.stringify(s)},`).join('\n') + '\n];';
  }
  if (fmt === 'js-grid') {
    return 'const frames = [\n' + frames.map(f => `  ${JSON.stringify(f)},`).join('\n') + '\n];';
  }
  if (fmt === 'json') {
    return JSON.stringify({ cols: cellCols, rows: cellRows, fps: animFPS, frames: frames.map(f => computeBraille(f)) }, null, 2);
  }
  return '';
}
function updateAnimExport() { document.getElementById('out-anim').textContent = computeAnimExport(); }

// Copy
function copySection(btn, id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    btn.textContent = 'Copied'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1200);
  });
}

// Events
colsEl.addEventListener('change', init);
rowsEl.addEventListener('change', init);
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'c' && !e.metaKey && !e.ctrlKey) clearGrid();
  if (e.key === 'f') fillAll();
  if (e.key === 'i') invertAll();
  if (e.key === 'd') setMode('draw');
  if (e.key === 'e') setMode('erase');
  if (e.key === 'ArrowLeft') { e.preventDefault(); stepBackward(); }
  if (e.key === 'ArrowRight') { e.preventDefault(); stepForward(); }
  if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  if (e.key === 'n') addFrame();
});

init();
