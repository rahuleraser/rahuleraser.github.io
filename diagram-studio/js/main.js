window.App = window.App || {};

App.ui = (function () {
  var FILLS = ['#ffffff', '#eef2ff', '#dbeafe', '#e0f2fe', '#f0fdf4', '#ecfdf5', '#fef3c7', '#fce7f3', '#fef2f2', '#f8fafc', '#fffbeb', '#f5f3ff'];
  var STROKES = ['#1f2937', '#4f46e5', '#2563eb', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#64748b', '#0f172a'];

  function el(id) { return document.getElementById(id); }

  function toast(msg, isError) {
    var box = el('toasts');
    var t = document.createElement('div');
    t.className = 'toast' + (isError ? ' error' : '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 2800);
  }

  function updateZoomLabel() {
    var v = App.state.state.view;
    var lbl = el('zoomLabel');
    if (lbl) lbl.textContent = Math.round(v.scale * 100) + '%';
  }

  function setSaveState(mode) {
    var s = el('saveState');
    if (!s) return;
    if (mode === 'saved') {
      s.textContent = 'Saved locally';
      s.className = 'save-state saved';
      setTimeout(function () { s.textContent = ''; }, 2000);
    }
  }

  function updateUI() {
    var st = App.state.state;
    el('shapeCount').textContent = st.shapes.length + ' shape' + (st.shapes.length === 1 ? '' : 's');
    el('gridBtn').classList.toggle('on', st.showGrid);
    el('snapBtn').classList.toggle('on', st.snap);
    renderProperties();
  }

  function updateAll() {
    updateUI();
  }

  /* ---------- header ---------- */
  function setupHeader() {
    document.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.dataset.action;
        handleAction(action);
      });
    });
    el('docTitle').addEventListener('change', function () {
      App.state.state.title = this.value || 'Untitled Diagram';
      App.autosave();
    });
    var input = el('fileInput');
    input.addEventListener('change', function () {
      App.export.openFile(input.files[0]);
      input.value = '';
    });
    document.addEventListener('click', function (e) {
      var menu = el('exportMenu');
      if (menu && !menu.hidden && !e.target.closest('#exportBtn') && !e.target.closest('#exportMenu')) menu.hidden = true;
    });
  }

  function handleAction(action) {
    switch (action) {
      case 'new': newDocument(); break;
      case 'open': el('fileInput').click(); break;
      case 'save': App.export.exportJson(); break;
      case 'templates': openModal('templatesModal'); break;
      case 'generate': openModal('generateModal'); break;
      case 'undo': App.state.undo(); App.render.render(); App.ui.updateUI(); break;
      case 'redo': App.state.redo(); App.render.render(); App.ui.updateUI(); break;
      case 'zoomIn': App.interaction.zoomIn(); break;
      case 'zoomOut': App.interaction.zoomOut(); break;
      case 'zoomFit': App.interaction.zoomFit(); break;
      case 'toggleGrid':
        App.state.state.showGrid = !App.state.state.showGrid;
        App.render.render();
        updateUI();
        break;
      case 'toggleSnap':
        App.state.state.snap = !App.state.state.snap;
        updateUI();
        break;
      case 'help': openModal('helpModal'); break;
    }
  }

  function newDocument() {
    App.state.clearLocal();
    App.state.state.title = 'Untitled Diagram';
    el('docTitle').value = 'Untitled Diagram';
    App.state.loadData({ shapes: [], edges: [] }, 'Untitled Diagram');
    App.interaction.zoomReset();
    toast('New blank diagram');
  }

  function setupExportMenu() {
    el('exportBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = el('exportMenu');
      menu.hidden = !menu.hidden;
    });
    el('exportMenu').addEventListener('click', function (e) {
      var type = e.target.dataset.export;
      if (!type) return;
      el('exportMenu').hidden = true;
      if (type === 'png') App.export.exportPng();
      else if (type === 'svg') App.export.exportSvg();
      else if (type === 'json') App.export.exportJson();
    });
  }

  /* ---------- toolbar tools ---------- */
  function setupTools() {
    document.querySelectorAll('.tool-btn').forEach(function (btn) {
      var ic = btn.dataset.icon;
      if (ic) btn.innerHTML = App.icons.stroke(ic, 17);
      btn.addEventListener('click', function () {
        App.interaction.setTool(btn.dataset.tool);
      });
    });
  }

  /* ---------- palette ---------- */
  function buildPalette() {
    var container = el('palette');
    container.innerHTML = '';
    App.shapes.PALETTE.forEach(function (group) {
      var title = document.createElement('div');
      title.className = 'palette-group-title';
      title.textContent = group.title;
      container.appendChild(title);
      group.items.forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'palette-item';
        row.draggable = true;
        row.title = item.name;
        var thumb = App.shapes.thumbSvg(item.kind, 40, 30);
        var name = document.createElement('span');
        name.className = 'palette-name';
        name.textContent = item.name;
        row.appendChild(thumb);
        row.appendChild(name);
        row.addEventListener('click', function () {
          var rect = App.elements.canvas.getBoundingClientRect();
          var cx = rect.width / 2;
          var cy = rect.height / 2;
          var p = App.render.toWorld(rect.left + cx, rect.top + cy);
          var s = App.interaction.addShapeAt(item.kind, p.x - 80, p.y - 40);
        });
        row.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/plain', item.kind);
          e.dataTransfer.effectAllowed = 'copy';
        });
        container.appendChild(row);
      });
    });
    el('paletteSearch').addEventListener('input', function () {
      var q = this.value.trim().toLowerCase();
      container.querySelectorAll('.palette-item').forEach(function (row) {
        row.style.display = row.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
      });
    });
  }

  /* ---------- properties ---------- */
  function swatchHtml(values, current, prop, id, noFill) {
    var html = '<div class="swatches">';
    if (noFill) {
      html += '<div class="swatch no-fill' + (current === null || current === '' || current === '__none__' ? ' sel' : '') + '" data-prop="' + prop + '" data-id="' + id + '" data-value="__none__" title="No fill"></div>';
    }
    values.forEach(function (c) {
      html += '<div class="swatch' + (current === c ? ' sel' : '') + '" style="background:' + c + '" data-prop="' + prop + '" data-id="' + id + '" data-value="' + c + '"></div>';
    });
    html += '</div>';
    return html;
  }

  function renderProperties() {
    var panel = el('properties');
    var st = App.state.state;
    var html = '';
    if (st.selectedEdge && !st.selected.size) {
      var e = st.edges.find(function (x) { return x.id === st.selectedEdge; });
      if (e) html += edgeProps(e);
    } else if (st.selected.size === 1) {
      var s = st.shapes.find(function (x) { return x.id === st.selected.values().next().value; });
      if (s) html += shapeProps(s);
    } else if (st.selected.size > 1) {
      html += multiProps(st.selected.size);
    } else {
      html += canvasProps();
    }
    panel.innerHTML = html;
    panel.querySelectorAll('.prop-input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var prop = inp.dataset.prop;
        var id = inp.dataset.id;
        var value = inp.type === 'number' ? parseFloat(inp.value) : inp.value;
        applyProp(prop, id, value);
      });
    });
    panel.querySelectorAll('[data-prop][data-value]').forEach(function (sw) {
      sw.addEventListener('click', function () {
        var prop = sw.dataset.prop;
        var id = sw.dataset.id;
        var value = sw.dataset.value;
        if (value === '__none__') value = null;
        applyProp(prop, id, value);
      });
    });
    panel.querySelectorAll('input[type="color"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        applyProp(inp.dataset.prop, inp.dataset.id, inp.value);
      });
    });
    panel.querySelectorAll('input[type="checkbox"][data-prop]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        applyProp(inp.dataset.prop, inp.dataset.id, inp.checked);
      });
    });
    panel.querySelectorAll('[data-align]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        App.interaction.align(btn.dataset.align);
      });
    });
    panel.querySelectorAll('[data-dist]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        App.interaction.distribute(btn.dataset.dist);
      });
    });
    panel.querySelectorAll('[data-zorder]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        App.interaction.zOrder(btn.dataset.zorder);
      });
    });
  }

  function applyProp(prop, id, value) {
    var st = App.state.state;
    var shape = st.shapes.find(function (s) { return s.id === id; });
    var edge = st.edges.find(function (e) { return e.id === id; });
    if (!shape && !edge) return;
    App.state.pushHistory();
    var target = shape || edge;
    if (prop === 'x') target.x = value;
    else if (prop === 'y') target.y = value;
    else if (prop === 'w') target.w = Math.max(12, value);
    else if (prop === 'h') target.h = Math.max(12, value);
    else if (prop === 'label') target.label = value;
    else if (prop === 'fill') target.fill = value;
    else if (prop === 'stroke') target.stroke = value;
    else if (prop === 'strokeWidth') target.strokeWidth = Math.max(0.5, value);
    else if (prop === 'textColor') target.textColor = value;
    else if (prop === 'fontSize') target.fontSize = Math.max(8, value);
    else if (prop === 'fontWeight') target.fontWeight = value;
    else if (prop === 'align') target.align = value;
    else if (prop === 'cornerRadius') target.cornerRadius = value;
    else if (prop === 'dashed') target.dashed = !!value;
    else if (prop === 'opacity') target.opacity = value > 1 ? value / 100 : value;
    else if (prop === 'icon') target.icon = !!value;
    else if (prop === 'kind2') {
      target.kind = value;
      target.icon = ['server', 'cylinder', 'cloud', 'laptop', 'desktop', 'phone', 'router', 'switch', 'firewall'].indexOf(value) >= 0;
      if (target.kind === 'text') { target.fontSize = 18; target.align = 'left'; }
      if (target.kind === 'cylinder' && !target.label) target.label = 'Database';
    }
    else if (prop === 'color') target.color = value;
    else if (prop === 'width') target.width = Math.max(0.5, value);
    else if (prop === 'arrow') target.arrow = value;
    else if (prop === 'dir') target.dir = value;
    else if (prop === 'columns') { target.columns = parseColumns(value); App.shapes.computeTableSize(target); }
    if (shape) App.render.refreshShape(shape);
    else App.render.refreshEdge(edge);
    renderProperties();
    App.autosave();
  }

  function parseColumns(text) {
    var cols = [];
    text.split('\n').forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var isKey = /^pk\s+/i.test(line);
      line = line.replace(/^pk\s+/i, '');
      var parts = line.split(':');
      cols.push({
        name: (parts[0] || '').trim() || 'column',
        type: (parts[1] || '').trim() || 'varchar',
        key: isKey
      });
    });
    return cols.length ? cols : [{ name: 'column', type: 'varchar', key: false }];
  }

  function canvasProps() {
    var st = App.state.state;
    var html = '<div class="prop-section"><div class="prop-title">Canvas</div>';
    html += '<div class="prop-row"><span class="prop-label">Show grid</span>' +
      '<input type="checkbox" data-action2="grid" ' + (st.showGrid ? 'checked' : '') + ' onchange="App.ui.setCanvasOpt(&quot;grid&quot;,this.checked)"></div>';
    html += '<div class="prop-row"><span class="prop-label">Snap to grid</span>' +
      '<input type="checkbox" ' + (st.snap ? 'checked' : '') + ' onchange="App.ui.setCanvasOpt(&quot;snap&quot;,this.checked)"></div>';
    html += '<div class="prop-row"><span class="prop-label">Grid size</span>' +
      '<select class="prop-input" onchange="App.ui.setCanvasOpt(&quot;gridSize&quot;,parseInt(this.value))">' +
      [8, 16, 24, 32].map(function (g) { return '<option value="' + g + '"' + (st.gridSize === g ? ' selected' : '') + '>' + g + ' px</option>'; }).join('') +
      '</select></div>';
    html += '<div class="empty-state"><div class="big">Click a shape or edge to edit it</div>Drag shapes from the left palette onto the canvas. Double-click any shape to edit its text. Drag from a blue edge dot to connect shapes.</div>';
    return html;
  }

  function shapeProps(s) {
    var html = '<div class="prop-section"><div class="prop-title">Shape</div>';
    html += '<div class="prop-row"><span class="prop-label">Label</span><textarea class="prop-input" data-prop="label" data-id="' + s.id + '" rows="2">' + esc(s.label || '') + '</textarea></div>';
    var kinds = ['rect', 'rounded', 'terminator', 'trapezoid', 'parallelogram', 'ellipse', 'diamond', 'document', 'cylinder', 'cloud', 'server', 'laptop', 'desktop', 'phone', 'router', 'switch', 'firewall', 'text'];
    html += '<div class="prop-row"><span class="prop-label">Type</span><select class="prop-input" data-prop="kind2" data-id="' + s.id + '">' +
      kinds.map(function (k) { return '<option value="' + k + '"' + (s.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div>';
    html += '<div class="prop-row"><span class="prop-label">Position</span>' +
      '<input class="prop-input" type="number" data-prop="x" data-id="' + s.id + '" value="' + Math.round(s.x) + '" style="width:42%">' +
      '<input class="prop-input" type="number" data-prop="y" data-id="' + s.id + '" value="' + Math.round(s.y) + '" style="width:42%"></div>';
    html += '<div class="prop-row"><span class="prop-label">Size</span>' +
      '<input class="prop-input" type="number" data-prop="w" data-id="' + s.id + '" value="' + Math.round(s.w) + '" style="width:42%">' +
      '<input class="prop-input" type="number" data-prop="h" data-id="' + s.id + '" value="' + Math.round(s.h) + '" style="width:42%"></div>';
    html += '</div>';

    html += '<div class="prop-section"><div class="prop-title">Fill</div>' +
      swatchHtml(FILLS, s.fill, 'fill', s.id, true) +
      '<div class="prop-row"><span class="prop-label">Custom</span><input type="color" class="prop-color" data-prop="fill" data-id="' + s.id + '" value="' + (s.fill && s.fill !== '__none__' ? s.fill : '#ffffff') + '"></div></div>';

    html += '<div class="prop-section"><div class="prop-title">Border</div>' +
      swatchHtml(STROKES, s.stroke, 'stroke', s.id, false) +
      '<div class="prop-row"><span class="prop-label">Width</span><input class="prop-input" type="number" step="0.5" min="0.5" data-prop="strokeWidth" data-id="' + s.id + '" value="' + s.strokeWidth + '"></div>' +
      '<div class="prop-row"><span class="prop-label">Dashed</span><input type="checkbox" data-prop="dashed" data-id="' + s.id + '" ' + (s.dashed ? 'checked' : '') + '></div></div>';

    html += '<div class="prop-section"><div class="prop-title">Text</div>' +
      '<div class="prop-row"><span class="prop-label">Color</span>' + swatchHtml(STROKES.slice(0, 8), s.textColor, 'textColor', s.id, false) + '</div>' +
      '<div class="prop-row"><span class="prop-label">Size</span><input class="prop-input" type="number" min="8" data-prop="fontSize" data-id="' + s.id + '" value="' + s.fontSize + '"></div>' +
      '<div class="prop-row"><span class="prop-label">Weight</span><select class="prop-input" data-prop="fontWeight" data-id="' + s.id + '">' +
      [['400', 'Normal'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']].map(function (o) { return '<option value="' + o[0] + '"' + (s.fontWeight === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="prop-row"><span class="prop-label">Align</span><select class="prop-input" data-prop="align" data-id="' + s.id + '">' +
      '<option value="center"' + (s.align === 'center' ? ' selected' : '') + '>Center</option><option value="left"' + (s.align === 'left' ? ' selected' : '') + '>Left</option></select></div></div>';

    html += '<div class="prop-section"><div class="prop-title">Effects</div>';
    html += '<div class="prop-row"><span class="prop-label">Opacity</span><input class="prop-input" type="number" min="10" max="100" data-prop="opacity" data-id="' + s.id + '" value="' + Math.round((s.opacity || 1) * 100) + '"></div>';
    if (s.kind === 'rect' || s.kind === 'rounded') {
      html += '<div class="prop-row"><span class="prop-label">Radius</span><input class="prop-input" type="number" min="0" max="50" data-prop="cornerRadius" data-id="' + s.id + '" value="' + s.cornerRadius + '"></div>';
    }
    var hasGlyph = ['server', 'cylinder', 'cloud', 'laptop', 'desktop', 'phone', 'router', 'switch', 'firewall'].indexOf(s.kind) >= 0;
    if (hasGlyph) {
      html += '<div class="prop-row"><span class="prop-label">Icon</span><input type="checkbox" data-prop="icon" data-id="' + s.id + '" ' + (s.icon ? 'checked' : '') + '></div>';
    }
    html += '</div>';

    if (s.kind === 'table') {
      html += '<div class="prop-section"><div class="prop-title">Columns (PK name: type)</div>';
      html += '<textarea class="prop-input" data-prop="columns" data-id="' + s.id + '" rows="6">' + esc((s.columns || []).map(function (c) { return (c.key ? 'PK ' : '') + c.name + ': ' + c.type; }).join('\n')) + '</textarea></div>';
    }

    html += '<div class="prop-section"><div class="prop-title">Arrange</div><div class="btn-row">' +
      '<button class="btn" data-zorder="front">' + App.icons.stroke('front', 14) + ' Front</button>' +
      '<button class="btn" data-zorder="back">' + App.icons.stroke('back', 14) + ' Back</button>' +
      '</div></div>';
    return html;
  }

  function edgeProps(e) {
    var html = '<div class="prop-section"><div class="prop-title">Connector</div>';
    html += '<div class="prop-row"><span class="prop-label">Label</span><input class="prop-input" data-prop="label" data-id="' + e.id + '" value="' + esc(e.label || '') + '"></div>';
    html += '<div class="prop-row"><span class="prop-label">Color</span>' + swatchHtml(STROKES, e.color || '#475569', 'color', e.id, false) + '</div>';
    html += '<div class="prop-row"><span class="prop-label">Width</span><input class="prop-input" type="number" step="0.5" min="0.5" max="8" data-prop="width" data-id="' + e.id + '" value="' + (e.width || 1.8) + '"></div>';
    html += '<div class="prop-row"><span class="prop-label">Dashed</span><input type="checkbox" data-prop="dashed" data-id="' + e.id + '" ' + (e.dashed ? 'checked' : '') + '></div>';
    html += '<div class="prop-row"><span class="prop-label">Arrow</span><select class="prop-input" data-prop="arrow" data-id="' + e.id + '">' +
      [['arrow', 'Arrow'], ['open', 'Line'], ['diamond', 'Diamond'], ['none', 'None']].map(function (o) { return '<option value="' + o[0] + '"' + (e.arrow === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
    html += '</div>';
    html += '<div class="empty-state">Connectors snap to the nearest edge of a shape. Drag them by re-dragging from a blue dot.</div>';
    return html;
  }

  function multiProps(count) {
    var html = '<div class="prop-section"><div class="prop-title">' + count + ' elements selected</div></div>';
    html += '<div class="prop-section"><div class="prop-title">Align</div><div class="btn-row">';
    [['alignL', 'left'], ['alignC', 'centerH'], ['alignR', 'right']].forEach(function (a) {
      html += '<button class="btn" data-align="' + a[1] + '" title="Align ' + a[1] + '">' + App.icons.stroke(a[0], 14) + '</button>';
    });
    html += '</div><div class="btn-row" style="margin-top:6px">';
    [['alignT', 'top'], ['alignM', 'centerV'], ['alignB', 'bottom']].forEach(function (a) {
      html += '<button class="btn" data-align="' + a[1] + '" title="Align ' + a[1] + '">' + App.icons.stroke(a[0], 14) + '</button>';
    });
    html += '</div></div>';
    html += '<div class="prop-section"><div class="prop-title">Distribute</div><div class="btn-row">' +
      '<button class="btn" data-dist="horizontal">' + App.icons.stroke('distH', 14) + ' Horizontal</button>' +
      '<button class="btn" data-dist="vertical">' + App.icons.stroke('distV', 14) + ' Vertical</button>' +
      '</div></div>';
    return html;
  }

  function esc(txt) {
    return String(txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- modals ---------- */
  function openModal(id) {
    el(id).hidden = false;
    if (id === 'templatesModal') buildTemplatesGrid();
  }
  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(function (m) { m.hidden = true; });
  }

  function buildTemplatesGrid() {
    var grid = el('tplGrid');
    grid.innerHTML = '';
    App.templates.LIST.forEach(function (tpl) {
      var card = document.createElement('div');
      card.className = 'tpl-card';
      card.dataset.tpl = tpl.id;
      card.innerHTML = '<div class="tpl-thumb"><img alt="' + tpl.name + '"></div>' +
        '<div class="tpl-meta"><div class="tpl-name">' + tpl.name + '</div><div class="tpl-desc">' + tpl.desc + '</div></div>';
      card.addEventListener('click', function () {
        App.templates.load(tpl.id);
        closeModals();
      });
      grid.appendChild(card);
    });
    App.templates.LIST.forEach(function (tpl) {
      setTimeout(function () { App.templates.thumbDataURL(tpl, 230, 140); }, 10);
    });
  }

  /* ---------- generate modal ---------- */
  function setupGenerate() {
    var tab = 'flow';
    var help = {
      flow: 'Format: <code>A -&gt; B</code> creates a node and arrow. Append <code>: label</code> to name the arrow. End a node name with <code>?</code> to make it a decision diamond. Chains like <code>A -&gt; B -&gt; C</code> work too.',
      seq: 'Format: <code>Sender -&gt; Receiver: message</code>. Actors are created automatically. Messages alternate direction and are drawn as dashed responses when going right to left.'
    };
    document.querySelectorAll('#generateModal .tab').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        tab = tabBtn.dataset.tab;
        document.querySelectorAll('#generateModal .tab').forEach(function (t) { t.classList.toggle('active', t === tabBtn); });
        el('genHelp').innerHTML = help[tab];
      });
    });
    el('genGo').addEventListener('click', function () {
      var text = el('genInput').value;
      if (!text.trim()) { toast('Enter some text first', true); return; }
      var ok = App.textDiagram.generate(text, tab);
      if (ok) {
        closeModals();
        toast('Diagram generated');
      } else {
        toast('Could not parse text', true);
      }
    });
    el('genHelp').innerHTML = help.flow;
  }

  /* ---------- misc ---------- */
  function setupModals() {
    document.querySelectorAll('.modal-overlay').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m || e.target.closest('[data-close]')) m.hidden = true;
      });
    });
  }

  function setCanvasOpt(opt, value) {
    var st = App.state.state;
    if (opt === 'grid') { st.showGrid = !!value; App.render.render(); }
    else if (opt === 'snap') { st.snap = !!value; }
    else if (opt === 'gridSize') { st.gridSize = value; App.render.render(); }
    updateUI();
  }

  function init() {
    App.autosave = App.export.autosave;
    document.querySelectorAll('[data-ic]').forEach(function (span) {
      span.innerHTML = App.icons.stroke(span.dataset.ic, 15);
    });
    document.querySelectorAll('.btn.icon-only[data-icon]').forEach(function (btn) {
      if (btn.dataset.icon) btn.innerHTML = App.icons.stroke(btn.dataset.icon, 16);
    });
    setupHeader();
    setupExportMenu();
    setupTools();
    buildPalette();
    setupGenerate();
    setupModals();
    var saved = App.state.loadLocal();
    if (saved) {
      App.state.loadData({ shapes: saved.shapes, edges: saved.edges }, saved.title);
      el('docTitle').value = saved.title || 'Untitled Diagram';
      toast('Restored your work (saved in this browser)');
    } else {
      App.state.loadData({ shapes: [], edges: [] }, 'Untitled Diagram');
    }
    App.interaction.zoomFit();
    App.render.render();
    App.ui.updateUI();
  }

  return {
    init: init,
    updateUI: updateUI,
    updateAll: updateAll,
    updateZoomLabel: updateZoomLabel,
    setSaveState: setSaveState,
    toast: toast,
    openModal: openModal,
    setCanvasOpt: setCanvasOpt,
    exportPng: function () { App.export.exportPng(); },
    exportJson: function () { App.export.exportJson(); }
  };
})();

App.render.init();
App.interaction.init();
App.ui.init();
