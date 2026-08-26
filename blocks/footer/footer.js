import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/* ------------------------------------------------------------------ *\
   Presentation SVGs — lifted verbatim from the prototype markup.
   These are fixed decorations built in JS (DA would mangle inline SVG).
\* ------------------------------------------------------------------ */

const SMILEY = `<svg class="smiley" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M11.5 16.5c1.2-1.6 3.4-1.6 4.6 0M23.9 16.5c1.2-1.6 3.4-1.6 4.6 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M12.5 24.5c2 3.4 13 3.4 15 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`;

const PHONE = `<svg class="phone-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5c-1.1 0-2 .9-2 2C4.5 13.5 10.5 19.5 18.5 19.5c1.1 0 2-.9 2-2v-2.6c0-.5-.3-.9-.8-1l-3-.8c-.4-.1-.9 0-1.2.4l-1 1.2c-2.3-1.1-4.2-3-5.3-5.3l1.2-1c.3-.3.5-.8.4-1.2l-.8-3c-.1-.5-.5-.8-1-.8H6.5z" fill="none" stroke="#5099d3" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

// keyed by social-link label (lower-cased)
const SOCIAL = {
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c2.7 0 3 0 4.1.1 1 0 1.7.2 2.3.4.6.3 1.1.6 1.6 1.1s.8 1 1.1 1.6c.2.6.4 1.3.4 2.3C21.7 8.6 21.7 9 21.7 12s0 3.4-.1 4.5c0 1-.2 1.7-.4 2.3-.3.6-.6 1.1-1.1 1.6s-1 .8-1.6 1.1c-.6.2-1.3.4-2.3.4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.7-.2-2.3-.4-.6-.3-1.1-.6-1.6-1.1s-.8-1-1.1-1.6c-.2-.6-.4-1.3-.4-2.3C2.3 15.4 2.3 15 2.3 12s0-3.4.1-4.5c0-1 .2-1.7.4-2.3.3-.6.6-1.1 1.1-1.6s1-.8 1.6-1.1c.6-.2 1.3-.4 2.3-.4C9 2 9.3 2 12 2zm0 1.8c-2.7 0-3 0-4 .1-.8 0-1.2.2-1.5.3-.4.1-.7.3-1 .6s-.5.6-.6 1c-.1.3-.3.7-.3 1.5-.1 1-.1 1.3-.1 4s0 3 .1 4c0 .8.2 1.2.3 1.5.1.4.3.7.6 1s.6.5 1 .6c.3.1.7.3 1.5.3 1 .1 1.3.1 4 .1s3 0 4-.1c.8 0 1.2-.2 1.5-.3.4-.1.7-.3 1-.6s.5-.6.6-1c.1-.3.3-.7.3-1.5.1-1 .1-1.3.1-4s0-3-.1-4c0-.8-.2-1.2-.3-1.5-.1-.4-.3-.7-.6-1s-.6-.5-1-.6c-.3-.1-.7-.3-1.5-.3-1-.1-1.3-.1-4-.1zm0 3.1a5.1 5.1 0 110 10.2 5.1 5.1 0 010-10.2zm0 1.8a3.3 3.3 0 100 6.6 3.3 3.3 0 000-6.6zm5.3-3.2a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-1.6 19.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0012 2z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 2c.3 2.1 1.5 3.8 3.7 4v2.6c-1.3 0-2.6-.4-3.7-1.1v6.9a5.9 5.9 0 11-5.9-5.9c.3 0 .6 0 .9.1v2.7a3.2 3.2 0 102.3 3V2h2.7z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.5 7.2a2.8 2.8 0 00-2-2C18.8 4.7 12 4.7 12 4.7s-6.8 0-8.5.5a2.8 2.8 0 00-2 2A29 29 0 001 12a29 29 0 00.5 4.8 2.8 2.8 0 002 2c1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5a2.8 2.8 0 002-2A29 29 0 0023 12a29 29 0 00-.5-4.8zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z"/></svg>`,
};

