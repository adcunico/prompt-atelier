// Floating control panel: sliders, selects, buttons, toggles.
export function createPanel(title) {
  const root = document.createElement('aside');
  root.className = 'panel';
  root.innerHTML = `<header class="panel-head">
    <a class="panel-back" href="./index.html" title="Back to gallery">&larr;</a>
    <h1>${title}</h1>
    <button class="panel-fold" title="Collapse">&minus;</button>
  </header>
  <div class="panel-body"></div>`;
  document.body.appendChild(root);
  const body = root.querySelector('.panel-body');
  root.querySelector('.panel-fold').addEventListener('click', (e) => {
    root.classList.toggle('folded');
    e.target.innerHTML = root.classList.contains('folded') ? '+' : '&minus;';
  });

  function row(labelText) {
    const div = document.createElement('div');
    div.className = 'panel-row';
    if (labelText) {
      const label = document.createElement('label');
      label.textContent = labelText;
      div.appendChild(label);
    }
    body.appendChild(div);
    return div;
  }

  return {
    root,
    slider(label, { min = 0, max = 1, step = 0.01, value = 0 }, onInput) {
      const r = row(label);
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', min, max, step, value });
      const out = document.createElement('span');
      out.className = 'panel-value';
      out.textContent = value;
      input.addEventListener('input', () => {
        out.textContent = input.value;
        onInput(parseFloat(input.value));
      });
      r.append(input, out);
      return input;
    },
    select(label, options, value, onChange) {
      const r = row(label);
      const sel = document.createElement('select');
      for (const opt of options) {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        if (opt === value) o.selected = true;
        sel.appendChild(o);
      }
      sel.addEventListener('change', () => onChange(sel.value));
      r.appendChild(sel);
      return sel;
    },
    toggle(label, value, onChange) {
      const r = row(label);
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = value;
      input.addEventListener('change', () => onChange(input.checked));
      r.appendChild(input);
      return input;
    },
    button(label, onClick, { primary = false } = {}) {
      const r = row();
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.className = primary ? 'primary' : '';
      btn.addEventListener('click', onClick);
      r.appendChild(btn);
      return btn;
    },
    buttons(defs) {
      const r = row();
      r.classList.add('panel-buttons');
      return defs.map(([label, onClick]) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        r.appendChild(btn);
        return btn;
      });
    },
    note(text) {
      const r = row();
      r.classList.add('panel-note');
      r.textContent = text;
      return r;
    },
  };
}
