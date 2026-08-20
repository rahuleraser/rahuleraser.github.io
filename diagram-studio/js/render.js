window.App = window.App || {};

App.render = (function () {
  var NS = 'http://www.w3.org/2000/svg';
  var defsEl = null;

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function buildDefs() {
    var defs = el('defs');
    var pattern = el('pattern', {
      id: 'dotgrid', width: App.state.state.gridSize, height: App.state.state.gridSize,
      patternUnits: 'userSpaceOnUse'
    });
    var dot = el('circle', { cx: 1, cy: 1, r: 1.1, fill: 'var(--dot, #d9dce2)' });
    pattern.appendChild(dot);
    defs.appendChild(pattern);

    var markers = {
      'arr-arrow': '<path d="M0,0 L10,5 L0,10 Z" fill="context-stroke"/>',
      'arr-open': '<path d="M1,1 L9,5 L1,9" fill="none" stroke="context-stroke" stroke-width="1.4"/>',
      'arr-diamond': '<path d="M2,6 L6,1 L10,6 L6,11 Z" fill="context-stroke"/>'
    };
    Object.keys(markers).forEach(function (id) {
      var m = el('marker', {
        id: id, viewBox: '0 0 12 12', refX: '10', refY: '6',
        markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse'
      });
      var tmp = document.createElement('div');
      tmp.innerHTML = markers[id];
      m.appendChild(document.importNode(tmp.firstChild, true));
      defs.appendChild(m);
    });
    return defs;
  }

  function init() {
    App.elements = App.elements || {};
    var canvas = document.getElementById('canvas');
    App.elements.canvas = canvas;
    App.elements.world = document.getElementById('world');
    App.elements.edgeLayer = document.getElementById('edgeLayer');
    App.elements.shapeLayer = document.getElementById('shapeLayer');
    App.elements.selLayer = document.getElementById('selLayer');
    App.elements.tempLayer = document.getElementById('tempLayer');
    App.elements.gridRect = document.getElementById('gridRect');
    App.elements.overlay = document.getElementById('overlay');
    defsEl = buildDefs();
    document.getElementById('defs').appendChild(defsEl);
    applyView();
  }

  function applyView() {
    var v = App.state.state.view;
    if (App.elements.world) App.elements.world.setAttribute('transform', 'translate(' + v.x + ' ' + v.y + ') scale(' + v.scale + ')');
    App.ui.updateZoomLabel();
  }

  function render() {
    if (!App.elements.shapeLayer) return;
    App.elements.edgeLayer.innerHTML = '';
    App.elements.shapeLayer.innerHTML = '';
    App.elements.tempLayer.innerHTML = '';
    var state = App.state.state;
    var edges = state.edges.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); });
    edges.forEach(function (e) { App.elements.edgeLayer.appendChild(App.edges.renderEdge(e)); });
    var shapes = state.shapes.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); });
    shapes.forEach(function (s) { App.elements.shapeLayer.appendChild(App.shapes.shapeElement(s)); });
    drawSelection();
    var grid = App.elements.gridRect;
    grid.style.display = state.showGrid ? 'block' : 'none';
    App.autosave();
  }

  function refreshShape(s) {
    var existing = App.elements.shapeLayer.querySelector('[data-id="' + s.id + '"]');
    var fresh = App.shapes.shapeElement(s);
    if (existing) existing.replaceWith(fresh);
    else App.elements.shapeLayer.appendChild(fresh);
    refreshEdgesFor(s.id);
  }

  function refreshEdge(e) {
    var existing = App.elements.edgeLayer.querySelector('[data-edge="' + e.id + '"]');
    var fresh = App.edges.renderEdge(e);
    if (existing) existing.replaceWith(fresh);
  }

  function refreshEdgesFor(shapeId) {
    App.state.state.edges.forEach(function (e) {
      if (e.from === shapeId || e.to === shapeId) refreshEdge(e);
    });
  }

  function drawSelection() {
    var layer = App.elements.selLayer;
    if (!layer) return;
    layer.innerHTML = '';
    var state = App.state.state;
    var shapesById = {};
    state.shapes.forEach(function (s) { shapesById[s.id] = s; });

    state.selected.forEach(function (id) {
      var s = shapesById[id];
      if (!s) return;
      var box = el('rect', { class: 'sel-box', x: s.x, y: s.y, width: s.w, height: s.h });
      layer.appendChild(box);
    });

    if (state.selected.size === 1) {
      var s = shapesById[state.selected.values().next().value];
      if (s) drawHandlesAndPorts(layer, s, true);
    } else if (state.selected.size === 0 && state.hovered) {
      var hs = shapesById[state.hovered];
      if (hs) drawHandlesAndPorts(layer, hs, false);
    }

    if (state.selectedEdge) {
      var eg = App.elements.edgeLayer.querySelector('[data-edge="' + state.selectedEdge + '"]');
      if (eg) eg.setAttribute('class', 'edge-selected');
    }
    if (state.hovered) {
      var hg = App.elements.shapeLayer.querySelector('[data-id="' + state.hovered + '"]');
      if (hg) hg.setAttribute('class', 'shape shape-hovered');
    }
    state.selected.forEach(function (id) {
      var sg = App.elements.shapeLayer.querySelector('[data-id="' + id + '"]');
      if (sg) sg.setAttribute('class', 'shape shape-selected');
    });
  }

  function drawHandlesAndPorts(layer, s, withHandles) {
    if (s.kind === 'lifeline' || s.kind === 'seqmessage') withHandles = false;
    var hs = 7;
    var off = hs / 2;
    var x = s.x, y = s.y, w = s.w, h = s.h;
    if (withHandles) {
      var positions = [
        ['nw', x - off, y - off], ['n', x + w / 2 - off, y - off], ['ne', x + w - off, y - off],
        ['e', x + w - off, y + h / 2 - off], ['se', x + w - off, y + h - off], ['s', x + w / 2 - off, y + h - off],
        ['sw', x - off, y + h - off], ['w', x - off, y + h / 2 - off]
      ];
      positions.forEach(function (pos) {
        var r = el('rect', { class: 'sel-handle', 'data-h': pos[0], 'data-id': s.id, x: pos[1], y: pos[2], width: hs, height: hs, rx: 2 });
        layer.appendChild(r);
      });
    }
    ['N', 'S', 'E', 'W'].forEach(function (pt) {
      var pp = App.edges.portPoint(s, pt);
      var c = el('circle', { class: 'port-dot', 'data-port': pt, 'data-id': s.id, cx: pp.x, cy: pp.y, r: 4.5 });
      layer.appendChild(c);
    });
  }

  function toWorld(clientX, clientY) {
    var rect = App.elements.canvas.getBoundingClientRect();
    var v = App.state.state.view;
    return {
      x: (clientX - rect.left - v.x) / v.scale,
      y: (clientY - rect.top - v.y) / v.scale
    };
  }

  return {
    init: init,
    applyView: applyView,
    render: render,
    refreshShape: refreshShape,
    refreshEdge: refreshEdge,
    refreshEdgesFor: refreshEdgesFor,
    drawSelection: drawSelection,
    toWorld: toWorld,
    buildDefs: buildDefs
  };
})();
