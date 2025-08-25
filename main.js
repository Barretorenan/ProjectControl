// Estado e utilitários
const STORAGE_KEY = "proto-project-v1";

/** @typedef {{ id: string, type: string, x: number, y: number, w: number, h: number, text?: string, toPageId?: string, props?: Record<string, any> }} Element */
/** @typedef {{ id: string, name: string, elements: Element[] }} Page */
/** @typedef {{ id: string, name: string, pages: Page[], currentPageId: string|null }} Project */

const defaultPalette = [
  { type: "texto", label: "Texto", defaults: { w: 120, h: 40, text: "Texto" } },
  { type: "botao", label: "Botão", defaults: { w: 100, h: 36, text: "Botão" } },
  { type: "entrada", label: "Entrada", defaults: { w: 200, h: 36, text: "Placeholder" } },
  { type: "cartao", label: "Cartão", defaults: { w: 200, h: 120, text: "Cartão" } },
  { type: "imagem", label: "Imagem", defaults: { w: 160, h: 100, text: "Imagem" } },
];

/** @type {Project} */
let project = createNewProject();
let selectedElementId = null;
let isPreview = false;

// Seletores
const el = {
  projectTitle: document.getElementById("projectTitle"),
  btnPreview: document.getElementById("btnPreview"),
  btnNewPage: document.getElementById("btnNewPage"),
  btnAddPageSmall: document.getElementById("btnAddPageSmall"),
  btnExport: document.getElementById("btnExport"),
  fileImport: document.getElementById("fileImport"),
  btnFlowMap: document.getElementById("btnFlowMap"),
  pagesList: document.getElementById("pagesList"),
  paletteItems: document.getElementById("paletteItems"),
  canvas: document.getElementById("canvas"),
  inspector: document.getElementById("inspector"),
  inspectorBody: document.getElementById("inspectorBody"),
  flowOverlay: document.getElementById("flowOverlay"),
  flowSvg: document.getElementById("flowSvg"),
  btnCloseFlow: document.getElementById("btnCloseFlow"),
  statusBar: document.getElementById("statusBar"),
};

// Inicialização
loadFromStorage();
renderAll();
registerGlobalEvents();

function createNewProject() {
  const firstPageId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    name: "Projeto sem título",
    pages: [
      { id: firstPageId, name: "Página 1", elements: [] }
    ],
    currentPageId: firstPageId,
  };
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) project = JSON.parse(raw);
  } catch {}
}

function renderAll() {
  document.title = project.name + " — Prototipagem";
  el.projectTitle.textContent = project.name;
  renderPalette();
  renderPagesList();
  renderCanvas();
  renderInspector();
  updatePreviewMode();
}

function currentPage() {
  return project.pages.find(p => p.id === project.currentPageId) || project.pages[0];
}

function renderPalette() {
  el.paletteItems.innerHTML = "";
  for (const item of defaultPalette) {
    const div = document.createElement("div");
    div.className = "palette-item";
    div.draggable = true;
    div.textContent = item.label;
    div.dataset.type = item.type;
    div.addEventListener("dragstart", ev => {
      ev.dataTransfer?.setData("application/x-type", item.type);
      ev.dataTransfer?.setData("text/plain", item.type);
    });
    el.paletteItems.appendChild(div);
  }
}

function renderPagesList() {
  el.pagesList.innerHTML = "";
  for (const page of project.pages) {
    const li = document.createElement("li");
    li.className = "page-item" + (page.id === project.currentPageId ? " active" : "");
    const btn = document.createElement("button");
    btn.textContent = page.name;
    btn.addEventListener("click", () => { project.currentPageId = page.id; selectedElementId = null; renderAll(); saveToStorage(); });
    const actions = document.createElement("div");
    const rename = document.createElement("button"); rename.textContent = "✎"; rename.title = "Renomear";
    rename.addEventListener("click", () => {
      const name = prompt("Nome da página:", page.name);
      if (name) { page.name = name; renderPagesList(); renderCanvas(); saveToStorage(); }
    });
    const del = document.createElement("button"); del.textContent = "🗑"; del.title = "Excluir";
    del.addEventListener("click", () => {
      if (!confirm("Excluir página?")) return;
      if (project.pages.length <= 1) { alert("Mantenha ao menos uma página."); return; }
      const idx = project.pages.findIndex(p => p.id === page.id);
      project.pages.splice(idx, 1);
      project.currentPageId = project.pages[0].id;
      selectedElementId = null;
      renderAll(); saveToStorage();
    });
    actions.append(rename, del);
    li.append(btn, actions);
    el.pagesList.appendChild(li);
  }
}

function renderCanvas() {
  const page = currentPage();
  el.canvas.innerHTML = "";
  el.canvas.classList.toggle("preview-mode", isPreview);
  el.canvas.addEventListener("dragover", ev => ev.preventDefault());
  el.canvas.addEventListener("drop", onDropOnCanvas);

  for (const element of page.elements) {
    const node = createElementNode(element);
    el.canvas.appendChild(node);
  }
}

