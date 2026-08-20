window.App = window.App || {};

App.shapes = (function () {
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  var DEFAULTS = {
    rect:        { w: 160, h: 80, fill: '#ffffff', stroke: '#1f2937', icon: false },
    rounded:     { w: 160, h: 80, fill: '#ffffff', stroke: '#1f2937', icon: false },
    terminator:  { w: 160, h: 60, fill: '#ffffff', stroke: '#1f2937', icon: false },
    trapezoid:   { w: 160, h: 80, fill: '#ffffff', stroke: '#1f2937', icon: false },
    parallelogram: { w: 170, h: 80, fill: '#ffffff', stroke: '#1f2937', icon: false },
    ellipse:     { w: 160, h: 100, fill: '#ffffff', stroke: '#1f2937', icon: false },
    diamond:     { w: 150, h: 105, fill: '#ffffff', stroke: '#1f2937', icon: false },
    document:    { w: 140, h: 100, fill: '#ffffff', stroke: '#1f2937', icon: false },
    cylinder:    { w: 120, h: 90, fill: '#ffffff', stroke: '#1f2937', icon: false },
    cloud:       { w: 180, h: 110, fill: '#ffffff', stroke: '#1f2937', icon: false },
    server:      { w: 150, h: 86, fill: '#ffffff', stroke: '#1f2937', icon: true },
    laptop:      { w: 150, h: 96, fill: '#ffffff', stroke: '#1f2937', icon: true },
    desktop:     { w: 150, h: 100, fill: '#ffffff', stroke: '#1f2937', icon: true },
    phone:       { w: 96, h: 150, fill: '#ffffff', stroke: '#1f2937', icon: true },
    router:      { w: 140, h: 86, fill: '#ffffff', stroke: '#1f2937', icon: true },
    switch:      { w: 140, h: 86, fill: '#ffffff', stroke: '#1f2937', icon: true },
    firewall:    { w: 140, h: 86, fill: '#ffffff', stroke: '#1f2937', icon: true },
    actor:       { w: 80, h: 120, fill: 'none', stroke: '#1f2937', icon: false },
    lifeline:    { w: 2, h: 240, fill: 'none', stroke: '#94a3b8', icon: false },
    seqmessage:  { w: 260, h: 36, fill: 'none', stroke: '#1f2937', icon: false },
    table:       { w: 200, h: 120, fill: '#4f46e5', stroke: '#1f2937', icon: false },
    text:        { w: 170, h: 40, fill: 'none', stroke: 'none', icon: false }
  };

  function create(kind, x, y, opts) {
    var d = DEFAULTS[kind] || DEFAULTS.rect;
    var s = {
      id: App.state.newId('s'),
      kind: kind,
      x: Math.round(x), y: Math.round(y),
      w: d.w, h: d.h,
      label: '',
      fill: d.fill,
      stroke: d.stroke,
      strokeWidth: 1.6,
      textColor: '#334155',
      fontSize: 14,
      fontWeight: '500',
      align: 'center',
      cornerRadius: 12,
      icon: d.icon,
      dashed: false,
      opacity: 1,
      z: Date.now() + Math.random()
    };
    if (kind === 'table') {
      s.columns = [{ name: 'id', type: 'integer', key: true }, { name: 'name', type: 'varchar' }, { name: 'created_at', type: 'timestamp' }];
      computeTableSize(s);
    }
    if (kind === 'text') { s.textColor = '#1f2937'; s.fontSize = 18; s.align = 'left'; }
    if (opts) for (var k in opts) if (opts[k] !== undefined) s[k] = opts[k];
    if (kind === 'table') computeTableSize(s);
    return s;
  }

  function computeTableSize(s) {
    var cols = s.columns || [];
    var maxW = (s.label || 'Table').length * 8.5 + 44;
    cols.forEach(function (c) {
      var len = c.name.length * 8.5 + c.type.length * 7.2 + 52;
      if (len > maxW) maxW = len;
    });
    s.w = Math.max(140, Math.ceil(maxW));
    s.h = 32 + cols.length * 23;
  }

  var PALETTE = [
    { title: 'Flowchart', items: [
      { kind: 'rect', name: 'Process' },
      { kind: 'diamond', name: 'Decision' },
      { kind: 'terminator', name: 'Start / End' },
      { kind: 'parallelogram', name: 'Input / Output' },
      { kind: 'document', name: 'Document' },
      { kind: 'trapezoid', name: 'Predefined Process' },
      { kind: 'rounded', name: 'Rounded Box' },
      { kind: 'text', name: 'Text label' }
    ]},
    { title: 'Architecture', items: [
      { kind: 'cloud', name: 'Cloud / Internet' },
      { kind: 'server', name: 'Server' },
      { kind: 'cylinder', name: 'Database' },
      { kind: 'desktop', name: 'Desktop' },
      { kind: 'laptop', name: 'Laptop' },
      { kind: 'phone', name: 'Mobile' },
      { kind: 'rect', name: 'Service Box' }
    ]},
    { title: 'Network', items: [
      { kind: 'router', name: 'Router' },
      { kind: 'switch', name: 'Switch' },
      { kind: 'firewall', name: 'Firewall' },
      { kind: 'server', name: 'Server' },
      { kind: 'laptop', name: 'Laptop' },
      { kind: 'cloud', name: 'Internet' }
    ]},
    { title: 'Database', items: [
      { kind: 'table', name: 'Table / Entity' },
      { kind: 'cylinder', name: 'Database' },
      { kind: 'text', name: 'Text label' }
    ]},
    { title: 'Sequence', items: [
      { kind: 'actor', name: 'Actor' },
      { kind: 'lifeline', name: 'Lifeline' },
      { kind: 'seqmessage', name: 'Message' },
      { kind: 'text', name: 'Text label' }
    ]},
    { title: 'Basic', items: [
      { kind: 'rect', name: 'Rectangle' },
      { kind: 'rounded', name: 'Rounded' },
      { kind: 'ellipse', name: 'Ellipse' },
      { kind: 'diamond', name: 'Diamond' },
      { kind: 'text', name: 'Text' }
    ]}
  ];

  function thumbSvg(kind, w, h) {
    w = w || 40; h = h || 30;
    var s = create(kind, 0, 0);
    s.x = 2; s.y = 2; s.w = w - 4; s.h = h - 4;
    s.fontSize = 9;
    if (kind === 'table') { s.columns = []; s.w = w - 4; s.h = h - 4; }
    if (kind === 'lifeline') { s.w = 2; s.h = h - 8; s.x = (w - 2) / 2; s.y = 4; }
    if (kind === 'seqmessage') { s.x = 4; s.w = w - 8; s.h = h - 8; s.y = 4; }
    var svg = el('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h });
    var g = shapeElement(s);
    g.setAttribute('data-kind', kind);
    svg.appendChild(g);
    return svg;
  }

  function rectPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, h / 2, w / 2));
    if (!r) return 'M' + x + ',' + y + ' H' + (x + w) + ' V' + (y + h) + ' H' + x + ' Z';
    return 'M' + (x + r) + ',' + y + ' H' + (x + w - r) + ' A' + r + ',' + r + ' 0 0 1 ' + (x + w) + ',' + (y + r) +
      ' V' + (y + h - r) + ' A' + r + ',' + r + ' 0 0 1 ' + (x + w - r) + ',' + (y + h) +
      ' H' + (x + r) + ' A' + r + ',' + r + ' 0 0 1 ' + x + ',' + (y + h - r) +
      ' V' + (y + r) + ' A' + r + ',' + r + ' 0 0 1 ' + (x + r) + ',' + y + ' Z';
  }

  var CLOUD_UNIT = 'M50,60 C26,60 4,50 4,36 C4,28 10,22 18,20 C22,8 34,2 46,2 C56,2 66,6 70,14 C84,12 96,18 96,30 C96,40 86,50 76,50 C71,50 67,52 63,55 C58,59 51,60 50,60 Z';
  var CLOUD_W = 100, CLOUD_H = 64;

  function scaledPath(unit, uw, uh, w, h, x, y) {
    var sx = w / uw, sy = h / uh;
    var p = el('path', { d: unit });
    p.setAttribute('transform', 'translate(' + x + ',' + y + ') scale(' + sx + ',' + sy + ')');
    return p;
  }

  function bodyPath(s) {
    var x = s.x, y = s.y, w = s.w, h = s.h;
    switch (s.kind) {
      case 'rect': return rectPath(x, y, w, h, 4);
      case 'rounded': return rectPath(x, y, w, h, Math.min(14, s.cornerRadius || 14));
      case 'terminator': return rectPath(x, y, w, h, h / 2);
      case 'trapezoid': return 'M' + (x + w * 0.18) + ',' + y + ' L' + (x + w * 0.82) + ',' + y + ' L' + (x + w) + ',' + (y + h) + ' L' + x + ',' + (y + h) + ' Z';
      case 'parallelogram': return 'M' + (x + w * 0.22) + ',' + y + ' L' + (x + w) + ',' + y + ' L' + (x + w * 0.78) + ',' + (y + h) + ' L' + x + ',' + (y + h) + ' Z';
      case 'diamond': return 'M' + (x + w / 2) + ',' + y + ' L' + (x + w) + ',' + (y + h / 2) + ' L' + (x + w / 2) + ',' + (y + h) + ' L' + x + ',' + (y + h / 2) + ' Z';
      case 'document': return 'M' + x + ',' + y + ' L' + (x + w - 14) + ',' + y + ' L' + (x + w) + ',' + (y + 14) + ' L' + (x + w) + ',' + (y + h) + ' L' + x + ',' + (y + h) + ' Z';
      default: return null;
    }
  }

  function bodyEl(s) {
    var g = el('g');
    var fill = s.fill || '#ffffff';
    var stroke = s.stroke === 'none' ? 'none' : s.stroke;
    var base = { fill: fill, stroke: stroke, 'stroke-width': s.strokeWidth };
    if (s.dashed) base['stroke-dasharray'] = '6 4';
    if (s.opacity !== undefined && s.opacity < 1) base['fill-opacity'] = s.opacity;

    switch (s.kind) {
      case 'ellipse': {
        var e = el('ellipse', { cx: s.x + s.w / 2, cy: s.y + s.h / 2, rx: s.w / 2, ry: s.h / 2 });
        setAttrs(e, base); g.appendChild(e);
        break;
      }
      case 'cylinder': {
        var rx = s.w / 2, ry = Math.min(12, s.h * 0.16);
        var top = el('ellipse', { cx: s.x + rx, cy: s.y + ry, rx: rx, ry: ry });
        setAttrs(top, base);
        g.appendChild(top);
        var body = el('path', { d: 'M' + s.x + ',' + (s.y + ry) + ' L' + s.x + ',' + (s.y + s.h - ry) +
          ' A' + rx + ',' + ry + ' 0 0 0 ' + (s.x + s.w) + ',' + (s.y + s.h - ry) +
          ' L' + (s.x + s.w) + ',' + (s.y + ry) + ' A' + rx + ',' + ry + ' 0 0 1 ' + s.x + ',' + (s.y + ry) + ' Z' });
        setAttrs(body, base);
        g.appendChild(body);
        var bottom = el('path', { d: 'M' + s.x + ',' + (s.y + ry) + ' A' + rx + ',' + ry + ' 0 0 0 ' + (s.x + s.w) + ',' + (s.y + ry) });
        setAttrs(bottom, { fill: 'none', stroke: stroke, 'stroke-width': s.strokeWidth });
        g.appendChild(bottom);
        break;
      }
      case 'cloud': {
        var c = scaledPath(CLOUD_UNIT, CLOUD_W, CLOUD_H, s.w, s.h, s.x, s.y);
        setAttrs(c, base); g.appendChild(c);
        break;
      }
      case 'server': {
        var r = rectPath(s.x, s.y, s.w, s.h, 6);
        var p = el('path', { d: r }); setAttrs(p, base); g.appendChild(p);
        if (s.h > 30) {
          var slotY = s.y + s.h * 0.62;
          var slot = el('path', { d: 'M' + (s.x + s.w * 0.2) + ',' + slotY + ' H' + (s.x + s.w * 0.8) });
          setAttrs(slot, { fill: 'none', stroke: stroke, 'stroke-width': Math.max(1, s.strokeWidth) });
          g.appendChild(slot);
        }
        break;
      }
      case 'laptop': case 'desktop': case 'phone': case 'router': case 'switch': case 'firewall': {
        var rr = rectPath(s.x, s.y, s.w, s.h, s.kind === 'phone' ? s.w * 0.18 : 8);
        var pp = el('path', { d: rr }); setAttrs(pp, base); g.appendChild(pp);
        break;
      }
      case 'actor': {
        var sx2 = s.w / 60, sy2 = (s.h - 18) / 70;
        var ag = el('g');
        ag.setAttribute('transform', 'translate(' + s.x + ',' + s.y + ') scale(' + sx2 + ',' + sy2 + ')');
        var head = el('circle', { cx: 30, cy: 12, r: 8 });
        setAttrs(head, { fill: '#fff', stroke: stroke, 'stroke-width': 1.6 });
        var body = el('path', { d: 'M30,22 V44 M10,30 H50 M30,44 L14,58 M30,44 L46,58' });
        setAttrs(body, { fill: 'none', stroke: stroke, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
        ag.appendChild(head); ag.appendChild(body);
        g.appendChild(ag);
        break;
      }
      case 'lifeline': {
        var cx = s.x + s.w / 2;
        var line = el('line', { x1: cx, y1: s.y, x2: cx, y2: s.y + s.h });
        setAttrs(line, { stroke: '#94a3b8', 'stroke-width': 1.4, 'stroke-dasharray': '5 4' });
        g.appendChild(line);
        var dot = el('circle', { cx: cx, cy: s.y, r: 3.5, fill: '#94a3b8' });
        g.appendChild(dot);
        break;
      }
      case 'seqmessage': {
        var my = s.y + s.h / 2;
        var line = el('line', { x1: s.x, y1: my, x2: s.x + s.w, y2: my });
        setAttrs(line, {
          stroke: stroke, 'stroke-width': s.strokeWidth,
          'stroke-dasharray': s.dashed ? '6 4' : null
        });
        var markerAttr = s.dir === 'left' ? 'marker-start' : 'marker-end';
        if (s.arrow !== 'none') line.setAttribute(markerAttr, 'url(#arr-arrow)');
        g.appendChild(line);
        var hit = el('rect', { x: s.x, y: s.y, width: s.w, height: s.h, fill: 'transparent', stroke: 'none' });
        g.appendChild(hit);
        break;
      }
      case 'table': {
        buildTable(s, g, base);
        break;
      }
      default: {
        var d = bodyPath(s);
        if (d) {
          var p2 = el('path', { d: d }); setAttrs(p2, base); g.appendChild(p2);
          if (s.kind === 'document') {
            var fold = el('path', { d: 'M' + (s.x + s.w - 14) + ',' + s.y + ' L' + (s.x + s.w - 14) + ',' + (s.y + 14) + ' L' + (s.x + s.w) + ',' + (s.y + 14) });
            setAttrs(fold, { fill: 'none', stroke: stroke, 'stroke-width': Math.max(1, s.strokeWidth) });
            g.appendChild(fold);
          }
        } else {
          var tr = el('path', { d: rectPath(s.x, s.y, s.w, s.h, 4) }); setAttrs(tr, base); g.appendChild(tr);
        }
      }
    }
    return g;
  }

  function buildTable(s, g, base) {
    var cols = s.columns || [];
    var hdrH = 32;
    var x = s.x, y = s.y, w = s.w;
    var hdr = el('rect', { x: x, y: y, width: w, height: hdrH, rx: 6 });
    setAttrs(hdr, { fill: s.fill, stroke: s.stroke, 'stroke-width': s.strokeWidth });
    g.appendChild(hdr);
    var title = el('text', { x: x + w / 2, y: y + hdrH / 2 + 5, 'text-anchor': 'middle', fill: '#ffffff', 'font-size': 13, 'font-weight': '700' });
    title.textContent = s.label || 'Table';
    g.appendChild(title);
    cols.forEach(function (c, i) {
      var ry = y + hdrH + i * 23;
      var row = el('rect', { x: x, y: ry, width: w, height: 23 });
      setAttrs(row, { fill: '#ffffff', stroke: '#cbd5e1', 'stroke-width': 1 });
      g.appendChild(row);
      var name = el('text', { x: x + 8, y: ry + 16, fill: s.textColor, 'font-size': 12, 'font-weight': c.key ? '700' : '400' });
      name.textContent = (c.key ? 'PK  ' : '') + c.name;
      g.appendChild(name);
      var type = el('text', { x: x + w - 8, y: ry + 16, 'text-anchor': 'end', fill: '#94a3b8', 'font-size': 11 });
      type.textContent = c.type || '';
      g.appendChild(type);
    });
  }

  function setAttrs(e, attrs) {
    for (var k in attrs) {
      if (attrs[k] === null || attrs[k] === undefined) continue;
      e.setAttribute(k, attrs[k]);
    }
  }

  function fitFont(s, text) {
    var size = s.fontSize;
    var maxW = s.w - 18;
    var factor = s.fontWeight === '700' || s.fontWeight === 'bold' ? 1.05 : 1;
    while (size > 7 && text.length * size * 0.62 * factor > maxW) size -= 1;
    return size;
  }

  function textEl(s, iconShift) {
    if (!s.label && s.kind !== 'text') return null;
    var lines = String(s.label || '').split('\n');
    var longest = 0;
    lines.forEach(function (l) { if (l.length > longest) longest = l.length; });
    var size = s.kind === 'text' ? s.fontSize : fitFont(s, longest);
    var lh = size * 1.25;
    var n = lines.length;
    var x;
    if (s.kind === 'text') x = s.align === 'left' ? s.x + 2 : s.x + s.w / 2;
    else if (s.align === 'left') x = s.x + 10;
    else x = s.x + s.w / 2;
    var top;
    if (s.kind === 'text') top = s.y + size;
    else if (iconShift && s.label) top = s.y + s.h * 0.56 + size * 0.35 - (n - 1) * lh / 2;
    else top = s.y + s.h / 2 + size * 0.35 - (n - 1) * lh / 2;
    var t = el('text', {
      x: x, 'text-anchor': s.align === 'left' ? 'start' : 'middle',
      fill: s.textColor, 'font-size': size, 'font-weight': s.fontWeight,
      'font-family': 'inherit', 'pointer-events': 'none'
    });
    lines.forEach(function (ln, i) {
      var ts = el('tspan', { x: x, y: top + i * lh });
      ts.textContent = ln || ' ';
      t.appendChild(ts);
    });
    return t;
  }

  var GLYPHS = {
    server: '<path d="M6,10 h28 M6,14 h28 M6,18 h28"/><rect x="6" y="6" width="28" height="16" rx="2"/>',
    database: '<path d="M10,4 h20 a10,6 0 0 1 0,12 h-20 a10,6 0 0 1 0,-12 z"/><path d="M10,10 a10,6 0 0 0 20,0"/>',
    cloud: '<path d="M12,22 a6,6 0 0 1 0,-12 a9,9 0 0 1 17,-4 a8,8 0 0 1 3,16 z"/>',
    laptop: '<path d="M6,20 h28 l-3,-10 a4,4 0 0 0 -4,-3 h-14 a4,4 0 0 0 -4,3 z"/>',
    desktop: '<rect x="4" y="6" width="32" height="20" rx="2"/><path d="M14,30 h12 M20,26 v4"/>',
    phone: '<rect x="10" y="4" width="20" height="32" rx="4"/><path d="M20,31 h0.01"/>',
    router: '<path d="M12,12 a8,8 0 0 1 16,0 M16,12 a4,4 0 0 1 8,0"/><rect x="4" y="20" width="32" height="6" rx="2"/>',
    switch: '<rect x="4" y="8" width="32" height="16" rx="3"/><path d="M12,16 l-4,-3 v6 z M28,16 l4,-3 v6 z"/>',
    firewall: '<rect x="4" y="8" width="32" height="16" rx="3"/><path d="M16,8 v16 M24,8 v16"/>'
  };

  function iconEl(s) {
    if (!s.icon) return null;
    var glyph = GLYPHS[s.kind === 'cylinder' ? 'database' : s.kind];
    if (!glyph && s.kind !== 'cloud') return null;
    var g = el('g');
    g.setAttribute('transform', 'translate(' + (s.x + s.w / 2 - 20) + ',' + (s.y + (s.label ? s.h * 0.26 : s.h / 2) - 12) + ') scale(' + (s.w / 260 > 1.2 ? 1.2 : s.w / 260) + ')');
    g.setAttribute('stroke', s.textColor);
    g.setAttribute('stroke-width', '1.6');
    g.setAttribute('fill', 'none');
    g.setAttribute('stroke-linecap', 'round');
    g.setAttribute('stroke-linejoin', 'round');
    g.setAttribute('pointer-events', 'none');
    var tmp = document.createElement('div');
    tmp.innerHTML = glyph;
    Array.prototype.slice.call(tmp.children).forEach(function (child) {
      var copy = document.importNode(child, true);
      g.appendChild(copy);
    });
    return g;
  }

  function shapeElement(s) {
    var g = el('g');
    g.setAttribute('data-id', s.id);
    g.setAttribute('class', 'shape');
    g.setAttribute('data-kind', s.kind);
    var body = bodyEl(s);
    if (body) g.appendChild(body);
    var icon = iconEl(s);
    if (icon) g.appendChild(icon);
    var hasIcon = !!(icon && s.label);
    if (s.kind !== 'lifeline') {
      var txt = textEl(s, hasIcon);
      if (txt) g.appendChild(txt);
    }
    if (s.kind === 'lifeline') {
      var lbl = el('text', { x: s.x + s.w / 2, y: s.y - 6, 'text-anchor': 'middle', fill: s.textColor, 'font-size': 11, 'pointer-events': 'none' });
      lbl.textContent = s.label || '';
      if (s.label) g.appendChild(lbl);
    }
    return g;
  }

  return {
    create: create,
    PALETTE: PALETTE,
    thumbSvg: thumbSvg,
    shapeElement: shapeElement,
    computeTableSize: computeTableSize,
    DEFAULTS: DEFAULTS
  };
})();
