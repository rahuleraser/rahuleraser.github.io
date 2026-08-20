window.App = window.App || {};

App.interaction = (function () {
  var S = function () { return App.state.state; };
  var drag = null;
  var editing = null;

  function svgPoint(clientX, clientY) {
    return App.render.toWorld(clientX, clientY);
  }

  function hitShape(p) {
    var list = S().shapes.slice().sort(function (a, b) { return (b.z || 0) - (a.z || 0); });
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) return s;
    }
    return null;
  }

  function singleSelected() {
    if (S().selected.size !== 1) return null;
    var id = S().selected.values().next().value;
    return S().shapes.find(function (s) { return s.id === id; }) || null;
  }

  function onPointerDown(e) {
    if (editing || e.button !== 0 && e.button !== 1) return;
    if (e.target && e.target.closest && e.target.closest('button, input, textarea, select')) return;
    var canvas = App.elements.canvas;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    var p = svgPoint(e.clientX, e.clientY);

    if (e.button === 1) { startPan(e); return; }
    if (S().spaceDown) { startPan(e); return; }

    var target = e.target;
    if (target && target.dataset) {
      if (target.dataset.h && target.dataset.id) {
        S().selected.add(target.dataset.id);
        S().selectedEdge = null;
        startResize(target.dataset.id, target.dataset.h, p);
        return;
      }
      if (target.dataset.port && target.dataset.id) {
        startConnect({ id: target.dataset.id, port: target.dataset.port }, p);
        return;
      }
      if (target.dataset.edge) {
        selectEdgeOnly(target.dataset.edge);
        return;
      }
    }

    S().hovered = null;
    var portHit = portAt(p);
    if (portHit && S().tool !== 'text') { startConnect(portHit, p); return; }

    var shape = hitShape(p);
    if (shape) {
      if (S().tool === 'connect') {
        startConnect({ id: shape.id, port: App.edges.nearestPort(shape, p) }, p);
        return;
      }
      if (!S().selected.has(shape.id)) selectShape(shape, e.shiftKey);
      S().selectedEdge = null;
      if (S().tool === 'text') { startEditShape(shape); return; }
      startMove(p);
      return;
    }

    S().selected.clear();
    S().selectedEdge = null;
    App.render.drawSelection();
    App.ui.updateUI();
    S().hovered = null;

    if (S().tool === 'text') {
      var s = App.shapes.create('text', p.x - 80, p.y - 14);
      s.label = 'Double-click to edit';
      s.z = Date.now() + Math.random();
      App.state.pushHistory();
      S().shapes.push(s);
      S().selected.clear();
      S().selected.add(s.id);
      App.render.render();
      startEditShape(s);
      return;
    }
    startMarquee(p);
  }

  function portAt(p) {
    var s = singleSelected();
    if (!s) return null;
    var ports = { N: 'N', S: 'S', E: 'E', W: 'W' };
    for (var k in ports) {
      var pp = App.edges.portPoint(s, ports[k]);
      if (Math.hypot(p.x - pp.x, p.y - pp.y) < 9) return { id: s.id, port: ports[k] };
    }
    return null;
  }

  function selectShape(shape, additive) {
    if (additive) {
      if (S().selected.has(shape.id)) S().selected.delete(shape.id);
      else S().selected.add(shape.id);
    } else {
      S().selected.clear();
      S().selected.add(shape.id);
    }
    S().selectedEdge = null;
    App.render.drawSelection();
    App.ui.updateUI();
  }

  function selectEdgeOnly(id) {
    S().selected.clear();
    S().selectedEdge = id;
    App.render.drawSelection();
    App.ui.updateUI();
  }

  function startMove(p) {
    if (!S().selected.size) return;
    var orig = [];
    S().shapes.forEach(function (s) {
      if (S().selected.has(s.id)) orig.push({ id: s.id, x: s.x, y: s.y });
    });
    drag = { type: 'move', start: p, orig: orig, moved: false };
  }

  function startResize(id, handle, p) {
    var s = S().shapes.find(function (x) { return x.id === id; });
    if (!s) return;
    drag = { type: 'resize', id: id, h: handle, start: p, orig: { x: s.x, y: s.y, w: s.w, h: s.h } };
  }

  function startPan() {
    drag = { type: 'pan', startClient: { x: lastClientX, y: lastClientY }, startView: { x: S().view.x, y: S().view.y } };
    App.elements.canvas.classList.add('panning');
  }

  var lastClientX = 0, lastClientY = 0;

  function startMarquee(p) {
    drag = { type: 'marquee', start: p, cur: p };
    drawMarquee();
  }

  function drawMarquee() {
    var ov = App.elements.overlay;
    ov.innerHTML = '';
    var a = drag.start, b = drag.cur;
    var canvasRect = App.elements.canvas.getBoundingClientRect();
    function toScreen(pt) {
      var rect = App.elements.canvas.getBoundingClientRect();
      var v = S().view;
      return { x: pt.x * v.scale + v.x + rect.left - canvasRect.left, y: pt.y * v.scale + v.y + rect.top - canvasRect.top };
    }
    var sa = toScreen(a), sb = toScreen(b);
    var x = Math.min(sa.x, sb.x), y = Math.min(sa.y, sb.y);
    var w = Math.abs(sb.x - sa.x), h = Math.abs(sb.y - sa.y);
    var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('class', 'marquee');
    r.setAttribute('x', x); r.setAttribute('y', y);
    r.setAttribute('width', w); r.setAttribute('height', h);
    ov.appendChild(r);
  }

  function startConnect(port, p) {
    S().connecting = { id: port.id, port: port.port, start: p };
    S().selected.clear();
    S().selectedEdge = null;
    App.render.drawSelection();
    App.ui.updateUI();
    drag = { type: 'connect', from: port, cur: p };
    drawTempConnect();
  }

  function drawTempConnect() {
    var layer = App.elements.tempLayer;
    layer.innerHTML = '';
    var src = S().shapes.find(function (s) { return s.id === drag.from.id; });
    if (!src) return;
    var a = App.edges.portPoint(src, drag.from.port);
    var dir = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[drag.from.port];
    var ext = 30;
    var b = { x: drag.cur.x, y: drag.cur.y };
    var p1 = { x: a.x + dir[0] * ext, y: a.y + dir[1] * ext };
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var d = 'M ' + a.x + ' ' + a.y + ' L ' + p1.x + ' ' + p1.y;
    if (Math.abs(drag.cur.x - p1.x) > 8 || Math.abs(drag.cur.y - p1.y) > 8) {
      d += ' L ' + b.x + ' ' + b.y;
    }
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#4f46e5');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', '6 4');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arr-arrow)');
    layer.appendChild(path);
    var over = hitShape(drag.cur);
    if (over && over.id !== drag.from.id) {
      var ring = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      ring.setAttribute('x', over.x - 3); ring.setAttribute('y', over.y - 3);
      ring.setAttribute('width', over.w + 6); ring.setAttribute('height', over.h + 6);
      ring.setAttribute('fill', 'rgba(79,70,229,0.08)');
      ring.setAttribute('stroke', '#4f46e5');
      ring.setAttribute('stroke-width', '2');
      ring.setAttribute('rx', '4');
      layer.appendChild(ring);
    }
  }

  function onPointerMove(e) {
    lastClientX = e.clientX; lastClientY = e.clientY;
    if (editing) return;
    if (S().spaceDown && !drag) { panByDelta(e.movementX, e.movementY); return; }
    if (!drag) {
      var hp = svgPoint(e.clientX, e.clientY);
      var hsh = hitShape(hp);
      var hid = hsh ? hsh.id : null;
      if (S().hovered !== hid) { S().hovered = hid; App.render.drawSelection(); }
      return;
    }
    var p = svgPoint(e.clientX, e.clientY);

    if (drag.type === 'pan') {
      S().view.x = drag.startView.x + (e.clientX - drag.startClient.x);
      S().view.y = drag.startView.y + (e.clientY - drag.startClient.y);
      App.render.applyView();
      return;
    }
    if (drag.type === 'marquee') {
      drag.cur = p;
      drawMarquee();
      return;
    }
    if (drag.type === 'connect') {
      drag.cur = p;
      drawTempConnect();
      return;
    }
    if (drag.type === 'move') {
      drag.moved = true;
      var dx = p.x - drag.start.x;
      var dy = p.y - drag.start.y;
      if (S().snap) { dx = Math.round(dx / S().gridSize) * S().gridSize; dy = Math.round(dy / S().gridSize) * S().gridSize; }
      drag.orig.forEach(function (o) {
        var s = S().shapes.find(function (x) { return x.id === o.id; });
        if (s) { s.x = o.x + dx; s.y = o.y + dy; }
      });
      drag.orig.forEach(function (o) {
        var s = S().shapes.find(function (x) { return x.id === o.id; });
        if (s) App.render.refreshShape(s);
      });
      return;
    }
    if (drag.type === 'resize') {
      var sh = S().shapes.find(function (x) { return x.id === drag.id; });
      if (sh) {
        var o = drag.orig, hp = drag.h;
        var dx2 = p.x - drag.start.x, dy2 = p.y - drag.start.y;
        if (hp.indexOf('e') >= 0) sh.w = Math.max(24, o.w + dx2);
        if (hp.indexOf('s') >= 0) sh.h = Math.max(24, o.h + dy2);
        if (hp.indexOf('w') >= 0) { sh.w = Math.max(24, o.w - dx2); sh.x = o.x + (o.w - sh.w); }
        if (hp.indexOf('n') >= 0) { sh.h = Math.max(24, o.h - dy2); sh.y = o.y + (o.h - sh.h); }
        if (sh.kind === 'table') App.shapes.computeTableSize(sh);
        App.render.refreshShape(sh);
      }
    }
  }

  function onPointerUp(e) {
    var p = svgPoint(e.clientX, e.clientY);
    if (drag && drag.type === 'marquee') {
      finishMarquee(p);
    } else if (drag && drag.type === 'connect') {
      finishConnect(p);
    } else if (drag && drag.type === 'move') {
      if (!drag.moved) { /* was a click-select */ }
      App.autosave();
    } else if (drag && drag.type === 'resize') {
      App.state.pushHistory();
      App.autosave();
    }
    drag = null;
    App.elements.canvas.classList.remove('panning');
    App.render.drawSelection();
  }

  function finishMarquee(p) {
    var a = drag.start, b = p;
    var minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
    var minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
    if (maxX - minX < 3 && maxY - minY < 3) { App.elements.overlay.innerHTML = ''; return; }
    S().selected.clear();
    S().shapes.forEach(function (s) {
      if (s.x <= maxX && s.x + s.w >= minX && s.y <= maxY && s.y + s.h >= minY) S().selected.add(s.id);
    });
    App.elements.overlay.innerHTML = '';
    App.render.drawSelection();
    App.ui.updateUI();
  }

  function finishConnect(p) {
    App.elements.tempLayer.innerHTML = '';
    var target = hitShape(p);
    var from = drag.from;
    if (target && target.id !== from.id) {
      var toPort = App.edges.nearestPort(target, p);
      var e = {
        id: App.state.newId('e'),
        from: from.id,
        to: target.id,
        fromPort: from.port,
        toPort: toPort,
        label: '',
        color: '#475569',
        width: 1.8,
        dashed: false,
        arrow: 'arrow',
        z: Date.now() + Math.random()
      };
      App.state.pushHistory();
      S().edges.push(e);
      S().selected.clear();
      S().selectedEdge = e.id;
      App.render.render();
      App.ui.updateUI();
    }
    S().connecting = null;
    App.render.drawSelection();
  }

  function panByDelta(dx, dy) {
    S().view.x += dx;
    S().view.y += dy;
    App.render.applyView();
  }

  function zoomAt(clientX, clientY, factor) {
    var rect = App.elements.canvas.getBoundingClientRect();
    var px = clientX - rect.left, py = clientY - rect.top;
    var v = S().view;
    var wx = (px - v.x) / v.scale, wy = (py - v.y) / v.scale;
    var ns = Math.max(0.15, Math.min(5, v.scale * factor));
    v.scale = ns;
    v.x = px - wx * ns;
    v.y = py - wy * ns;
    App.render.applyView();
  }

  function onWheel(e) {
    e.preventDefault();
    if (e.ctrlKey) zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 1 / 1.1);
    else {
      S().view.x -= e.deltaX;
      S().view.y -= e.deltaY;
      App.render.applyView();
    }
  }

  function zoomIn() {
    var rect = App.elements.canvas.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
  }
  function zoomOut() {
    var rect = App.elements.canvas.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.2);
  }
  function zoomFit() {
    var b = App.state.bounds();
    var rect = App.elements.canvas.getBoundingClientRect();
    var pad = 40;
    var scale = Math.min((rect.width - pad * 2) / b.w, (rect.height - pad * 2) / b.h, 1.5);
    scale = Math.max(0.15, scale);
    var v = S().view;
    v.scale = scale;
    v.x = (rect.width - b.w * scale) / 2 - b.x * scale;
    v.y = (rect.height - b.h * scale) / 2 - b.y * scale;
    App.render.applyView();
  }

  function zoomReset() {
    var v = S().view;
    v.scale = 1;
    v.x = 0; v.y = 0;
    App.render.applyView();
  }

  /* ---------- text editing ---------- */
  function startEditShape(shape) {
    if (S().editing) return;
    S().editing = true;
    App.state.pushHistory();
    editing = { kind: 'shape', shape: shape, old: shape.label };
    openEditor(shape.x, shape.y, shape.w, shape.h, shape.label, shape.fontSize, shape.textColor, shape.align, shape.kind === 'text');
    positionEditor(shape.x, shape.y, shape.w, shape.h, shape.fontSize);
  }

  function startEditEdge(edge) {
    if (S().editing) return;
    if (!edge._pts) return;
    var lp = App.edges.labelPos(edge._pts);
    if (!lp) return;
    S().editing = true;
    App.state.pushHistory();
    editing = { kind: 'edge', edge: edge, old: edge.label || '' };
    openEditor(lp.x - 80, lp.y - 30, 160, 30, edge.label || '', 13, edge.color, 'center', true);
    positionEditor(lp.x - 80, lp.y - 30, 160, 30, 13);
  }

  function openEditor(x, y, w, h, value, fontSize, color, align, isText) {
    var wrap = document.getElementById('editorWrap');
    var ta = document.getElementById('editorText');
    wrap.hidden = false;
    ta.value = value;
    ta.style.color = color || '#334155';
    ta.style.textAlign = align === 'left' ? 'left' : 'center';
    ta.focus();
    ta.select();
  }

  function positionEditor(x, y, w, h, fontSize) {
    var wrap = document.getElementById('editorWrap');
    var v = S().view;
    wrap.style.left = (x * v.scale + v.x) + 'px';
    wrap.style.top = (y * v.scale + v.y) + 'px';
    wrap.style.width = Math.max(40, w * v.scale) + 'px';
    wrap.style.height = Math.max(24, h * v.scale) + 'px';
    var ta = document.getElementById('editorText');
    ta.style.fontSize = Math.max(9, fontSize * v.scale) + 'px';
    ta.style.fontWeight = '500';
  }

  function onEditorInput() {
    if (!editing) return;
    var val = document.getElementById('editorText').value;
    if (editing.kind === 'shape') {
      editing.shape.label = val;
      App.render.refreshShape(editing.shape);
    } else {
      editing.edge.label = val;
      App.render.refreshEdge(editing.edge);
    }
  }

  function commitEdit() {
    if (!editing) { closeEditor(); return; }
    closeEditor();
    App.autosave();
  }

  function cancelEdit() {
    if (!editing) return;
    if (editing.kind === 'shape') {
      editing.shape.label = editing.old;
      App.render.refreshShape(editing.shape);
    } else {
      editing.edge.label = editing.old;
      App.render.refreshEdge(editing.edge);
    }
    closeEditor();
  }

  function closeEditor() {
    document.getElementById('editorWrap').hidden = true;
    S().editing = false;
    editing = null;
    App.ui.updateUI();
  }

  function onDblClick(e) {
    var p = svgPoint(e.clientX, e.clientY);
    var target = e.target;
    if (target && target.dataset && target.dataset.edge) {
      var edge = S().edges.find(function (x) { return x.id === target.dataset.edge; });
      if (edge) { startEditEdge(edge); return; }
    }
    var shape = hitShape(p);
    if (shape) { startEditShape(shape); return; }
    var s = App.shapes.create('text', p.x - 80, p.y - 14);
    s.label = '';
    s.z = Date.now() + Math.random();
    App.state.pushHistory();
    S().shapes.push(s);
    S().selected.clear();
    S().selected.add(s.id);
    App.render.render();
    startEditShape(s);
  }

  /* ---------- clipboard & edit operations ---------- */
  var clipboard = null;

  function copySelection() {
    var ids = new Set(S().selected);
    var shapes = S().shapes.filter(function (s) { return ids.has(s.id); });
    var shapeIds = new Set(shapes.map(function (s) { return s.id; }));
    var edges = S().edges.filter(function (e) { return shapeIds.has(e.from) && shapeIds.has(e.to); });
    clipboard = { shapes: shapes, edges: edges };
    App.ui.toast('Copied ' + shapes.length + ' element' + (shapes.length === 1 ? '' : 's'));
  }

  function pasteClipboard() {
    if (!clipboard || !clipboard.shapes.length) return;
    var map = {};
    var offset = 24;
    var newShapes = clipboard.shapes.map(function (s) {
      var copy = JSON.parse(JSON.stringify(s));
      map[s.id] = App.state.newId('s');
      copy.id = map[s.id];
      copy.x += offset; copy.y += offset;
      copy.z = Date.now() + Math.random();
      return copy;
    });
    var newEdges = clipboard.edges.map(function (e) {
      var copy = JSON.parse(JSON.stringify(e));
      copy.id = App.state.newId('e');
      copy.from = map[e.from];
      copy.to = map[e.to];
      copy.z = Date.now() + Math.random();
      return copy;
    });
    App.state.pushHistory();
    S().shapes = S().shapes.concat(newShapes);
    S().edges = S().edges.concat(newEdges);
    S().selected.clear();
    newShapes.forEach(function (s) { S().selected.add(s.id); });
    App.render.render();
    App.ui.updateUI();
  }

  function cutSelection() {
    copySelection();
    deleteSelection();
  }

  function duplicateSelection() {
    copySelection();
    pasteClipboard();
  }

  function deleteSelection() {
    if (!S().selected.size && !S().selectedEdge) return;
    App.state.pushHistory();
    var ids = new Set(S().selected);
    S().shapes = S().shapes.filter(function (s) { return !ids.has(s.id); });
    S().edges = S().edges.filter(function (e) {
      return !ids.has(e.from) && !ids.has(e.to) && e.id !== S().selectedEdge;
    });
    S().selected.clear();
    S().selectedEdge = null;
    App.render.render();
    App.ui.updateUI();
  }

  function selectAll() {
    S().selected.clear();
    S().shapes.forEach(function (s) { S().selected.add(s.id); });
    App.render.drawSelection();
    App.ui.updateUI();
  }

  function deselect() {
    S().selected.clear();
    S().selectedEdge = null;
    App.render.drawSelection();
    App.ui.updateUI();
  }

  function nudge(dx, dy) {
    if (!S().selected.size) return;
    App.state.pushHistory();
    S().shapes.forEach(function (s) {
      if (S().selected.has(s.id)) {
        s.x += dx; s.y += dy;
      }
    });
    S().shapes.forEach(function (s) {
      if (S().selected.has(s.id)) App.render.refreshShape(s);
    });
    App.autosave();
  }

  /* ---------- alignment ---------- */
  function align(kind) {
    var sel = S().shapes.filter(function (s) { return S().selected.has(s.id); });
    if (sel.length < 2) return;
    App.state.pushHistory();
    var minX = Math.min.apply(null, sel.map(function (s) { return s.x; }));
    var maxX = Math.max.apply(null, sel.map(function (s) { return s.x + s.w; }));
    var minY = Math.min.apply(null, sel.map(function (s) { return s.y; }));
    var maxY = Math.max.apply(null, sel.map(function (s) { return s.y + s.h; }));
    var midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
    sel.forEach(function (s) {
      if (kind === 'left') s.x = minX;
      if (kind === 'right') s.x = maxX - s.w;
      if (kind === 'centerH') s.x = midX - s.w / 2;
      if (kind === 'top') s.y = minY;
      if (kind === 'bottom') s.y = maxY - s.h;
      if (kind === 'centerV') s.y = midY - s.h / 2;
    });
    sel.forEach(function (s) { App.render.refreshShape(s); });
    App.autosave();
  }

  function distribute(kind) {
    var sel = S().shapes.filter(function (s) { return S().selected.has(s.id); });
    if (sel.length < 3) return;
    sel.sort(function (a, b) { return kind === 'horizontal' ? a.x - b.x : a.y - b.y; });
    App.state.pushHistory();
    if (kind === 'horizontal') {
      var totalW = sel.reduce(function (sum, s) { return sum + s.w; }, 0);
      var span = sel[sel.length - 1].x + sel[sel.length - 1].w - sel[0].x;
      var gap = (span - totalW) / (sel.length - 1);
      var x = sel[0].x;
      sel.forEach(function (s, i) {
        if (i > 0) { s.x = x + gap; }
        x = s.x + s.w;
      });
    } else {
      var totalH = sel.reduce(function (sum, s) { return sum + s.h; }, 0);
      var spanV = sel[sel.length - 1].y + sel[sel.length - 1].h - sel[0].y;
      var gapV = (spanV - totalH) / (sel.length - 1);
      var y = sel[0].y;
      sel.forEach(function (s, i) {
        if (i > 0) { s.y = y + gapV; }
        y = s.y + s.h;
      });
    }
    sel.forEach(function (s) { App.render.refreshShape(s); });
    App.autosave();
  }

  function zOrder(dir) {
    if (S().selected.size !== 1) return;
    var id = S().selected.values().next().value;
    var list = S().shapes.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); });
    var idx = list.findIndex(function (s) { return s.id === id; });
    if (idx < 0) return;
    App.state.pushHistory();
    if (dir === 'front' && idx < list.length - 1) {
      var tmp = list[idx].z; list[idx].z = list[idx + 1].z; list[idx + 1].z = tmp;
    } else if (dir === 'back' && idx > 0) {
      var tmp2 = list[idx].z; list[idx].z = list[idx - 1].z; list[idx - 1].z = tmp2;
    }
    App.render.render();
  }

  function setTool(tool) {
    S().tool = tool;
    document.querySelectorAll('.tool-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tool === tool);
    });
    App.elements.canvas.style.cursor = tool === 'pan' ? 'grab' : (tool === 'connect' ? 'crosshair' : 'default');
    App.ui.updateUI();
  }

  /* ---------- keyboard ---------- */
  function onKeyDown(e) {
    var ta = document.getElementById('editorText');
    if (editing) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      return;
    }
    var meta = e.ctrlKey || e.metaKey;
    if (meta) {
      var k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); if (e.shiftKey) App.state.redo(); else App.state.undo(); afterUndoRedo(); return; }
      if (k === 'y') { e.preventDefault(); App.state.redo(); afterUndoRedo(); return; }
      if (k === 'a') { e.preventDefault(); selectAll(); return; }
      if (k === 'c') { e.preventDefault(); copySelection(); return; }
      if (k === 'v') { e.preventDefault(); pasteClipboard(); return; }
      if (k === 'x') { e.preventDefault(); cutSelection(); return; }
      if (k === 'd') { e.preventDefault(); duplicateSelection(); return; }
      if (k === 's') { e.preventDefault(); App.ui.exportJson(); return; }
      if (k === 'e') { e.preventDefault(); App.ui.exportPng(); return; }
      if (k === '=' || k === '+') { e.preventDefault(); zoomIn(); return; }
      if (k === '-') { e.preventDefault(); zoomOut(); return; }
      if (k === '0') { e.preventDefault(); zoomReset(); return; }
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      var active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      deleteSelection();
      return;
    }
    if (e.key === 'Escape') { deselect(); return; }
    if (e.key === ' ') { if (!S().spaceDown) { S().spaceDown = true; } e.preventDefault(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-(e.shiftKey ? 10 : S().gridSize / 2), 0); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); nudge(e.shiftKey ? 10 : S().gridSize / 2, 0); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); nudge(0, -(e.shiftKey ? 10 : S().gridSize / 2)); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); nudge(0, e.shiftKey ? 10 : S().gridSize / 2); return; }
    var toolKey = e.key.toLowerCase();
    if (toolKey === 'v' && !meta) setTool('select');
    if (toolKey === 't' && !meta) setTool('text');
    if (toolKey === 'c' && !meta) setTool('connect');
  }

  function onKeyUp(e) {
    if (e.key === ' ') S().spaceDown = false;
  }

  function afterUndoRedo() {
    App.render.render();
    App.ui.updateUI();
  }

  /* ---------- palette drag & drop ---------- */
  function setupPaletteDnD() {
    var canvas = App.elements.canvas;
    canvas.addEventListener('dragover', function (e) { e.preventDefault(); });
    canvas.addEventListener('drop', function (e) {
      e.preventDefault();
      var kind = e.dataTransfer.getData('text/plain');
      if (!kind) return;
      var rect = canvas.getBoundingClientRect();
      var p = svgPoint(e.clientX, e.clientY);
      addShapeAt(kind, p.x, p.y);
    });
  }

  function addShapeAt(kind, x, y) {
    var s = App.shapes.create(kind, x, y);
    s.z = Date.now() + Math.random();
    App.state.pushHistory();
    S().shapes.push(s);
    S().selected.clear();
    S().selected.add(s.id);
    S().selectedEdge = null;
    App.render.render();
    App.ui.updateUI();
    return s;
  }

  function init() {
    var canvas = App.elements.canvas;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.getElementById('editorText').addEventListener('input', onEditorInput);
    setupPaletteDnD();
  }

  return {
    init: init,
    setTool: setTool,
    zoomIn: zoomIn,
    zoomOut: zoomOut,
    zoomFit: zoomFit,
    zoomReset: zoomReset,
    align: align,
    distribute: distribute,
    zOrder: zOrder,
    addShapeAt: addShapeAt,
    deleteSelection: deleteSelection,
    selectAll: selectAll,
    duplicateSelection: duplicateSelection,
    commitEdit: commitEdit,
    cancelEdit: cancelEdit
  };
})();