// payment badges, in order — fixed decorations
const PAYS = [
  { title: 'Visa', cls: '', svg: `<svg viewBox="0 0 40 24" aria-hidden="true"><text x="20" y="16.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-style="italic" font-size="12" letter-spacing="0.5" fill="#1a1f71">VISA</text></svg>` },
  { title: 'Mastercard', cls: '', svg: `<svg viewBox="0 0 40 24" aria-hidden="true"><circle cx="16" cy="12" r="7.5" fill="#eb001b"/><circle cx="24" cy="12" r="7.5" fill="#f79e1b" fill-opacity=".9"/></svg>` },
  { title: 'Discover', cls: '', svg: `<svg viewBox="0 0 40 24" aria-hidden="true"><text x="3" y="15.5" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="7.4" letter-spacing="-.2" fill="#231f20">DISC</text><circle cx="31" cy="13" r="6" fill="#f47216"/><text x="21.5" y="15.5" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="7.4" letter-spacing="-.2" fill="#231f20">VER</text></svg>` },
  { title: 'American Express', cls: 'amex', svg: `<svg viewBox="0 0 40 24" aria-hidden="true"><text x="20" y="15.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="8" letter-spacing="0" fill="#fff">AMEX</text></svg>` },
  { title: 'PayPal', cls: '', svg: `<svg viewBox="0 0 40 24" aria-hidden="true"><text x="6" y="16" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-style="italic" font-size="10" fill="#003087">Pay</text><text x="21" y="16" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-style="italic" font-size="10" fill="#009cde">Pal</text></svg>` },
  { title: 'Cash', cls: '', svg: `<svg viewBox="0 0 40 24" aria-hidden="true"><text x="20" y="17" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="15" fill="#231f20">$</text></svg>` },
  { title: 'FSA / HSA', cls: '', svg: `<svg viewBox="0 0 40 24" aria-hidden="true"><text x="20" y="11" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="8" fill="#1a3fa0">FSA</text><text x="20" y="20" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="8" fill="#1a3fa0">HSA</text></svg>` },
];

