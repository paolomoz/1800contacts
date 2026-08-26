/*
 * Cards block — replica of the prototype `<section class="cards-sec">`:
 * a scroll-snap carousel of 5 cards with a chevron (desktop) and dots.
 *
 * Authored input (first row is the section head, rows 2–6 are the cards):
 *   Row 1: <h2>Need something else? We can help.</h2>
 *   Rows 2–6: each cell = <h3>title</h3> + <p><strong><a>CTA</a></strong></p>
 *             (decorateButtons() rewrites the CTA to a.button.primary in
 *              p.button-wrapper before this block runs).
 *
 * Card imagery cannot be authored per-card (no DA upload path), so each card's
 * image is assigned BY INDEX here — matching the prototype exactly:
 *   index 0 → /img/card-exam.png (desktop) + /img/card-exam-m.png (mobile swap)
 *   index 1 → /img/card-glasses.jpg
 *   index 2 → /img/card-aquasoft.png
 *   index 3 → placeholder (.img.ph, background var(--hero-wash)) — "app" card
 *   index 4 → placeholder (.img.ph, background var(--hero-wash)) — "Gajillion" card
 *
 * The decoder is defensive: it flattens all authored nodes in document order
 * and segments cards on each <h3> boundary, so it works for BOTH the
 * one-row-per-card shape AND a DA-flattened single-cell shape.
 */

const CARD_IMAGES = [
  { d: '/img/card-exam.png', m: '/img/card-exam-m.png', alt: 'Doctor-issued prescription, takes 10 minutes' },
  { d: '/img/card-glasses.jpg', alt: 'Glasses' },
  { d: '/img/card-aquasoft.png', alt: 'AquaSoft contact lenses' },
  null,
  null,
];

/**
 * Port of the prototype `initCarousel`: native scroll-snap view driven by dots
 * and (desktop-only) chevron. Dots are rebuilt per breakpoint from the page
 * count (2 desktop pages of 3 / 5 mobile pages of 1). Active dot comes from
 * round(scrollLeft / pageW). Honors prefers-reduced-motion for programmatic
 * scrolls.
 */
function initCarousel(view, dotsEl, opts) {
  if (!view || !dotsEl) return;
  const track = view.querySelector(opts.rowSel);
  if (!track) return;
  const cards = [...track.children];
  if (!cards.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => window.matchMedia('(max-width:768px)').matches;
  let pages = 1;
  let pageW = 0;

  function activeIdx() {
    if (!pageW) return 0;
    return Math.max(0, Math.min(pages - 1, Math.round(view.scrollLeft / pageW)));
  }

  function go(i) {
    if (!pageW) return;
    view.scrollTo({ left: i * pageW, behavior: reduce ? 'auto' : 'smooth' });
  }

  function update() {
    const a = activeIdx();
    [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i === a));
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < pages; i += 1) {
      const d = document.createElement('i');
      const idx = i;
      d.addEventListener('click', () => go(idx));
      dotsEl.appendChild(d);
    }
  }

  function measure() {
    const perView = mobile() ? 1 : opts.perView;
    const cw = cards[0].getBoundingClientRect().width;
    // Layout not ready yet (section still display:none pre-appear → 0 width).
    // Bail without caching a zero pageW; the ResizeObserver re-runs measure
    // the moment the view gets a real box.
    if (!view.clientWidth || !cw) return;
    const cs = getComputedStyle(track);
    const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
    pageW = perView === 1 ? cw + gap : view.clientWidth;
    pages = Math.max(1, Math.ceil(cards.length / perView));
    buildDots();
    update();
  }

  view.addEventListener('scroll', update, { passive: true });
  if (opts.next) {
    opts.next.addEventListener('click', () => {
      if (!pageW) measure();
      let a = activeIdx() + 1;
      if (a >= pages) a = 0;
      go(a);
    });
  }
  // Re-measure whenever the view's box changes: fires once the section becomes
  // visible and gets a real width (decorate-time measure ran at 0 width and
  // cached pageW=0, which killed the chevron/dots), and again on breakpoint or
  // orientation changes. Replaces the decorate-only + window-resize measure.
  const ro = new ResizeObserver(() => measure());
  ro.observe(view);
  measure();
}

export default async function decorate(block) {
  // Collect authored cells defensively; support the DA-flattened single cell.
  let cells = [...block.querySelectorAll(':scope > div > div')];
  if (cells.length <= 1) cells = [cells[0] || block];

  // Flatten meaningful child elements in document order.
  const nodes = [];
  cells.forEach((cell) => {
    [...cell.children].forEach((n) => { if (n.nodeType === 1) nodes.push(n); });
  });

  // Section head + segment cards on each <h3> boundary.
  const head = nodes.find((n) => n.tagName === 'H2');
  const groups = [];
  let cur = null;
  nodes.forEach((n) => {
    if (n === head) return;
    if (n.tagName === 'H3') {
      cur = { title: n, cta: null };
      groups.push(cur);
    } else if (cur && !cur.cta) {
      const a = n.tagName === 'A' ? n : (n.querySelector && n.querySelector('a'));
      if (a) cur.cta = a;
    }
  });

  // Build carousel.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  if (head) wrap.append(head);

  const cardsView = document.createElement('div');
  cardsView.className = 'cards-view';
  const cardsRow = document.createElement('div');
  cardsRow.className = 'cards-row';

  groups.forEach((g, i) => {
    const card = document.createElement('div');
    card.className = 'card';

    // Image by index (prototype mapping).
    const img = document.createElement('div');
    img.className = 'img';
    const src = CARD_IMAGES[i];
    if (!src) {
      img.classList.add('ph');
    } else if (src.m) {
      // Exam card: desktop + mobile image swap.
      const imgD = document.createElement('img');
      imgD.className = 'ex-d';
      imgD.src = src.d;
      imgD.alt = src.alt;
      imgD.loading = 'lazy';
      const imgM = document.createElement('img');
      imgM.className = 'ex-m';
      imgM.src = src.m;
      imgM.alt = src.alt;
      imgM.loading = 'lazy';
      img.append(imgD, imgM);
    } else {
      const el = document.createElement('img');
      el.src = src.d;
      el.alt = src.alt;
      el.loading = 'lazy';
      img.append(el);
    }

    const body = document.createElement('div');
    body.className = 'body';
    if (g.title) body.append(g.title);
    if (g.cta) {
      if (!g.cta.classList.contains('button')) g.cta.classList.add('button', 'primary');
      body.append(g.cta);
    }

    card.append(img, body);
    cardsRow.append(card);
  });

  cardsView.append(cardsRow);
  wrap.append(cardsView);

  const chevron = document.createElement('button');
  chevron.className = 'chevron';
  chevron.type = 'button';
  chevron.setAttribute('aria-label', 'Next');
  chevron.textContent = '›';

  const dots = document.createElement('div');
  dots.className = 'dots';

  wrap.append(chevron, dots);

  block.textContent = '';
  block.append(wrap);

  initCarousel(cardsView, dots, { rowSel: '.cards-row', perView: 3, next: chevron });
}
