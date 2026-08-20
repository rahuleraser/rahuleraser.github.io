window.App = window.App || {};

App.state = (function () {
  var st = {
    shapes: [],
    edges: [],
    selected: new Set(),
    selectedEdge: null,
    view: { x: 0, y: 0, scale: 1 },
    gridSize: 16,
    showGrid: true,
    snap: true,
    tool: 'select',
    spaceDown: false,
    history: [],
    future: [],
    maxHistory: 120,
    nextId: 1,
    title: 'Untitled Diagram',
    editing: false,
    dragging: false,
    connecting: null,
    hovered: null,
    autosaveKey: 'diagramstudio.autosave.v1'
  };

  function snapshot() {
    return JSON.stringify({ shapes: st.shapes, edges: st.edges });
  }

  function pushHistory() {
    st.history.push(snapshot());
    if (st.history.length > st.maxHistory) st.history.shift();
    st.future = [];
  }

  function restore(json) {
    try {
      var data = JSON.parse(json);
      st.shapes = data.shapes || [];
      st.edges = data.edges || [];
      st.history = [];
      st.future = [];
      st.selected.clear();
      st.selectedEdge = null;
      st.nextId = 1;
      st.shapes.forEach(function (s) { st.nextId = Math.max(st.nextId, numId(s.id) + 1); });
      st.edges.forEach(function (e) { st.nextId = Math.max(st.nextId, numId(e.id) + 1); });
      return true;
    } catch (err) { return false; }
  }

  function numId(id) {
    var n = parseInt(String(id).split('_').pop(), 10);
    return isNaN(n) ? 0 : n;
  }

  function undo() {
    if (!st.history.length) return false;
    st.future.push(snapshot());
    if (!restore(st.history.pop())) return false;
    return true;
  }

  function redo() {
    if (!st.future.length) return false;
    st.history.push(snapshot());
    if (!restore(st.future.pop())) return false;
    return true;
  }

  function newId(prefix) {
    prefix = prefix || 's';
    return prefix + '_' + st.nextId++;
  }

  function serialize() {
    return JSON.stringify({
      app: 'diagramstudio',
      version: 1,
      title: st.title,
      shapes: st.shapes,
      edges: st.edges
    }, null, 2);
  }

  function loadData(data, title) {
    st.shapes = data.shapes || [];
    st.edges = data.edges || [];
    st.history = [];
    st.future = [];
    st.selected.clear();
    st.selectedEdge = null;
    st.nextId = 1;
    st.shapes.forEach(function (s) { st.nextId = Math.max(st.nextId, numId(s.id) + 1); });
    st.edges.forEach(function (e) { st.nextId = Math.max(st.nextId, numId(e.id) + 1); });
    if (title !== undefined) st.title = title;
    App.render.render();
    App.ui.updateAll();
  }

  function bounds() {
    var shapes = st.shapes;
    if (!shapes.length) return { x: 0, y: 0, w: 900, h: 600 };
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach(function (s) {
      minX = Math.min(minX, s.x); minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.w); maxY = Math.max(maxY, s.y + s.h);
    });
    var pad = 60;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function saveLocal() {
    try {
      localStorage.setItem(st.autosaveKey, JSON.stringify({ title: st.title, shapes: st.shapes, edges: st.edges }));
    } catch (e) {}
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(st.autosaveKey);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || !Array.isArray(d.shapes)) return null;
      return d;
    } catch (e) { return null; }
  }

  function clearLocal() {
    try { localStorage.removeItem(st.autosaveKey); } catch (e) {}
  }

  return {
    state: st,
    pushHistory: pushHistory,
    undo: undo,
    redo: redo,
    newId: newId,
    serialize: serialize,
    loadData: loadData,
    restore: restore,
    bounds: bounds,
    saveLocal: saveLocal,
    loadLocal: loadLocal,
    clearLocal: clearLocal
  };
})();
