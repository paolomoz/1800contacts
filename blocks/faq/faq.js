/*
 * FAQ block — replica of the prototype .faq-sec.
 * Left column: white heading + desktop mascot (mobile shows a circle-X icon,
 * CSS-drawn). Right column: an accordion of Q/A pills. Answers ship collapsed
 * (display:none) and reveal with the .open class. Accordion behaviour is lifted
 * verbatim from the prototype <script>. No imports — the harness inlines block JS.
 */

/* Defensive cascade collector: flatten every element node across rows/cells in
   document order, supporting both the one-row-per-unit and the DA-flattened
   single-cell shapes. */
function collectNodes(block) {
  let rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length === 1) {
    const cells = [...rows[0].querySelectorAll(':scope > div')];
    if (cells.length <= 1) {
      rows = [cells[0] || rows[0]];
    }
  }
  const nodes = [];
  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const src = cells.length ? cells : [row];
    src.forEach((cell) => {
      const kids = [...cell.children].filter((n) => n.nodeType === 1);
      if (kids.length) nodes.push(...kids);
      else if (cell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = cell.textContent.trim();
        nodes.push(p);
      }
    });
  });
  return nodes;
}

export default async function decorate(block) {
  const nodes = collectNodes(block);

  const head = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const paras = nodes.filter((n) => n.tagName === 'P');

  // Pair sequential paragraphs into question / answer units.
  const items = [];
  for (let i = 0; i < paras.length; i += 2) {
    items.push({ q: paras[i], a: paras[i + 1] || null });
  }

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Left column.
  const left = document.createElement('div');
  left.className = 'faq-left';
  if (head) {
    const h2 = document.createElement('h2');
    h2.innerHTML = head.innerHTML;
    left.append(h2);
  }
  const x = document.createElement('div');
  x.className = 'faq-x';
  x.setAttribute('aria-hidden', 'true');
  left.append(x);
  const mascot = document.createElement('img');
  mascot.className = 'mascot';
  mascot.src = '/img/faq-mascot.png';
  mascot.alt = '1-800 Contacts mascot holding boxes of contacts';
  mascot.loading = 'lazy';
  left.append(mascot);

  // Accordion list.
  const list = document.createElement('div');
  list.className = 'faq-list';

  items.forEach(({ q, a }) => {
    if (!q) return;
    const item = document.createElement('div');
    item.className = 'faq-item';

    const question = document.createElement('span');
    question.textContent = q.textContent;
    item.append(question);

    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.setAttribute('aria-hidden', 'true');
    chev.textContent = '⌄';
    item.append(chev);

    if (a) {
      const ans = document.createElement('div');
      ans.className = 'faq-ans';
      ans.innerHTML = a.innerHTML;
      item.append(ans);
    }

    list.append(item);
  });

  wrap.append(left, list);
  block.textContent = '';
  block.append(wrap);

  /* Accordion behaviour — lifted from the prototype: role=button, keyboard
     support, click inside an open answer does not collapse it. */
  Array.prototype.forEach.call(list.querySelectorAll('.faq-item'), (item) => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-expanded', 'false');
    function toggle() {
      const open = item.classList.toggle('open');
      item.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    item.addEventListener('click', (e) => {
      if (e.target.closest('.faq-ans')) return;
      toggle();
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}
