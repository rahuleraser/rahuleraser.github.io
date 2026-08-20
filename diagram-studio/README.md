# Diagram Studio

A free, fully client-side diagramming tool that works like Eraser.io. Create flowcharts, architecture diagrams, network topologies, database schemas, and sequence diagrams.

No account. No trial limits. No backend. Everything runs in your browser and your work is auto-saved locally.

## Features

- Drag-and-drop shape library (Flowchart, Architecture, Network, Database, Sequence, Basic)
- Orthogonal elbow connectors with arrows, dashed lines, labels
- Move, resize, align, distribute, bring to front/back, copy/paste, undo/redo
- Double-click any shape to edit text; double-click empty canvas to add text
- 9 ready-made templates
- Generate flowcharts and sequence diagrams from plain text
- Export to PNG, SVG, or JSON project file; open/import JSON
- Auto-save to browser localStorage
- Full keyboard shortcuts and zoom/pan controls

## Run locally

Just open `index.html` in any modern browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Host on GitHub Pages (free)

1. Create a new repository on GitHub named `username.github.io` (replace `username`).
2. Upload the contents of this folder to the repository.
3. Enable GitHub Pages: Settings -> Pages -> Deploy from branch `main`, root folder.
4. Your site is live at `https://username.github.io`.

You can also host it in the `gh-pages` branch of any existing repository.

## File structure

```
index.html          App shell
css/style.css       Styles
js/icons.js         SVG icon set
js/state.js         State, history (undo/redo), persistence
js/shapes.js        Shape definitions, palette, SVG rendering
js/edges.js         Connector routing and rendering
js/render.js        Canvas renderer and selection layer
js/interaction.js   Pointer events, keyboard, editing
js/export.js        PNG / SVG / JSON export and import
js/templates.js     Template gallery
js/textdiagram.js   Generate diagrams from text
js/main.js          UI wiring
favicon.svg         Site icon
```

## Shortcuts

| Shortcut | Action |
| --- | --- |
| `V` / `T` / `C` | Tools: select / text / connector |
| `Space` + drag | Pan canvas |
| `Scroll` / `Ctrl+scroll` | Pan / zoom |
| Double-click | Edit text / add text |
| `Delete` / `Backspace` | Delete selection |
| `Ctrl+C` / `V` / `X` / `D` | Copy / paste / cut / duplicate |
| `Ctrl+A` | Select all |
| Arrows | Nudge (Shift = 10 px) |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo |
| `Ctrl+S` / `Ctrl+E` | Save JSON / export PNG |
