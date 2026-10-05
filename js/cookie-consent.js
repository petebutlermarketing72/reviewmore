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

  var META_PIXEL_ID = '1425713639518070';
  var marketingLoaded = false;
  function loadMarketing() {
    if (marketingLoaded) return;
    marketingLoaded = true;
    // Meta Pixel (ReviewMore website dataset). Only runs after the visitor clicks Accept.
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }


  // Conversion tracking helper. Thank-you pages call rmTrack('Lead', {...}).
  // The event is sent to Meta only if the visitor has accepted marketing cookies;
  // if they accept later on the same page, queued events are sent at that point.
  var queued = [];
  function flushTracking() {
    if (!(window.rmConsent && window.rmConsent.marketing) || typeof window.fbq !== 'function') return;
    while (queued.length) { var q = queued.shift(); window.fbq('track', q[0], q[1] || {}); }
  }
  window.rmTrack = function (name, params) { queued.push([name, params]); flushTracking(); };
  document.addEventListener('rm-consent', flushTracking);

  function apply(choice) {
    window.rmConsent = { marketing: !!(choice && choice.marketing) };
    if (window.rmConsent.marketing) loadMarketing();
    document.dispatchEvent(new CustomEvent('rm-consent', { detail: window.rmConsent }));
  }

  var tab = null;
  function buildTab() {
    tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'cc-tab';
    tab.setAttribute('aria-label', 'Cookie settings');
    tab.setAttribute('title', 'Cookie settings');
    tab.hidden = true;
    if (!document.querySelector('.mobile-cta')) tab.classList.add('cc-tab-low');
    tab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-4-4 4 4 0 0 1-4-4 2 2 0 0 1-2-2zM8.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm3 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM7.5 14.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>';
    tab.addEventListener('click', function () { show(); });
    document.body.appendChild(tab);
  }
  function showTab(on) { if (!tab) buildTab(); tab.hidden = !on; }

  function hide() { if (banner) banner.hidden = true; showTab(true); }

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
      var wasLoaded = marketingLoaded;
      save(marketing);
      if (wasLoaded && !marketing) { location.reload(); return; }
      apply({ marketing: marketing });
      hide();
    });
    document.body.appendChild(banner);
  }

  function show() {
    if (!banner) build();
    banner.hidden = false;
    showTab(false);
    var b = banner.querySelector('[data-cc="reject"]');
    if (b) b.focus({ preventScroll: true });
  }

  function init() {
    var existing = read();
    apply(existing);
    if (!existing) show(); else showTab(true);
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); show(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
