/* ReviewMore — Order Review Cards page
 *
 * ============ EDIT PRICES, QUANTITIES AND SETTINGS HERE ============
 *
 * - options: each quantity you sell and its total price in pounds.
 * - popular: true puts a "Most popular" tag on that option.
 * - defaultQty: which quantity is selected when the page loads.
 * - cardType: the exact text sent to the "Card Type" field in GoHighLevel.
 * - ORDER_FORM_ID: the GoHighLevel "ReviewMore – Card Order" form.
 */
var REVIEW_CARDS = {
  ORDER_FORM_ID: 'QdOFEYaape3khISeWewd',

  products: {
    standard: {
      name: 'Standard Review Cards',
      cardType: 'Standard',
      defaultQty: 10,
      options: [
        { qty: 1,  price: 9 },
        { qty: 5,  price: 39 },
        { qty: 10, price: 59, popular: true }
      ]
    },
    branded: {
      name: 'Custom Branded Review Cards',
      cardType: 'Custom Branded',
      defaultQty: 5,
      askForLogo: true,
      options: [
        { qty: 1,  price: 19 },
        { qty: 5,  price: 79, popular: true },
        { qty: 10, price: 139 }
      ]
    }
  },

  // Query keys of the hidden fields in the GoHighLevel order form
  fieldKeys: {
    type: 'card_type',
    qty: 'card_quantity',
    value: 'order_value'
  }
};
/* =================================================================== */

(function () {
  var cfg = REVIEW_CARDS;
  var selection = {};   // product id -> selected option
  var current = null;   // product id open in the order form

  function money(n) {
    return '£' + (Number.isInteger(n) ? n : n.toFixed(2));
  }
  function cardsLabel(n) {
    return n + (n === 1 ? ' card' : ' cards');
  }
  function perCard(opt) {
    return '£' + (opt.price / opt.qty).toFixed(2) + ' per card';
  }
  function orderLine(id) {
    var opt = selection[id];
    return opt.qty + ' × ' + cfg.products[id].name.replace(/ Cards$/, opt.qty === 1 ? ' Card' : ' Cards');
  }

  /* ---------- Product cards ---------- */
  document.querySelectorAll('[data-product]').forEach(function (el) {
    var id = el.getAttribute('data-product');
    var product = cfg.products[id];
    if (!product) return;

    var wrap = el.querySelector('[data-qty-options]');
    var priceNow = el.querySelector('[data-price-now]');
    var priceMeta = el.querySelector('[data-price-meta]');

    function show(opt) {
      selection[id] = opt;
      priceNow.textContent = money(opt.price);
      priceMeta.textContent = opt.qty === 1 ? '1 card' : cardsLabel(opt.qty) + ' · ' + perCard(opt);
    }

    product.options.forEach(function (opt) {
      var label = document.createElement('label');
      label.className = 'qty-option';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'qty-' + id;
      input.value = opt.qty;
      input.checked = opt.qty === product.defaultQty;
      input.addEventListener('change', function () { show(opt); });

      var box = document.createElement('span');
      box.className = 'qty-box';
      box.innerHTML =
        (opt.popular ? '<span class="qty-tag">Most popular</span>' : '') +
        '<span class="qty-num">' + cardsLabel(opt.qty) + '</span>' +
        '<span class="qty-price">' + money(opt.price) + '</span>';

      label.appendChild(input);
      label.appendChild(box);
      wrap.appendChild(label);

      if (input.checked) show(opt);
    });

    if (!selection[id]) {
      wrap.querySelector('input').checked = true;
      show(product.options[0]);
    }

    el.querySelector('[data-order-button]').addEventListener('click', function () {
      openOrder(id);
    });
  });

  /* ---------- Order form ---------- */
  var dialog = document.getElementById('order-dialog');
  var formArea = dialog.querySelector('[data-order-form]');
  var orderFrame = null;

  // GoHighLevel fills its hidden fields from these query parameters,
  // e.g. ?card_type=Custom%20Branded&card_quantity=10&order_value=79
  function orderUrl(id) {
    var keys = cfg.fieldKeys;
    var opt = selection[id];
    var query = [
      [keys.type, cfg.products[id].cardType],
      [keys.qty, String(opt.qty)],
      [keys.value, String(opt.price)]
    ].map(function (pair) {
      return encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]);
    }).join('&');
    return 'https://api.leadconnectorhq.com/widget/form/' + cfg.ORDER_FORM_ID + '?' + query;
  }

  // The form is created once, using GoHighLevel's embed settings, then
  // GoHighLevel's script (which only sets up forms present when it loads)
  // takes over. Later orders just load the same form with new details.
  function showForm(id) {
    if (orderFrame) {
      orderFrame.src = orderUrl(id);
      return;
    }
    var formId = cfg.ORDER_FORM_ID;
    var iframe = document.createElement('iframe');
    iframe.src = orderUrl(id);
    iframe.id = 'inline-' + formId;
    iframe.title = 'ReviewMore – Card Order';
    iframe.style.cssText = 'width:100%;height:906px;border:none;border-radius:8px';
    iframe.setAttribute('data-layout', "{'id':'INLINE'}");
    iframe.setAttribute('data-trigger-type', 'alwaysShow');
    iframe.setAttribute('data-trigger-value', '');
    iframe.setAttribute('data-activation-type', 'alwaysActivated');
    iframe.setAttribute('data-activation-value', '');
    iframe.setAttribute('data-deactivation-type', 'neverDeactivate');
    iframe.setAttribute('data-deactivation-value', '');
    iframe.setAttribute('data-form-name', 'ReviewMore – Card Order');
    iframe.setAttribute('data-height', '906');
    iframe.setAttribute('data-layout-iframe-id', 'inline-' + formId);
    iframe.setAttribute('data-form-id', formId);
    iframe.setAttribute('data-cookie-consent', 'true');
    iframe.setAttribute('data-cookie-consent-provider', 'auto');
    formArea.appendChild(iframe);
    orderFrame = iframe;

    var s = document.createElement('script');
    s.src = 'https://link.msgsndr.com/js/form_embed.js';
    document.body.appendChild(s);
  }

  function openOrder(id) {
    current = id;
    var product = cfg.products[id];
    dialog.querySelector('[data-order-line]').textContent = orderLine(id);
    dialog.querySelector('[data-order-price]').textContent = money(selection[id].price);
    dialog.querySelector('[data-logo-note]').hidden = !product.askForLogo;

    showForm(id);

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('dialog-open');
  }

  function closeOrder() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  dialog.addEventListener('close', function () {
    document.body.classList.remove('dialog-open');
    // Clear the form so the next order never shows old details
    if (orderFrame) orderFrame.src = 'about:blank';
    // Return focus to the button that opened the form
    var btn = current && document.querySelector('[data-product="' + current + '"] [data-order-button]');
    if (btn) btn.focus();
  });

  dialog.querySelectorAll('[data-order-close]').forEach(function (b) {
    b.addEventListener('click', closeOrder);
  });

  // Clicking the dark backdrop closes the form
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeOrder();
  });
})();
