window.App = window.App || {};

App.icons = {
  select: '<path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51z"/><path d="M13.6 13.6L19 19"/>',
  text: '<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  pan: '<path d="M9 5l3-3 3 3"/><path d="M5 9l-3 3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/><path d="M12 2v20"/>',
  connect: '<path d="M18 13v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  paste: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6"/>',
  zoomFit: '<path d="M8 3H4a1 1 0 0 0-1 1v4"/><path d="M16 3h4a1 1 0 0 1 1 1v4"/><path d="M8 21H4a1 1 0 0 1-1-1v-4"/><path d="M16 21h4a1 1 0 0 0 1-1v-4"/><path d="M3 12h18"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  open: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  newfile: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 11v6"/><path d="M9 14h6"/>',
  template: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  snap: '<path d="M20 6L9 17l-5-5"/>',
  alignL: '<path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h13"/>',
  alignC: '<path d="M7 6h10"/><path d="M4 12h16"/><path d="M7 18h10"/>',
  alignR: '<path d="M4 6h16"/><path d="M10 12h10"/><path d="M7 18h13"/>',
  alignT: '<path d="M6 4h12"/><path d="M6 10h7"/><path d="M6 16h10"/>',
  alignM: '<path d="M6 6h12"/><path d="M9 12h6"/><path d="M6 18h12"/>',
  alignB: '<path d="M6 8h10"/><path d="M6 14h7"/><path d="M6 20h12"/>',
  distH: '<path d="M3 5h6M15 5h6M3 19h6M15 19h6"/><path d="M4 12h4M10 12h4M16 12h4"/>',
  distV: '<path d="M5 3v6M5 15v6M19 3v6M19 15v6"/><path d="M12 4v4M12 10v4M12 16v4"/>',
  front: '<path d="M3 3h9v9H3z"/><path d="M12 12h9v9h-9z"/>',
  back: '<path d="M3 12h9v9H3z"/><path d="M12 3h9v9h-9z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'
};

App.icons.stroke = function (name, size) {
  size = size || 16;
  var paths = this[name] || '';
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
    '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    paths + '</svg>';
};
