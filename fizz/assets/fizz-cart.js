(() => {
  if (window.FizzCart) return;

  const root = document.querySelector('[data-fizz-cart]');
  if (!root) return;

  async function changeLine(key, quantity) {
    root.classList.add('fizz-cart__updating');
    try {
      const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart/change.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity }),
      });
      if (!res.ok) throw new Error('Cart update failed');
      window.location.reload();
    } catch {
      root.classList.remove('fizz-cart__updating');
    }
  }

  root.querySelectorAll('[data-fizz-cart-qty]').forEach((wrap) => {
    const key = wrap.dataset.lineKey;
    const input = wrap.querySelector('input');
    const minus = wrap.querySelector('[data-fizz-cart-minus]');
    const plus = wrap.querySelector('[data-fizz-cart-plus]');
    if (!key || !input) return;

    minus?.addEventListener('click', () => {
      const next = Math.max(0, parseInt(input.value, 10) - 1);
      changeLine(key, next);
    });

    plus?.addEventListener('click', () => {
      const next = parseInt(input.value, 10) + 1;
      changeLine(key, next);
    });
  });

  root.querySelectorAll('[data-fizz-cart-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.lineKey;
      if (key) changeLine(key, 0);
    });
  });
})();