function createElementNode(element) {
  const node = document.createElement("div");
  node.className = "element draggable" + (element.id === selectedElementId ? " selected" : "");
  node.style.left = element.x + "px";
  node.style.top = element.y + "px";
  node.style.width = element.w + "px";
  node.style.height = element.h + "px";
  node.tabIndex = 0;
  node.dataset.id = element.id;

  const label = document.createElement("div");
  label.textContent = element.text || element.type;
  node.appendChild(label);

  const resize = document.createElement("div");
  resize.className = "resize-handle";
  node.appendChild(resize);

  node.addEventListener("mousedown", ev => startDragElement(ev, element));
  resize.addEventListener("mousedown", ev => startResizeElement(ev, element));
  node.addEventListener("click", ev => {
    if (isPreview && element.toPageId) {
      project.currentPageId = element.toPageId;
      selectedElementId = null;
      renderAll(); saveToStorage();
      return;
    }
    if (!isPreview) { selectedElementId = element.id; renderInspector(); updateSelection(); }
  });

  return node;
}

function onDropOnCanvas(ev) {
  ev.preventDefault();
  const type = ev.dataTransfer?.getData("application/x-type");
  if (!type) return;
  const paletteItem = defaultPalette.find(p => p.type === type);
  if (!paletteItem) return;
  const rect = el.canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  const element = {
    id: crypto.randomUUID(),
    type,
    x: Math.round(x - (paletteItem.defaults.w || 80) / 2),
    y: Math.round(y - (paletteItem.defaults.h || 40) / 2),
    w: paletteItem.defaults.w || 80,
    h: paletteItem.defaults.h || 40,
    text: paletteItem.defaults.text || type,
    props: {},
  };
  currentPage().elements.push(element);
  selectedElementId = element.id;
  renderCanvas(); renderInspector(); saveToStorage();
}

