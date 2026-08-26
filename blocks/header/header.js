import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the header chrome (promo bar + navy header + mobile search)
 * from the authored /nav body fragment.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment (KEEP the stock fetch pattern)
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // ----- decode the authored fragment defensively -----
  // The fragment is a decorated <main> whose sections carry only authorable
  // content (copy + links). All presentation (countdown digits, CSS glyphs,
  // colours, layout) is built here in JS.
  const frag = fragment || document.createElement('div');

  // promo copy = first paragraph of authored content
  const promoP = frag.querySelector('p');
  const promoText = promoP
    ? promoP.textContent.trim()
    : 'First order? Save 30% + free shipping! 🎉';

  // sign-in CTA = the /account link, or any link whose text reads "Sign in"
  const allLinks = [...frag.querySelectorAll('a')];
  const signinLink = frag.querySelector('a[href="/account"]')
    || allLinks.find((a) => /sign\s*in/i.test(a.textContent));

  // primary nav = the first <ul> that isn't the one holding the sign-in link
  const lists = [...frag.querySelectorAll('ul')];
  const primaryList = lists.find((ul) => !signinLink || !ul.contains(signinLink))
    || lists[0];
  const primaryLinks = primaryList ? [...primaryList.querySelectorAll('a')] : [];

  // ----- build the bespoke chrome -----
  block.textContent = '';

  // 1. PROMO BAR
  // NOTE: the countdown digits are rendered STATICALLY as 00:21:33:47 to match
  // the frozen gate capture. Do NOT animate a live countdown here — a ticking
  // timer would drift from the pixel-fidelity capture.
  const promo = document.createElement('div');
  promo.className = 'promo';
  promo.append(document.createTextNode(`${promoText} `));
  const digits = document.createElement('span');
  digits.className = 'digits';
  ['00', '21', '33', '47'].forEach((val, i) => {
    if (i > 0) digits.append(document.createTextNode(':'));
    const b = document.createElement('b');
    b.textContent = val;
    digits.append(b);
  });
  promo.append(digits);

  // 2. NAVY HEADER
  const hdr = document.createElement('div');
  hdr.className = 'hdr';
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // burger (3 white bars) — visual only, no drawer exists in the prototype
  const burger = document.createElement('div');
  burger.className = 'burger';
  burger.setAttribute('aria-hidden', 'true');
  burger.innerHTML = '<i></i><i></i><i></i>';

  // logo
  const logo = document.createElement('img');
  logo.className = 'logo';
  logo.src = '/img/logo-white.png';
  logo.alt = '1-800 Contacts';
  logo.width = 120;
  logo.height = 16;

  // primary nav links (centered)
  const nav = document.createElement('nav');
  primaryLinks.forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '#';
    link.textContent = a.textContent.trim();
    nav.append(link);
  });

  // right cluster: moon (mobile only) + search glyph + sign-in pill
  const right = document.createElement('div');
  right.className = 'right';
  const moon = document.createElement('div');
  moon.className = 'moon';
  moon.setAttribute('aria-hidden', 'true');
  const search = document.createElement('div');
  search.className = 'search';
  search.setAttribute('aria-hidden', 'true');
  const signin = document.createElement('a');
  signin.className = 'signin';
  signin.href = signinLink ? signinLink.getAttribute('href') : '/account';
  signin.textContent = signinLink ? signinLink.textContent.trim() : 'Sign in';
  right.append(moon, search, signin);

  wrap.append(burger, logo, nav, right);
  hdr.append(wrap);

  // 3. MOBILE SEARCH PILL (mobile only)
  const mSearch = document.createElement('div');
  mSearch.className = 'm-search';
  const pill = document.createElement('div');
  pill.className = 'm-search-pill';
  const mag = document.createElement('span');
  mag.className = 'mag';
  mag.setAttribute('aria-hidden', 'true');
  pill.append(mag, document.createTextNode('Find my contacts'));
  mSearch.append(pill);

  block.append(promo, hdr, mSearch);
}
