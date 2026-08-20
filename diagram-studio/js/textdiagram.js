window.App = window.App || {};

App.textDiagram = (function () {
  function generateFlow(text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l && l[0] !== '#'; });
    var nodes = [];
    var edges = [];
    var nodeIndex = {};

    function getNode(name) {
      var key = name.toLowerCase();
      if (!(key in nodeIndex)) {
        var s = App.shapes.create(name.slice(-1) === '?' ? 'diamond' : 'rect', 0, 0);
        s.label = name;
        s.z = Date.now() + Math.random();
        nodeIndex[key] = nodes.length;
        nodes.push(s);
      }
      return nodes[nodeIndex[key]];
    }

    lines.forEach(function (line) {
      var parts = line.split('->').map(function (p) { return p.trim(); });
      if (parts.length < 2) return;
      var target = null;
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var edgeLabel = '';
        var name = part;
        var colon = part.indexOf(':');
        if (colon > 0) {
          name = part.slice(0, colon).trim();
          edgeLabel = part.slice(colon + 1).trim();
        }
        if (i < parts.length - 1) {
          var from = name;
          var next = parts[i + 1];
          var nextName = next;
          var nextLabel = '';
          var c2 = next.indexOf(':');
          if (c2 > 0) {
            nextName = next.slice(0, c2).trim();
            nextLabel = next.slice(c2 + 1).trim();
          }
          var a = getNode(from);
          var b = getNode(nextName);
          edges.push({ a: a, b: b, label: nextLabel });
        }
      }
    });

    if (!nodes.length) return null;

    var preds = {};
    nodes.forEach(function (n) { preds[n.id] = []; });
    edges.forEach(function (e) { preds[e.b.id].push(e.a); });
    var layer = {};
    var assignLayer = function (n) {
      if (layer[n.id] !== undefined) return layer[n.id];
      var p = preds[n.id].map(assignLayer);
      layer[n.id] = p.length ? Math.max.apply(null, p) + 1 : 1;
      return layer[n.id];
    };
    nodes.forEach(assignLayer);

    var maxLayer = 1;
    nodes.forEach(function (n) { maxLayer = Math.max(maxLayer, layer[n.id]); });

    var boxW = 170, gapX = 210, gapY = 130;
    var counts = {};
    nodes.forEach(function (n) { counts[layer[n.id]] = (counts[layer[n.id]] || 0) + 1; });
    var maxCount = 1;
    for (var k in counts) maxCount = Math.max(maxCount, counts[k]);
    var yOffset = ((maxCount - 1) * gapY) / 2;

    nodes.forEach(function (n) {
      var idx = counts[layer[n.id]] - 1;
      counts[layer[n.id]] = idx;
      var x = (layer[n.id] - 1) * gapX;
      var y = yOffset + idx * gapY;
      n.x = Math.round(x);
      n.y = Math.round(y);
      if (n.kind === 'diamond') { n.w = 180; n.h = 110; }
    });

    var outEdges = edges.map(function (e) {
      return {
        id: App.state.newId('e'),
        from: e.a.id, to: e.b.id,
        fromPort: 'E', toPort: 'W',
        label: e.label || '',
        color: '#475569', width: 1.8, dashed: false, arrow: 'arrow',
        z: Date.now() + Math.random()
      };
    });

    return { shapes: nodes, edges: outEdges, title: 'Flowchart from text' };
  }

  function generateSequence(text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l && l[0] !== '#'; });
    var actors = [];
    var actorIds = {};
    var messages = [];

    function getActor(name) {
      if (!(name in actorIds)) {
        actorIds[name] = actors.length;
        actors.push(name);
      }
      return actorIds[name];
    }

    lines.forEach(function (line) {
      var m = line.match(/^(.*?)\s*->\s*(.*?)\s*:\s*(.*)$/);
      if (!m) {
        var m2 = line.match(/^(.*?)\s*->\s*(.*)$/);
        if (m2) messages.push({ a: getActor(m2[1].trim()), b: getActor(m2[2].trim()), label: '' });
        return;
      }
      messages.push({ a: getActor(m[1].trim()), b: getActor(m[2].trim()), label: m[3].trim() });
    });

    if (!actors.length) return null;

    var actorW = 120, gap = 300, lifelineH = 460, msgStart = 160, msgGap = 64;
    var shapes = [];
    var midX = [];
    actors.forEach(function (name, i) {
      var x = i * gap + 40;
      var actor = App.shapes.create('actor', x, 0);
      actor.label = name;
      actor.z = Date.now() + Math.random();
      shapes.push(actor);
      var cx = x + actor.w / 2;
      midX.push(cx);
      var ll = App.shapes.create('lifeline', cx - 1, 120);
      ll.label = '';
      ll.h = lifelineH;
      ll.z = Date.now() + Math.random();
      shapes.push(ll);
    });

    messages.forEach(function (msg, i) {
      var left = Math.min(msg.a, msg.b);
      var right = Math.max(msg.a, msg.b);
      var y = msgStart + i * msgGap;
      var fromLeft = msg.a < msg.b;
      var x = midX[left];
      var w = midX[right] - midX[left];
      var sm = App.shapes.create('seqmessage', x, y);
      sm.w = w;
      sm.label = msg.label || 'message';
      sm.dir = fromLeft ? 'right' : 'left';
      sm.dashed = !fromLeft;
      sm.z = Date.now() + Math.random();
      shapes.push(sm);
    });

    return { shapes: shapes, edges: [], title: 'Sequence from text' };
  }

  function generate(text, kind) {
    var data = kind === 'seq' ? generateSequence(text) : generateFlow(text);
    if (!data) return false;
    App.state.loadData({ shapes: data.shapes, edges: data.edges }, data.title);
    App.interaction.zoomFit();
    return true;
  }

  return { generate: generate, generateFlow: generateFlow, generateSequence: generateSequence };
})();
