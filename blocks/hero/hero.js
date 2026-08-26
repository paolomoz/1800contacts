export default async function decorate(block) {
  // Collect authored cells defensively: each `:scope > div > div` is a cell.
  // Fallback for the DA-flattened single-cell case is handled below.
  let cells = [...block.querySelectorAll(':scope > div > div')];

  // If the block flattened to a single cell with everything as flat siblings,
  // treat its element children as the "cells".
  if (cells.length <= 1) {
    const only = cells[0] || block;
    const kids = [...only.children].filter((n) => n.nodeType === 1);
    if (kids.length > 1) cells = kids;
  }

  // Gather the meaningful elements from all cells (flatten a level if needed).
  const nodes = [];
  cells.forEach((cell) => {
    const kids = [...cell.children].filter((n) => n.nodeType === 1);
    if (kids.length) nodes.push(...kids);
    else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      nodes.push(p);
    }
  });

  // The CTA anchors — already a.button.* after decorateButtons. Grab them from
  // the live DOM so we don't depend on how decorateButtons wrapped/split them.
  const ctaAnchors = [...block.querySelectorAll('a')];

  // Classify.
  const h1 = nodes.find((n) => n.tagName === 'H1');
  const paras = nodes.filter((n) => n.tagName === 'P');
  const plainParas = paras.filter((p) => !p.querySelector('a'));
  const sub = plainParas[0];
  const fineprint = plainParas[plainParas.length - 1] !== sub
    ? plainParas[plainParas.length - 1]
    : plainParas[1];

  // Build structure.
  const art = document.createElement('div');
  art.className = 'art';
  const artD = document.createElement('img');
  artD.className = 'art-d';
  artD.src = '/img/hero.jpg';
  artD.alt = 'Best online contacts retailer';
  artD.loading = 'eager';
  const artM = document.createElement('img');
  artM.className = 'art-m';
  artM.src = '/img/hero-mobile.png';
  artM.alt = '30% off your exact brand of contacts';
  artM.loading = 'eager';
  art.append(artD, artM);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  const col = document.createElement('div');
  col.className = 'col';

  if (h1) col.append(h1);

  if (sub) {
    const subDiv = document.createElement('div');
    subDiv.className = 'sub';
    while (sub.firstChild) subDiv.append(sub.firstChild);
    col.append(subDiv);
  }

  if (ctaAnchors.length) {
    const cta = document.createElement('div');
    cta.className = 'cta';
    // Move the anchors themselves in so .cta's flex-column controls them
    // directly (avoids inline stacking if both share one button-wrapper <p>).
    ctaAnchors.forEach((a) => cta.append(a));
    col.append(cta);
  }

  if (fineprint && fineprint !== sub) {
    const fp = document.createElement('div');
    fp.className = 'fineprint';
    while (fineprint.firstChild) fp.append(fineprint.firstChild);
    col.append(fp);
  }

  wrap.append(col);

  block.textContent = '';
  block.append(art, wrap);
}