/** parse an HTML string into a single element */
function fromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/** append raw SVG markup to an element */
function appendSVG(parent, markup) {
  const svg = fromHTML(markup);
  if (svg) parent.append(svg);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment (KEEP stock fetch pattern)
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const ft = document.createElement('div');
  ft.className = 'ft';
  if (!fragment) {
    block.append(ft);
    return;
  }

  /* ---------- decode the authored fragment by role ---------- */
  const h3 = fragment.querySelector('h3');
  const h4 = fragment.querySelector('h4');
  const brandBox = h3 ? (h3.closest('.default-content-wrapper') || h3.parentElement) : null;
  const helpBox = h4 ? (h4.closest('.default-content-wrapper') || h4.parentElement) : null;

  /* ================= main wrap ================= */
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  /* ---- LEFT: brand ---- */
  const brand = document.createElement('div');
  brand.className = 'brand';

  // logo (fixed decoration)
  const logo = fromHTML('<img class="logo" src="/img/logo-white.png" alt="1-800 Contacts" width="200" height="15">');
  brand.append(logo);

  // headline + smiley
  if (h3) {
    const heading = document.createElement('h3');
    const span = document.createElement('span');
    span.textContent = h3.textContent.trim();
    heading.append(span);
    appendSVG(heading, SMILEY);
    brand.append(heading);
  }

  // learn more link
  const learn = brandBox ? brandBox.querySelector('p a, a.button') : null;
  if (learn) {
    const a = document.createElement('a');
    a.className = 'learn';
    a.href = learn.getAttribute('href');
    a.textContent = learn.textContent.trim();
    brand.append(a);
  }

  // social row — match glyphs to authored links by label
  const socialLinks = brandBox ? [...brandBox.querySelectorAll('ul a')] : [];
  if (socialLinks.length) {
    const social = document.createElement('div');
    social.className = 'social';
    socialLinks.forEach((src) => {
      const key = src.textContent.trim().toLowerCase();
      const a = document.createElement('a');
      a.href = src.getAttribute('href');
      a.setAttribute('aria-label', src.textContent.trim());
      if (SOCIAL[key]) appendSVG(a, SOCIAL[key]);
      else a.textContent = src.textContent.trim();
      social.append(a);
    });
    brand.append(social);
  }

  // "We accept" + payment badges (fixed decorations)
  const accept = document.createElement('div');
  accept.className = 'accept';
  accept.textContent = 'We accept';
  brand.append(accept);

  const pays = document.createElement('div');
  pays.className = 'pays';
  PAYS.forEach((p) => {
    const span = document.createElement('span');
    span.className = p.cls ? `pay ${p.cls}` : 'pay';
    span.title = p.title;
    appendSVG(span, p.svg);
    pays.append(span);
  });
  brand.append(pays);

  wrap.append(brand);

  /* ---- RIGHT: help + link columns ---- */
  const right = document.createElement('div');
  right.className = 'ft-right';

  const top = document.createElement('div');
  top.className = 'top';
  if (h4) {
    const heading = document.createElement('h4');
    heading.textContent = h4.textContent.trim();
    top.append(heading);
  }
  // description paragraph = first p in help box without a link
  if (helpBox) {
    const descP = [...helpBox.querySelectorAll('p')].find((p) => !p.querySelector('a'));
    if (descP) {
      const p = document.createElement('p');
      p.textContent = descP.textContent.trim();
      top.append(p);
    }

    // contact row: phone (tel:) + chat
    const phoneLink = helpBox.querySelector('a[href^="tel:"]');
    const chatLink = [...helpBox.querySelectorAll('a')].find((a) => !a.getAttribute('href').startsWith('tel:'));
    const contact = document.createElement('div');
    contact.className = 'contact';

    if (phoneLink) {
      const span = document.createElement('span');
      appendSVG(span, PHONE);
      const a = document.createElement('a');
      a.href = phoneLink.getAttribute('href');
      a.textContent = phoneLink.textContent.trim();
      span.append(a);
      contact.append(span);
    }
    if (chatLink) {
      const span = document.createElement('span');
      const a = document.createElement('a');
      a.href = chatLink.getAttribute('href');
      a.textContent = `💬 ${chatLink.textContent.trim()}`;
      span.append(a);
      contact.append(span);
    }
    top.append(contact);
  }
  right.append(top);

  // link columns: each h5 + its following ul
  const cols = document.createElement('div');
  cols.className = 'ft-cols';
  const colHeadings = [...fragment.querySelectorAll('h5')];
  colHeadings.forEach((h5) => {
    const col = document.createElement('div');
    col.className = 'ft-col';
    const heading = document.createElement('h5');
    heading.textContent = h5.textContent.trim();
    col.append(heading);
    // the ul immediately following this h5
    let sib = h5.nextElementSibling;
    while (sib && sib.tagName !== 'UL' && sib.tagName !== 'H5') sib = sib.nextElementSibling;
    if (sib && sib.tagName === 'UL') {
      sib.querySelectorAll('a').forEach((src) => {
        const a = document.createElement('a');
        a.href = src.getAttribute('href');
        a.innerHTML = src.innerHTML;
        col.append(a);
      });
    }
    cols.append(col);
  });
  right.append(cols);

  wrap.append(right);
  ft.append(wrap);

  /* ================= legal wrap ================= */
  const copyP = [...fragment.querySelectorAll('p')].find((p) => /copyright|©/i.test(p.textContent));
  const legalBox = copyP ? (copyP.closest('.default-content-wrapper') || copyP.parentElement) : null;
  const legalUl = legalBox ? legalBox.querySelector('ul') : null;

  if (copyP || legalUl) {
    const legal = document.createElement('div');
    legal.className = 'wrap legal';

    const copy = document.createElement('span');
    copy.textContent = copyP ? copyP.textContent.trim() : '';
    legal.append(copy);

    if (legalUl) {
      const links = document.createElement('span');
      links.className = 'links';
      legalUl.querySelectorAll('a').forEach((src) => {
        const a = document.createElement('a');
        a.href = src.getAttribute('href');
        a.innerHTML = src.innerHTML;
        links.append(a);
      });
      legal.append(links);
    }
    ft.append(legal);
  }

  block.append(ft);

  /* ---- optional mobile accordion (progressive; reduced-motion-safe) ----
     Prototype collapses columns with pure CSS on ≤768px. We add an opt-in
     tap/keyboard toggle that reveals a column's links; desktop is untouched. */
  const mq = window.matchMedia('(max-width:768px)');
  cols.querySelectorAll('.ft-col h5').forEach((h5) => {
    h5.setAttribute('role', 'button');
    h5.setAttribute('tabindex', '0');
    h5.setAttribute('aria-expanded', 'false');
    const toggle = () => {
      if (!mq.matches) return;
      const open = h5.parentElement.classList.toggle('open');
      h5.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    h5.addEventListener('click', toggle);
    h5.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}
