window.App = window.App || {};

App.templates = (function () {
  function box(kind, label, x, y, opts) {
    opts = opts || {};
    var s = App.shapes.create(kind, x, y, opts);
    s.label = label;
    return s;
  }

  function line(a, b, opts) {
    opts = opts || {};
    return {
      id: App.state.newId('e'),
      from: a.id, to: b.id,
      fromPort: opts.fromPort || 'S',
      toPort: opts.toPort || 'N',
      label: opts.label || '',
      color: opts.color || '#475569',
      width: opts.width || 1.8,
      dashed: !!opts.dashed,
      arrow: opts.arrow || 'arrow',
      z: Date.now() + Math.random()
    };
  }

  function blank() {
    return { shapes: [], edges: [], title: 'Untitled Diagram' };
  }

  function flowchart() {
    var shapes = [], edges = [];
    var start = box('terminator', 'Start', 0, 0);
    var login = box('rect', 'User Login', 0, 110);
    var decision = box('diamond', 'Valid?', -5, 230);
    var dash = box('rect', 'Dashboard', 300, 220);
    var error = box('rounded', 'Show Error', 40, 390);
    var end = box('terminator', 'End', 300, 390);
    shapes = shapes.concat([start, login, decision, dash, error, end]);
    edges.push(line(start, login));
    edges.push(line(login, decision));
    edges.push(line(decision, dash, { fromPort: 'E', toPort: 'W', label: 'Yes' }));
    edges.push(line(decision, error, { fromPort: 'S', toPort: 'N', label: 'No' }));
    edges.push(line(error, login, { fromPort: 'W', toPort: 'W', label: 'Retry' }));
    edges.push(line(dash, end));
    return { shapes: shapes, edges: edges, title: 'Flowchart' };
  }

  function architecture() {
    var shapes = [], edges = [];
    var users = box('cloud', 'Internet Users', 300, 0);
    var lb = box('rounded', 'Load Balancer', 330, 150);
    var app1 = box('server', 'App Server 1', 200, 300);
    var app2 = box('server', 'App Server 2', 360, 300);
    var db = box('cylinder', 'PostgreSQL', 440, 460);
    var cache = box('cylinder', 'Redis Cache', 190, 460);
    shapes = shapes.concat([users, lb, app1, app2, db, cache]);
    edges.push(line(users, lb, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(lb, app1, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(lb, app2, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(app1, db, { fromPort: 'E', toPort: 'W' }));
    edges.push(line(app2, db, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(app1, cache, { fromPort: 'W', toPort: 'E' }));
    edges.push(line(app2, cache, { fromPort: 'W', toPort: 'E' }));
    return { shapes: shapes, edges: edges, title: 'Architecture' };
  }

  function network() {
    var shapes = [], edges = [];
    var internet = box('cloud', 'Internet', 20, 0);
    var router = box('router', 'Router', 20, 160);
    var fw = box('firewall', 'Firewall', 220, 160);
    var sw = box('switch', 'Switch', 420, 160);
    var server = box('server', 'Web Server', 360, 320);
    var laptop = box('laptop', 'Workstation', 460, 320);
    var printer = box('desktop', 'Printer', 580, 320);
    shapes = shapes.concat([internet, router, fw, sw, server, laptop, printer]);
    edges.push(line(internet, router, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(router, fw, { fromPort: 'E', toPort: 'W' }));
    edges.push(line(fw, sw, { fromPort: 'E', toPort: 'W' }));
    edges.push(line(sw, server, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(sw, laptop, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(sw, printer, { fromPort: 'S', toPort: 'N' }));
    return { shapes: shapes, edges: edges, title: 'Network Topology' };
  }

  function erd() {
    var shapes = [], edges = [];
    var users = box('table', 'users', 0, 0);
    users.columns = [
      { name: 'id', type: 'integer', key: true },
      { name: 'name', type: 'varchar' },
      { name: 'email', type: 'varchar' },
      { name: 'created_at', type: 'timestamp' }
    ];
    var orders = box('table', 'orders', 300, 120);
    orders.columns = [
      { name: 'id', type: 'integer', key: true },
      { name: 'user_id', type: 'integer' },
      { name: 'product_id', type: 'integer' },
      { name: 'amount', type: 'decimal' }
    ];
    var products = box('table', 'products', 600, 0);
    products.columns = [
      { name: 'id', type: 'integer', key: true },
      { name: 'name', type: 'varchar' },
      { name: 'price', type: 'decimal' }
    ];
    App.shapes.computeTableSize(users);
    App.shapes.computeTableSize(orders);
    App.shapes.computeTableSize(products);
    shapes = shapes.concat([users, orders, products]);
    edges.push(line(users, orders, { fromPort: 'E', toPort: 'W', label: '1..*' }));
    edges.push(line(products, orders, { fromPort: 'W', toPort: 'E', label: '1..*' }));
    return { shapes: shapes, edges: edges, title: 'Database Schema' };
  }

  function sequence() {
    var shapes = [], edges = [];
    var client = box('actor', 'Client', 20, 0);
    var server = box('actor', 'Server', 320, 0);
    var db = box('actor', 'Database', 620, 0);
    var l1 = box('lifeline', '', 78, 120);
    l1.w = 2; l1.h = 430;
    var l2 = box('lifeline', '', 378, 120);
    l2.w = 2; l2.h = 430;
    var l3 = box('lifeline', '', 678, 120);
    l3.w = 2; l3.h = 430;
    var m1 = box('seqmessage', 'GET /api/users', 80, 160);
    m1.w = 300;
    var m2 = box('seqmessage', 'SELECT * FROM users', 380, 220);
    m2.w = 300;
    var m3 = box('seqmessage', 'rows', 380, 280);
    m3.w = 300; m3.dir = 'left'; m3.dashed = true;
    var m4 = box('seqmessage', '200 OK', 80, 340);
    m4.w = 300; m4.dir = 'left'; m4.dashed = true;
    shapes = shapes.concat([client, server, db, l1, l2, l3, m1, m2, m3, m4]);
    return { shapes: shapes, edges: edges, title: 'Sequence Diagram' };
  }

  function mindmap() {
    var shapes = [], edges = [];
    var center = box('rounded', 'Project', 260, 200);
    var a1 = box('rounded', 'Research', 0, 120);
    var a2 = box('rounded', 'Wireframes', 0, 260);
    var b1 = box('rounded', 'Design', 540, 60);
    var b2 = box('rounded', 'Development', 540, 220);
    var b3 = box('rounded', 'Testing', 540, 380);
    shapes = shapes.concat([center, a1, a2, b1, b2, b3]);
    edges.push(line(center, a1, { fromPort: 'W', toPort: 'E' }));
    edges.push(line(center, a2, { fromPort: 'W', toPort: 'E' }));
    edges.push(line(center, b1, { fromPort: 'E', toPort: 'W' }));
    edges.push(line(center, b2, { fromPort: 'E', toPort: 'W' }));
    edges.push(line(center, b3, { fromPort: 'E', toPort: 'W' }));
    return { shapes: shapes, edges: edges, title: 'Mind Map' };
  }

  function cicd() {
    var shapes = [], edges = [];
    var code = box('rect', 'Commit Code', 0, 0);
    var build = box('rect', 'Build', 0, 140);
    var test = box('diamond', 'Tests Pass?', -5, 270);
    var deploy = box('rounded', 'Deploy to Production', 240, 420);
    var notify = box('rounded', 'Notify Team', 240, 270);
    var fail = box('rounded', 'Stop Pipeline', 240, 550);
    shapes = shapes.concat([code, build, test, deploy, notify, fail]);
    edges.push(line(code, build));
    edges.push(line(build, test));
    edges.push(line(test, deploy, { fromPort: 'E', toPort: 'W', label: 'Yes' }));
    edges.push(line(test, notify, { fromPort: 'S', toPort: 'W', label: 'No' }));
    edges.push(line(notify, fail, { fromPort: 'S', toPort: 'N' }));
    return { shapes: shapes, edges: edges, title: 'CI/CD Pipeline' };
  }

  function serverless() {
    var shapes = [], edges = [];
    var http = box('cloud', 'HTTP API', 20, 0);
    var gw = box('rounded', 'API Gateway', 20, 150);
    var lambda = box('rect', 'Lambda Function', 280, 150);
    var db = box('cylinder', 'DynamoDB', 280, 320);
    var s3 = box('cylinder', 'S3 Bucket', 560, 150);
    shapes = shapes.concat([http, gw, lambda, db, s3]);
    edges.push(line(http, gw, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(gw, lambda, { fromPort: 'E', toPort: 'W' }));
    edges.push(line(lambda, db, { fromPort: 'S', toPort: 'N' }));
    edges.push(line(lambda, s3, { fromPort: 'E', toPort: 'W' }));
    return { shapes: shapes, edges: edges, title: 'Serverless Architecture' };
  }

  var LIST = [
    { id: 'blank', name: 'Blank Canvas', desc: 'Start from scratch', build: blank },
    { id: 'flowchart', name: 'Flowchart', desc: 'Process flows with decisions', build: flowchart },
    { id: 'architecture', name: 'Architecture', desc: 'Servers, load balancers, databases', build: architecture },
    { id: 'network', name: 'Network Topology', desc: 'Routers, switches, firewalls', build: network },
    { id: 'erd', name: 'Database Schema', desc: 'Tables with primary keys and relations', build: erd },
    { id: 'sequence', name: 'Sequence Diagram', desc: 'Actors, lifelines and messages', build: sequence },
    { id: 'mindmap', name: 'Mind Map', desc: 'Ideas around a central topic', build: mindmap },
    { id: 'cicd', name: 'CI/CD Pipeline', desc: 'Build, test and deploy stages', build: cicd },
    { id: 'serverless', name: 'Serverless Architecture', desc: 'API gateway, Lambda, DynamoDB', build: serverless }
  ];

  function load(id) {
    var tpl = LIST.find(function (t) { return t.id === id; });
    if (!tpl) return;
    var data = tpl.build();
    App.state.loadData({ shapes: data.shapes, edges: data.edges }, data.title);
    App.interaction.zoomFit();
    App.ui.toast('Template loaded: ' + tpl.name);
  }

  function thumbDataURL(tpl, w, h) {
    w = w || 220; h = h || 140;
    try {
      var data = tpl.build();
      var host = document.createElement('div');
      host.style.position = 'fixed';
      host.style.left = '-100000px';
      host.style.top = '0';
      host.style.visibility = 'hidden';
      document.body.appendChild(host);
      var b = { x: 0, y: 0, w: 1, h: 1 };
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      data.shapes.forEach(function (s) {
        minX = Math.min(minX, s.x); minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.w); maxY = Math.max(maxY, s.y + s.h);
      });
      if (data.shapes.length) { b = { x: minX - 16, y: minY - 16, w: maxX - minX + 32, h: maxY - minY + 32 }; }
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      var aspect = b.w / b.h;
      var scale = Math.min(w / b.w, h / b.h);
      svg.setAttribute('width', Math.round(b.w * scale));
      svg.setAttribute('height', Math.round(b.h * scale));
      svg.setAttribute('viewBox', b.x + ' ' + b.y + ' ' + b.w + ' ' + b.h);
      svg.setAttribute('font-family', 'sans-serif');
      data.edges.forEach(function (e) { svg.appendChild(App.edges.renderEdge(e)); });
      data.shapes.forEach(function (s) { svg.appendChild(App.shapes.shapeElement(s)); });
      host.appendChild(svg);
      var str = new XMLSerializer().serializeToString(svg);
      var blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(b.w * scale);
        canvas.height = Math.round(b.h * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        var card = document.querySelector('[data-tpl="' + tpl.id + '"] img');
        var placeholder = document.querySelector('[data-tpl="' + tpl.id + '"] .tpl-ph');
        if (card && canvas.toDataURL) card.src = canvas.toDataURL();
        else if (placeholder) placeholder.textContent = (data.title || '');
        document.body.removeChild(host);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        document.body.removeChild(host);
      };
      img.src = url;
    } catch (e) {}
  }

  return { LIST: LIST, load: load, thumbDataURL: thumbDataURL };
})();
