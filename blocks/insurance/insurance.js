export default async function decorate(block) {
  let cells = [...block.querySelectorAll(':scope > div > div')];

  // Handle the DA-flattened single-cell case.
  if (cells.length <= 1) {
    const only = cells[0] || block;
    const kids = [...only.children].filter((n) => n.nodeType === 1);
    if (kids.length > 1) cells = kids;
  }

  // Flatten cell children into a node list.
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

  const h2 = nodes.find((n) => n.tagName === 'H2');
  const paras = nodes.filter((n) => n.tagName === 'P');
  const ctaPara = paras.find((p) => p.querySelector('a'));
  const copy = paras.find((p) => p !== ctaPara);

  // Build left column.
  const left = document.createElement('div');
  left.className = 'left';
  if (h2) left.append(h2);
  if (copy) left.append(copy);
  // The CTA anchor is already a.button.primary after decorateButtons; grab it
  // from the live DOM so we don't depend on how it was wrapped.
  const link = (ctaPara && ctaPara.querySelector('a')) || block.querySelector('a');
  if (link) left.append(link);

  // Build logo cluster (desktop + mobile).
  const logos = document.createElement('div');
  logos.className = 'logos';
  const logoD = document.createElement('img');
  logoD.className = 'logos-d';
  logoD.src = '/img/insurance-logos.png';
  logoD.alt = 'Anthem, Blue View Vision, Davis Vision, Superior Vision, Spectera';
  logoD.loading = 'lazy';
  const logoM = document.createElement('img');
  logoM.className = 'logos-m';
  logoM.src = '/img/ins-logos-mobile.png';
  logoM.alt = 'Anthem, Blue View Vision, Davis Vision, Superior Vision, Solstice, Spectera, United Healthcare';
  logoM.loading = 'lazy';
  logos.append(logoD, logoM);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(left, logos);

  block.textContent = '';
  block.append(wrap);
}
