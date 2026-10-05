/* ReviewMore — Order Review Cards page
 *
 * ============ EDIT PRICES, QUANTITIES AND SETTINGS HERE ============
 *
 * - options: each quantity you sell and its total price in pounds.
 * - popular: true puts a "Most popular" tag on that option.
 * - defaultQty: which quantity is selected when the page loads.
 * - ORDER_FORM_ID: the GoHighLevel form used for card orders. Leave it
 *   empty and customers get an "email this order" button instead.
 *   A product can use its own form by setting formId on that product.
 */
var REVIEW_CARDS = {
  ORDER_FORM_ID: '',

  products: {
    standard: {
      name: 'Standard Review Cards',
      formId: '',
      defaultQty: 10,
      options: [
        { qty: 5,  price: 19 },
        { qty: 10, price: 29, popular: true },
        { qty: 20, price: 49 }
      ]
    },
    branded: {
      name: 'Custom Branded Review Cards',
      formId: '',
      defaultQty: 10,
      askForLogo: true,
      options: [
        { qty: 5,  price: 49 },
        { qty: 10, price: 79, popular: true },
        { qty: 20, price: 129 }
      ]
    }
  },

  // Hidden field query keys in the GoHighLevel order form
  fieldKeys: {
    summary: 'order_summary',
    type: 'card_type',
    qty: 'card_quantity',
    price: 'card_price'
  },

  contact: { email: 'hello@reviewmore.co.uk', tel: '07863771540', phone: '07863 771540' }
};
/* =================================================================== */

(function () {
  var cfg = REVIEW_CARDS;
  var selection = {};   // product id -> selected option
  var current = null;   // product id open in the order form

  function money(n) {
    return '£' + (Number.isInteger(n) ? n : n.toFixed(2));
  }
  function perCard(opt) {
    return '£' + (opt.price / opt.qty).toFixed(2) + ' per card';
  }
  function orderLine(id) {
    var opt = selection[id];
    return opt.qty + ' ' + cfg.products[id].name;
  }
  function orderSummary(id) {
    return 'CARD ORDER: ' + orderLine(id) + ' - ' + money(selection[id].price);
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
      priceMeta.textContent = opt.qty + ' cards · ' + perCard(opt);
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
        '<span class="qty-num">' + opt.qty + ' cards</span>' +
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
  var embedLoaded = false;

  function ghlForm(id) {
    var product = cfg.products[id];
    var formId = product.formId || cfg.ORDER_FORM_ID;
    var keys = cfg.fieldKeys;
    var opt = selection[id];

    var params = new URLSearchParams();
    params.set(keys.summary, orderSummary(id));
    params.set(keys.type, product.name);
    params.set(keys.qty, String(opt.qty));
    params.set(keys.price, money(opt.price));

    var iframe = document.createElement('iframe');
    iframe.src = 'https://api.leadconnectorhq.com/widget/form/' + formId + '?' + params.toString();
    iframe.id = 'inline-' + formId;
    iframe.title = 'Review Card order form';
    iframe.style.cssText = 'width:100%;height:100%;min-height:640px;border:none;border-radius:4px';
    iframe.setAttribute('data-layout', "{'id':'INLINE'}");
    iframe.setAttribute('data-trigger-type', 'alwaysShow');
    iframe.setAttribute('data-activation-type', 'alwaysActivated');
    iframe.setAttribute('data-deactivation-type', 'neverDeactivate');
    iframe.setAttribute('data-form-name', 'ReviewMore Card Order');
    iframe.setAttribute('data-height', '640');
    iframe.setAttribute('data-layout-iframe-id', 'inline-' + formId);
    iframe.setAttribute('data-form-id', formId);
    formArea.appendChild(iframe);

    // GoHighLevel's embed script sizes the form to fit its fields
    if (!embedLoaded) {
      var s = document.createElement('script');
      s.src = 'https://link.msgsndr.com/js/form_embed.js';
      document.body.appendChild(s);
      embedLoaded = true;
    }
  }

  // Used until a GoHighLevel order form is set up
  function fallback(id) {
    var opt = selection[id];
    var subject = orderSummary(id);
    var body = [
      'CARD ORDER',
      '',
      'Card type: ' + cfg.products[id].name,
      'Quantity: ' + opt.qty,
      'Price: ' + money(opt.price),
      '',
      'Business name: ',
      'Your name: ',
      'Phone number: ',
      'Additional notes: ',
      ''
    ].join('\n');
    var mailto = 'mailto:' + cfg.contact.email +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    formArea.innerHTML =
      '<div class="order-fallback">' +
        '<p>Send us your order and we\'ll confirm everything with you.</p>' +
        '<a class="btn btn-big btn-block" href="' + mailto + '">Email this order</a>' +
        '<a class="btn btn-big btn-block btn-outline" href="tel:' + cfg.contact.tel + '">Call/Text ' + cfg.contact.phone + '</a>' +
      '</div>';
  }

  function openOrder(id) {
    current = id;
    var product = cfg.products[id];
    dialog.querySelector('[data-order-line]').textContent = orderLine(id);
    dialog.querySelector('[data-order-price]').textContent = money(selection[id].price);
    dialog.querySelector('[data-logo-note]').hidden = !product.askForLogo;

    formArea.innerHTML = '';
    if (product.formId || cfg.ORDER_FORM_ID) ghlForm(id); else fallback(id);

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
    formArea.innerHTML = '';
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