// Movimentação e redimensionamento
function startDragElement(ev, element) {
  if (isPreview) return;
  const startX = ev.clientX, startY = ev.clientY;
  const origX = element.x, origY = element.y;
  function onMove(e) {
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    element.x = Math.max(0, Math.round(origX + dx));
    element.y = Math.max(0, Math.round(origY + dy));
    renderCanvasOnlyPositions();
  }
  function onUp() {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    saveToStorage();
  }
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function startResizeElement(ev, element) {
  ev.stopPropagation();
  if (isPreview) return;
  const startX = ev.clientX, startY = ev.clientY;
  const origW = element.w, origH = element.h;
  function onMove(e) {
    const dw = e.clientX - startX; const dh = e.clientY - startY;
    element.w = Math.max(40, Math.round(origW + dw));
    element.h = Math.max(30, Math.round(origH + dh));
    renderCanvasOnlyPositions();
  }
  function onUp() {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    saveToStorage();
  }
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function renderCanvasOnlyPositions() {
  const page = currentPage();
  for (const element of page.elements) {
    const node = el.canvas.querySelector(`.element[data-id="${element.id}"]`);
    if (!node) continue;
    node.style.left = element.x + "px";
    node.style.top = element.y + "px";
    node.style.width = element.w + "px";
    node.style.height = element.h + "px";
  }
}

function updateSelection() {
  const nodes = el.canvas.querySelectorAll(".element");
  nodes.forEach(n => n.classList.toggle("selected", n.dataset.id === selectedElementId));
}

// Inspector
function renderInspector() {
  const page = currentPage();
  const element = page.elements.find(e => e.id === selectedElementId);
  if (!element) {
    el.inspectorBody.innerHTML = `<p>Nenhum elemento selecionado.</p>`;
    return;
  }
  const pagesOptions = project.pages.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  el.inspectorBody.innerHTML = `
    <div class="row">
      <div>
        <label>Tipo</label>
        <input value="${element.type}" disabled>
      </div>
      <div>
        <label>Texto</label>
        <input id="inpText" value="${escapeHtml(element.text || "")}">
      </div>
    </div>
    <div class="row">
      <div>
        <label>X</label>
        <input id="inpX" type="number" value="${element.x}">
      </div>
      <div>
        <label>Y</label>
        <input id="inpY" type="number" value="${element.y}">
      </div>
    </div>
    <div class="row">
      <div>
        <label>Largura</label>
        <input id="inpW" type="number" value="${element.w}">
      </div>
      <div>
        <label>Altura</label>
        <input id="inpH" type="number" value="${element.h}">
      </div>
    </div>
    <div>
      <label>Ao clicar, ir para página</label>
      <select id="selLink">
        <option value="">— Nenhum —</option>
        ${pagesOptions}
      </select>
    </div>
  `;
  /** @type {HTMLInputElement} */ (document.getElementById("inpText")).addEventListener("input", e => { element.text = e.target.value; renderCanvas(); saveToStorage(); });
  ["inpX","inpY","inpW","inpH"].forEach(id => {
    /** @type {HTMLInputElement} */ (document.getElementById(id)).addEventListener("change", e => {
      const val = parseInt(e.target.value, 10) || 0;
      if (id === "inpX") element.x = Math.max(0, val);
      if (id === "inpY") element.y = Math.max(0, val);
      if (id === "inpW") element.w = Math.max(40, val);
      if (id === "inpH") element.h = Math.max(30, val);
      renderCanvas(); saveToStorage();
    });
  });
  /** @type {HTMLSelectElement} */ (document.getElementById("selLink")).addEventListener("change", e => {
    const value = e.target.value || null;
    element.toPageId = value || undefined;
    saveToStorage();
  });
  if (element.toPageId) {
    /** @type {HTMLSelectElement} */ (document.getElementById("selLink")).value = element.toPageId;
  }
}

// Eventos globais
function registerGlobalEvents() {
  el.btnNewPage.addEventListener("click", addPage);
  el.btnAddPageSmall.addEventListener("click", addPage);
  el.btnExport.addEventListener("click", onExport);
  el.fileImport.addEventListener("change", onImport);
  el.btnPreview.addEventListener("click", () => { isPreview = !isPreview; updatePreviewMode(); });
  el.btnFlowMap.addEventListener("click", () => { renderFlowMap(); el.flowOverlay.hidden = false; });
  el.btnCloseFlow.addEventListener("click", () => { el.flowOverlay.hidden = true; });
  el.projectTitle.addEventListener("click", () => {
    const name = prompt("Nome do projeto:", project.name);
    if (name) { project.name = name; renderAll(); saveToStorage(); }
  });
  document.addEventListener("keydown", onKeyDown);
}

function onKeyDown(ev) {
  if (ev.key === "Delete" || ev.key === "Backspace") {
    if (!selectedElementId || isPreview) return;
    const page = currentPage();
    page.elements = page.elements.filter(e => e.id !== selectedElementId);
    selectedElementId = null;
    renderCanvas(); renderInspector(); saveToStorage();
  }
}

function addPage() {
  const name = prompt("Nome da nova página:", `Página ${project.pages.length + 1}`);
  const page = { id: crypto.randomUUID(), name: name || `Página ${project.pages.length + 1}`, elements: [] };
  project.pages.push(page);
  project.currentPageId = page.id;
  selectedElementId = null;
  renderAll(); saveToStorage();
}

function updatePreviewMode() {
  document.body.classList.toggle("preview-mode", isPreview);
  el.btnPreview.setAttribute("aria-pressed", String(isPreview));
  el.btnPreview.textContent = isPreview ? "Editar" : "Pré-visualizar";
  el.statusBar.textContent = isPreview ? "Modo preview: clique em elementos com link para navegar." : "Dica: Arraste itens da paleta para a área central. Use Pré-visualizar para navegar pelos links.";
  renderCanvas();
}

// Exportar/Importar
function onExport() {
  const data = JSON.stringify(project, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = (project.name || "projeto") + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

async function onImport(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.pages)) throw new Error("Arquivo inválido");
    project = data;
    selectedElementId = null; isPreview = false;
    renderAll(); saveToStorage();
  } catch (e) {
    alert("Falha ao importar: " + e.message);
  } finally {
    ev.target.value = "";
  }
}

// Mapa de fluxo
function renderFlowMap() {
  const svg = el.flowSvg;
  svg.innerHTML = "";
  const pages = project.pages;
  const width = svg.clientWidth || 800;
  const height = svg.clientHeight || 600;
  const cols = Math.ceil(Math.sqrt(pages.length));
  const rows = Math.ceil(pages.length / cols);
  const cellW = width / cols; const cellH = height / rows;
  const pagePositions = new Map();
  pages.forEach((p, i) => {
    const cx = (i % cols) * cellW + cellW / 2;
    const cy = Math.floor(i / cols) * cellH + cellH / 2;
    pagePositions.set(p.id, { cx, cy });
    const rect = makeSvg("rect", { x: cx - 80, y: cy - 24, width: 160, height: 48, rx: 8, fill: "#1b2633", stroke: "#29445f" });
    const text = makeSvg("text", { x: cx, y: cy + 4, fill: "#dce6f0", "text-anchor": "middle", "font-size": 12 });
    text.textContent = p.name;
    svg.append(rect, text);
  });
  // links
  for (const p of pages) {
    for (const el of p.elements) {
      if (!el.toPageId) continue;
      const from = pagePositions.get(p.id), to = pagePositions.get(el.toPageId);
      if (!from || !to) continue;
      const path = makeSvg("path", { d: connectorPath(from.cx, from.cy, to.cx, to.cy), fill: "none", stroke: "#7bdba3", "stroke-width": 2, "marker-end": "url(#arrow)" });
      svg.append(path);
    }
  }
  // marker arrow
  if (!svg.querySelector("defs")) {
    const defs = makeSvg("defs", {});
    const marker = makeSvg("marker", { id: "arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
    const arrow = makeSvg("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#7bdba3" });
    marker.appendChild(arrow); defs.appendChild(marker); svg.appendChild(defs);
  }
}

function connectorPath(x1, y1, x2, y2) {
  const dx = (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function makeSvg(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function escapeHtml(str) {
  return str.replace(/[&<>"]+/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s]));
}

