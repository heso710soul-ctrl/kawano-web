/* ============================================================
   スマホのときだけ、見出しをタップで開くアコーディオンにする
   使い方：閉じたい <section> に data-fold をつけるだけ。
   ・中の .section__title（見出し）がボタンになり、
     それ以外の中身はスマホ幅（760px以下）のときだけ閉じます。
   ・PC幅ではいつも開いたまま（ボタンも見た目は普通の見出し）。
   ・メニューなどから #id で飛んできたときは、その部分を自動で開きます。
   ============================================================ */
(function () {
  const sections = Array.prototype.slice.call(document.querySelectorAll('section[data-fold]'));
  if (!sections.length) return;
  const mq = window.matchMedia('(max-width: 760px)');

  const items = sections.map(function (sec, i) {
    const title = sec.querySelector('.section__title');
    if (!title) return null;

    // 見出し以外の中身を集める（見出しが入れ子になっていても、その周りを全部）
    const content = [];
    let node = title;
    while (node && node !== sec) {
      const parent = node.parentElement;
      Array.prototype.forEach.call(parent.children, function (child) {
        if (child !== node) content.push(child);
      });
      node = parent;
    }

    // 見出しの文字をボタンで包む
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fold__toggle';
    const label = document.createElement('span');
    label.className = 'fold__label';
    while (title.firstChild) label.appendChild(title.firstChild);
    const hint = document.createElement('span');
    hint.className = 'fold__hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = 'タップで開く';
    const icon = document.createElement('span');
    icon.className = 'fold__icon';
    icon.setAttribute('aria-hidden', 'true');
    btn.append(label, hint, icon);
    title.appendChild(btn);

    const item = { sec: sec, btn: btn, content: content, open: false };
    btn.addEventListener('click', function () {
      if (!mq.matches) return;
      setOpen(item, !item.open);
    });
    return item;
  }).filter(Boolean);

  function apply(item) {
    const folded = mq.matches && !item.open;
    item.sec.classList.toggle('is-folded', folded);
    item.sec.classList.toggle('is-foldable', mq.matches);
    item.content.forEach(function (el) { el.classList.toggle('fold-hide', folded); });
    if (mq.matches) {
      item.btn.setAttribute('aria-expanded', String(item.open));
      item.btn.removeAttribute('tabindex');
    } else {
      // PCでは普通の見出しとして扱う（ボタンとしては押せない）
      item.btn.removeAttribute('aria-expanded');
      item.btn.tabIndex = -1;
    }
  }
  function setOpen(item, open) { item.open = open; apply(item); }
  function applyAll() { items.forEach(apply); }

  // #id で指された場所が閉じた部分の中なら開く
  function openFor(hash) {
    if (!hash || hash.length < 2) return;
    let target = null;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) {}
    if (!target) return;
    items.forEach(function (item) {
      if (item.sec === target || item.sec.contains(target)) setOpen(item, true);
    });
  }

  applyAll();
  openFor(location.hash);
  if (location.hash) {
    // 開いたぶん位置がずれるので、もう一度その場所へ
    const t = document.getElementById(location.hash.slice(1));
    if (t) requestAnimationFrame(function () { t.scrollIntoView(); });
  }

  // ページ内リンク（メニューなど）を押したとき、先に開いてからスクロールさせる
  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash) openFor(url.hash);
  }, true);
  window.addEventListener('hashchange', function () { openFor(location.hash); });

  if (mq.addEventListener) mq.addEventListener('change', applyAll);
  else if (mq.addListener) mq.addListener(applyAll);
})();
