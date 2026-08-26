/*
 * Reviews block — replica of the prototype .rev-sec.
 * Section head + blue subhead, three review cards (stars built in JS), and a
 * navy secondary CTA. On mobile the .rev-view becomes a scroll-snap swipe
 * carousel with dots, driven by the lifted initCarousel pattern (perView 1
 * mobile / 3 desktop, next:null). No imports — the harness inlines block JS.
 */

/* Lifted verbatim from the prototype <script> (the initCarousel used for the
   reviews swipe): a native scroll-snap container whose dots are rebuilt per
   breakpoint from the page count and reflect the current page. */
function initCarousel(view, dotsEl, opts) {
  if (!view || !dotsEl) return;
  const track = view.querySelector(opts.rowSel);
  if (!track) return;
  const cards = Array.prototype.slice.call(track.children);
  if (!cards.length) return;
  let pages = 1;
  let pageW = 0;
  const mobile = () => window.matchMedia('(max-width:768px)').matches;
  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < pages; i += 1) {
      const d = document.createElement('i');
      ((idx) => { d.addEventListener('click', () => go(idx)); })(i);
      dotsEl.appendChild(d);
    }
  }
  function activeIdx() {
    return Math.max(0, Math.min(pages - 1, Math.round(view.scrollLeft / pageW)));
  }
  function go(i) { view.scrollTo({ left: i * pageW, behavior: 'smooth' }); }
  function update() {
    const a = activeIdx();
    Array.prototype.forEach.call(dotsEl.children, (d, i) => { d.classList.toggle('on', i === a); });
  }
  function measure() {
    const perView = mobile() ? 1 : opts.perView;
    const cw = cards[0].getBoundingClientRect().width;
    const cs = getComputedStyle(track);
    const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
    pageW = perView === 1 ? (cw + gap) : view.clientWidth;
    pages = Math.max(1, Math.ceil(cards.length / perView));
    buildDots();
    update();
  }
  view.addEventListener('scroll', update, { passive: true });
  if (opts.next) {
    opts.next.addEventListener('click', () => {
      let a = activeIdx() + 1;
      if (a >= pages) a = 0;
      go(a);
    });
  }
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(measure, 150); });
  measure();
}

/* Defensive cascade collector: flatten every element node across rows/cells in
   document order, supporting both the one-row-per-unit and the DA-flattened
   single-cell shapes. */
function collectNodes(block) {
  let rows = [...block.querySelectorAll(':scope > div')];
  // DA-flattened single-cell: unwrap the single cell into its children.
  if (rows.length === 1) {
    const cells = [...rows[0].querySelectorAll(':scope > div')];
    if (cells.length <= 1) {
      const only = cells[0] || rows[0];
      rows = [only];
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

const isName = (t) => /^\s*[—–-]/.test(t);
const isRating = (t) => /^\s*rating\b/i.test(t) || /^[★\s]+$/.test(t);
const isQuoteStart = (t) => /^\s*["“”„«]/.test(t);

export default async function decorate(block) {
  const nodes = collectNodes(block);

  const head = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const ctaNode = nodes.find((n) => n.tagName !== 'H2' && n.querySelector && n.querySelector('a'));
  const ctaLink = ctaNode ? ctaNode.querySelector('a') : null;

  const ps = nodes.filter((n) => n.tagName === 'P' && n !== ctaNode);

  // First paragraph is the blue subhead — unless it looks like a review quote/name.
  let sub = null;
  let rest = ps;
  if (ps.length) {
    const t0 = ps[0].textContent.trim();
    if (!isName(t0) && !isQuoteStart(t0) && !isRating(t0)) {
      [sub] = ps;
      rest = ps.slice(1);
    }
  }

  // Group the remaining paragraphs into reviews by the name marker.
  const reviews = [];
  let buffer = [];
  rest.forEach((p) => {
    const t = p.textContent.trim();
    if (isName(t)) {
      const quotes = buffer.filter((b) => !isRating(b.textContent.trim()));
      reviews.push({ quote: quotes[quotes.length - 1] || null, name: p });
      buffer = [];
    } else {
      buffer.push(p);
    }
  });

  // Build the DOM.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  if (head) {
    const h2 = document.createElement('h2');
    h2.textContent = head.textContent;
    wrap.append(h2);
  }
  if (sub) {
    // Role parity: the prototype renders this subhead as <h5 class="sub">, so
    // mirror the wrapping (a <p> here trips the content-inventory ROLE SWAP gate,
    // #76). Styled back to the blue subhead via .reviews .sub in the block CSS.
    const subEl = document.createElement('h5');
    subEl.className = 'sub';
    subEl.textContent = sub.textContent;
    wrap.append(subEl);
  }

  const view = document.createElement('div');
  view.className = 'rev-view';
  const row = document.createElement('div');
  row.className = 'rev-row';

  reviews.forEach((r) => {
    const rev = document.createElement('div');
    rev.className = 'rev';

    const stars = document.createElement('div');
    stars.className = 'stars';
    stars.setAttribute('aria-label', '5 out of 5 stars');
    stars.textContent = '★★★★★';
    rev.append(stars);

    if (r.quote) {
      const q = document.createElement('p');
      q.textContent = r.quote.textContent;
      rev.append(q);
    }
    if (r.name) {
      const who = document.createElement('div');
      who.className = 'who';
      who.textContent = r.name.textContent;
      rev.append(who);
    }
    row.append(rev);
  });

  view.append(row);
  wrap.append(view);

  const dots = document.createElement('div');
  dots.className = 'dots rev-dots';
  wrap.append(dots);

  if (ctaLink) {
    const cta = document.createElement('div');
    cta.className = 'cta';
    cta.append(ctaLink);
    wrap.append(cta);
  }

  block.textContent = '';
  block.append(wrap);

  initCarousel(view, dots, { rowSel: '.rev-row', perView: 3, next: null });
}
