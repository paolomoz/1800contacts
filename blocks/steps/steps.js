/*
 * Steps block — replica of the prototype `<section class="steps-sec">`:
 * a head (h2 + "easy peasy" doodle + blue lead line), a 3-column steps row,
 * and a centered orange CTA.
 *
 * Authored input:
 *   Row 1: <h2>How to order</h2>                         (steps head)
 *   Row 2: <p>Get your contacts today in 3 easy steps.</p> (the blue lead line)
 *   Rows 3–5: each cell = <p>Step N</p> + <h3>title</h3> + <p>description</p>
 *   Row 6: <p><strong><a href="/lenses">Get started</a></strong></p>
 *          (decorateButtons() rewrites this to a.button.primary before we run)
 *
 * The "easy peasy" doodle (/img/easy-peasy.svg) is a fixed decorative asset
 * injected here (it isn't authorable).
 *
 * Decoder is defensive: it flattens all authored nodes in document order and
 * builds steps from each <h3> (the <p> before it is the step number, the <p>
 * after it is the description). The lead is the remaining plain <p> that sits
 * before the first step and carries no anchor. Works for BOTH one-row-per-step
 * and DA-flattened single-cell shapes.
 */

export default async function decorate(block) {
  // Collect authored cells defensively; support the DA-flattened single cell.
  let cells = [...block.querySelectorAll(':scope > div > div')];
  if (cells.length <= 1) cells = [cells[0] || block];

  // Flatten meaningful child elements in document order.
  const nodes = [];
  cells.forEach((cell) => {
    [...cell.children].forEach((n) => { if (n.nodeType === 1) nodes.push(n); });
  });

  const head = nodes.find((n) => n.tagName === 'H2');

  // Build steps from each <h3>: previous <p> = number label, next <p> = desc.
  const used = new Set();
  const h3s = nodes.filter((n) => n.tagName === 'H3');
  const steps = h3s.map((h3) => {
    const i = nodes.indexOf(h3);
    const prev = nodes[i - 1];
    const next = nodes[i + 1];
    const label = prev && prev.tagName === 'P' ? prev : null;
    const desc = next && next.tagName === 'P' ? next : null;
    if (label) used.add(label);
    if (desc) used.add(desc);
    return { label, h3, desc };
  });

  // CTA anchor (the only anchor in the block).
  const ctaAnchor = block.querySelector('a');
  const ctaP = ctaAnchor ? ctaAnchor.closest('p') : null;
  if (ctaP) used.add(ctaP);

  // Lead = first plain <p> not used as a label/desc/CTA and carrying no anchor.
  const lead = nodes.find((n) => n.tagName === 'P' && !used.has(n)
    && !(n.querySelector && n.querySelector('a')));

  // ---- build structure ----
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const stepsHead = document.createElement('div');
  stepsHead.className = 'steps-head';
  if (head) stepsHead.append(head);

  const doodle = document.createElement('img');
  doodle.className = 'doodle';
  doodle.src = '/img/easy-peasy.svg';
  doodle.alt = 'Easy peasy';
  doodle.loading = 'lazy';
  stepsHead.append(doodle);

  if (lead) {
    const leadEl = document.createElement('div');
    leadEl.className = 'lead';
    while (lead.firstChild) leadEl.append(lead.firstChild);
    stepsHead.append(leadEl);
  }

  const stepsRow = document.createElement('div');
  stepsRow.className = 'steps-row';
  steps.forEach((s) => {
    const step = document.createElement('div');
    step.className = 'step';
    if (s.label) {
      const n = document.createElement('div');
      n.className = 'n';
      while (s.label.firstChild) n.append(s.label.firstChild);
      step.append(n);
    }
    if (s.h3) step.append(s.h3);
    if (s.desc) step.append(s.desc);
    stepsRow.append(step);
  });

  wrap.append(stepsHead, stepsRow);

  if (ctaAnchor) {
    if (!ctaAnchor.classList.contains('button')) ctaAnchor.classList.add('button', 'primary');
    const cta = document.createElement('div');
    cta.className = 'cta';
    cta.append(ctaAnchor);
    wrap.append(cta);
  }

  block.textContent = '';
  block.append(wrap);
}
