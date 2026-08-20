window.App = window.App || {};

App.export = (function () {
  var NS = 'http://www.w3.org/2000/svg';

  function download(filename, dataUrlOrBlob) {
    var a = document.createElement('a');
    var url = typeof dataUrlOrBlob === 'string' ? dataUrlOrBlob : URL.createObjectURL(dataUrlOrBlob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof dataUrlOrBlob !== 'string') setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function safeTitle() {
    var t = App.state.state.title || 'diagram';
    return t.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'diagram';
  }

  function buildSvgString() {
    var b = App.state.bounds();
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('width', b.w);
    svg.setAttribute('height', b.h);
    svg.setAttribute('viewBox', b.x + ' ' + b.y + ' ' + b.w + ' ' + b.h);
    svg.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
    var defs = App.render.buildDefs();
    svg.appendChild(defs);
    var bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('x', b.x); bg.setAttribute('y', b.y);
    bg.setAttribute('width', b.w); bg.setAttribute('height', b.h);
    bg.setAttribute('fill', '#ffffff');
    svg.appendChild(bg);
    var edges = App.state.state.edges.slice().sort(function (a, c) { return (a.z || 0) - (c.z || 0); });
    edges.forEach(function (e) { svg.appendChild(App.edges.renderEdge(e)); });
    var shapes = App.state.state.shapes.slice().sort(function (a, c) { return (a.z || 0) - (c.z || 0); });
    shapes.forEach(function (s) { svg.appendChild(App.shapes.shapeElement(s)); });
    return new XMLSerializer().serializeToString(svg);
  }

  function exportSvg() {
    var str = buildSvgString();
    download(safeTitle() + '.svg', new Blob([str], { type: 'image/svg+xml' }));
    App.ui.toast('SVG exported');
  }

  function exportPng() {
    var str = buildSvgString();
    var blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var img = new Image();
    var b = App.state.bounds();
    img.onload = function () {
      var scale = 2;
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(b.w * scale));
      canvas.height = Math.max(1, Math.round(b.h * scale));
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (pngBlob) {
        if (pngBlob) download(safeTitle() + '.png', pngBlob);
      }, 'image/png');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      App.ui.toast('PNG export failed', true);
    };
    img.src = url;
  }

  function exportJson() {
    var str = App.state.serialize();
    download(safeTitle() + '.json', new Blob([str], { type: 'application/json' }));
    App.ui.toast('JSON project exported');
  }

  function openFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data || !Array.isArray(data.shapes) || !Array.isArray(data.edges)) {
          App.ui.toast('Invalid project file', true);
          return;
        }
        App.state.loadData({ shapes: data.shapes, edges: data.edges }, data.title);
        App.interaction.zoomFit();
        App.ui.toast('Project opened');
      } catch (err) {
        App.ui.toast('Could not read file', true);
      }
    };
    reader.readAsText(file);
  }

  var autosaveTimer = null;
  function autosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(function () {
      App.state.saveLocal();
      App.ui.setSaveState('saved');
    }, 450);
  }

  return {
    exportSvg: exportSvg,
    exportPng: exportPng,
    exportJson: exportJson,
    openFile: openFile,
    autosave: autosave
  };
})();
