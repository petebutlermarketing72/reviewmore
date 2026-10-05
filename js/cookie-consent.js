/* ReviewMore — cookie consent
 *
 * - Nothing optional (marketing/advertising) loads until the visitor clicks Accept.
 * - "Reject" is as easy as "Accept". The choice is remembered for 6 months.
 * - Footer "Cookie settings" button reopens the banner so people can change their mind.
 * - To add a marketing tool later (e.g. Meta Pixel), put its loader inside loadMarketing().
 *   It only runs after consent, and is removed on a fresh page load if consent is withdrawn.
 */
(function () {
  var KEY = 'rm_cookie_consent';
  var MONTHS = 6;
  var banner = null;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!v || typeof v.marketing !== 'boolean') return null;
      if (Date.now() - v.ts > MONTHS * 30 * 24 * 3600 * 1000) return null;
      return v;
    } catch (e) { return null; }
  }
  function save(marketing) {
    try { localStorage.setItem(KEY, JSON.stringify({ marketing: marketing, ts: Date.now() })); } catch (e) {}
  }

  var marketingLoaded = false;
  function loadMarketing() {
    if (marketingLoaded) return;
    marketingLoaded = true;
    // Marketing tags (e.g. Meta Pixel) go here once added. Intentionally empty for now.
  }

  function apply(choice) {
    window.rmConsent = { marketing: !!(choice && choice.marketing) };
    document.dispatchEvent(new CustomEvent('rm-consent', { detail: window.rmConsent }));
    if (window.rmConsent.marketing) loadMarketing();
  }

  function hide() { if (banner) banner.hidden = true; }

  function build() {
    banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cc-title');
    banner.hidden = true;
    banner.innerHTML =
      '<p class="cc-title" id="cc-title">Cookies on ReviewMore</p>' +
      '<p class="cc-text">We use essential cookies to make this site work. With your OK we would also use ' +
      'marketing cookies to measure and improve our adverts. You can change your mind at any time. ' +
      '<a href="/privacy/#cookies">Read more</a></p>' +
      '<div class="cc-actions">' +
        '<button type="button" class="cc-btn" data-cc="reject">Reject</button>' +
        '<button type="button" class="cc-btn cc-btn-accept" data-cc="accept">Accept</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cc]');
      if (!t) return;
      var marketing = t.getAttribute('data-cc') === 'accept';
      save(marketing);
      apply({ marketing: marketing });
      hide();
    });
    document.body.appendChild(banner);
  }

  function show() {
    if (!banner) build();
    banner.hidden = false;
    var b = banner.querySelector('[data-cc="reject"]');
    if (b) b.focus({ preventScroll: true });
  }

  function init() {
    var existing = read();
    apply(existing);
    if (!existing) show();
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); show(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
