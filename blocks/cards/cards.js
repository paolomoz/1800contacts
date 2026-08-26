/*
 * Cards block — replica of the prototype `<section class="cards-sec">`:
 * a scroll-snap carousel of 5 cards with a chevron (desktop) and dots.
 *
 * Authored input (first row is the section head, each following row is a card
 * as two cells: an image cell + a text cell):
 *   Row 1: <h2>Need something else? We can help.</h2>
 *   Rows 2–6: cell 1 = <picture><img></picture> (authored image, lives in DA),
 *             cell 2 = <h3>title</h3> + <p><strong><a>CTA</a></strong></p>
 *             (decorateButtons() rewrites the CTA to a.button.primary in
 *              p.button-wrapper before this block runs).
 *
 * The image MUST ride a <picture> alone in its own cell: the runtime's
 * wrapTextNodes folds any cell that leads with a bare <img> or a <picture>
 * followed by more content into a single <p>, which would swallow the title.
 *
 * The decoder is shape-agnostic: it flattens the authored content into an
 * ordered stream of the three things a card is made of (image / title / CTA)
 * and segments on each <h3> boundary, attaching the picture that precedes it.
 * This works for BOTH the two-cell-row shape and a DA-flattened single cell.
 */

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
  const head = block.querySelector('h2');

  // Flatten the authored content into an ordered stream of the three things a
  // card is made of — image / title / CTA — then segment on each <h3>. This is
  // shape-agnostic: two-cell rows (image cell then text cell) and a
  // DA-flattened single cell both linearise to the same picture→h3→link order.
  const stream = [...block.querySelectorAll('picture, img, h3, a')]
    // keep the <picture> wrapper, drop the <img> it contains (double count)
    .filter((n) => !(n.tagName === 'IMG' && n.closest('picture')));

  const groups = [];
  let pendingPic = null;
  let cur = null;
  stream.forEach((n) => {
    if (n.tagName === 'PICTURE' || n.tagName === 'IMG') {
      pendingPic = n;
    } else if (n.tagName === 'H3') {
      cur = { pic: pendingPic, title: n, cta: null };
      pendingPic = null;
      groups.push(cur);
    } else if (n.tagName === 'A' && cur && !cur.cta) {
      cur.cta = n;
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

  groups.forEach((g) => {
    const card = document.createElement('div');
    card.className = 'card';

    // Image comes from the authored content (lives in DA). No picture → the
    // brand-fill placeholder wash.
    const img = document.createElement('div');
    img.className = 'img';
    if (g.pic) {
      img.append(g.pic);
      const imgEl = img.querySelector('img');
      if (imgEl && !imgEl.getAttribute('loading')) imgEl.loading = 'lazy';
    } else {
      img.classList.add('ph');
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
