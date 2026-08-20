window.App = window.App || {};

App.edges = (function () {
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function portPoint(s, port) {
    var cx = s.x + s.w / 2, cy = s.y + s.h / 2;
    switch (port) {
      case 'N': return { x: cx, y: s.y };
      case 'S': return { x: cx, y: s.y + s.h };
      case 'E': return { x: s.x + s.w, y: cy };
      case 'W': return { x: s.x, y: cy };
    }
    return { x: cx, y: cy };
  }

  function nearestPort(s, p) {
    var ports = ['N', 'S', 'E', 'W'];
    var best = 'S', bestD = Infinity;
    ports.forEach(function (pt) {
      var pp = portPoint(s, pt);
      var d = Math.hypot(pp.x - p.x, pp.y - p.y);
      if (d < bestD) { bestD = d; best = pt; }
    });
    return best;
  }

  var DIR = { N: { dx: 0, dy: -1 }, S: { dx: 0, dy: 1 }, E: { dx: 1, dy: 0 }, W: { dx: -1, dy: 0 } };
  var REV = { N: 'S', S: 'N', E: 'W', W: 'E' };

  function routePoints(e, shapesById) {
    var fs = shapesById[e.from];
    var ts = shapesById[e.to];
    if (!fs || !ts) return null;
    var a = portPoint(fs, e.fromPort);
    var b = portPoint(ts, e.toPort);
    var sd = e.fromPort, td = e.toPort;
    var ext = 34;
    var pts = [{ x: a.x, y: a.y }];
    var p1 = { x: a.x + DIR[sd].dx * ext, y: a.y + DIR[sd].dy * ext };
    pts.push(p1);
    var rev = REV[td];
    var p2 = { x: b.x + DIR[rev].dx * ext, y: b.y + DIR[rev].dy * ext };
    var mid;
    if (sd === 'E' || sd === 'W') mid = { x: p2.x, y: p1.y };
    else mid = { x: p1.x, y: p2.y };
    pts.push(mid, p2, { x: b.x, y: b.y });
    return pts;
  }

  function smoothPath(pts, r) {
    if (!pts || pts.length < 2) return '';
    var clean = [pts[0]];
    for (var c = 1; c < pts.length; c++) {
      var last = clean[clean.length - 1];
      if (pts[c].x !== last.x || pts[c].y !== last.y) clean.push(pts[c]);
    }
    if (clean.length < 2) return '';
    pts = clean;
    var d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (var i = 1; i < pts.length - 1; i++) {
      var p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
      var dx1 = p1.x - p0.x, dy1 = p1.y - p0.y;
      var dx2 = p2.x - p1.x, dy2 = p2.y - p1.y;
      var l1 = Math.hypot(dx1, dy1), l2 = Math.hypot(dx2, dy2);
      var u1x = dx1 / l1, u1y = dy1 / l1;
      var u2x = dx2 / l2, u2y = dy2 / l2;
      var rr = Math.max(0, Math.min(r, l1 / 2 - 1, l2 / 2 - 1));
      var c1x = p1.x - u1x * rr, c1y = p1.y - u1y * rr;
      var c2x = p1.x + u2x * rr, c2y = p1.y + u2y * rr;
      d += ' L ' + c1x + ' ' + c1y + ' Q ' + p1.x + ' ' + p1.y + ' ' + c2x + ' ' + c2y;
    }
    d += ' L ' + pts[pts.length - 1].x + ' ' + pts[pts.length - 1].y;
    return d;
  }

  function labelPos(pts) {
    if (!pts || pts.length < 3) return null;
    var i = Math.floor((pts.length - 2) / 2) + 1;
    var a = pts[i - 1], b = pts[i];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function markerId(arrow) {
    return arrow === 'none' ? null : 'arr-' + arrow;
  }

  function renderEdge(e) {
    var byId = {};
    App.state.state.shapes.forEach(function (s) { byId[s.id] = s; });
    var pts = routePoints(e, byId);
    e._pts = pts;
    var g = el('g');
    g.setAttribute('data-edge', e.id);
    var d = smoothPath(pts, 10);
    var stroke = e.color || '#475569';
    var dash = e.dashed ? '7 5' : null;
    var marker = markerId(e.arrow);
    var hit = el('path', { class: 'edge-hit', d: d, 'data-edge': e.id, 'stroke-width': 14, fill: 'none' });
    var path = el('path', { class: 'edge-path', d: d, stroke: stroke, 'stroke-width': e.width || 1.8, fill: 'none' });
    if (dash) path.setAttribute('stroke-dasharray', dash);
    if (marker) path.setAttribute('marker-end', 'url(#' + marker + ')');
    g.appendChild(hit);
    g.appendChild(path);
    if (e.label) {
      var lp = labelPos(pts);
      if (lp) {
        var ltxt = el('text', { class: 'edge-label', x: lp.x, y: lp.y - 6, 'text-anchor': 'middle', fill: stroke, 'font-size': 12, 'font-weight': '500' });
        ltxt.textContent = e.label;
        g.appendChild(ltxt);
      }
    }
    return g;
  }

  function distToSegment(p, a, b) {
    var abx = b.x - a.x, aby = b.y - a.y;
    var apx = p.x - a.x, apy = p.y - a.y;
    var l2 = abx * abx + aby * aby;
    var t = l2 ? (apx * abx + apy * aby) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    var x = a.x + t * abx, y = a.y + t * aby;
    return Math.hypot(p.x - x, p.y - y);
  }

  function hitEdge(p) {
    var best = null, bestD = 8;
    App.state.state.edges.forEach(function (e) {
      var pts = e._pts;
      if (!pts) return;
      for (var i = 0; i < pts.length - 1; i++) {
        var d = distToSegment(p, pts[i], pts[i + 1]);
        if (d < bestD) { bestD = d; best = e; }
      }
    });
    return best;
  }

  return {
    portPoint: portPoint,
    nearestPort: nearestPort,
    routePoints: routePoints,
    smoothPath: smoothPath,
    renderEdge: renderEdge,
    hitEdge: hitEdge
  };
})();
