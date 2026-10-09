/* ============================================================
   河野智也｜お店のホームページづくり スクリプト
   1. スマホ用メニューの開閉
   2. お問い合わせフォームの送信
   ============================================================ */

/* ------------------------------------------------------------
   1. スマホ用メニューの開閉
------------------------------------------------------------ */
(function () {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // メニュー内のリンクを押したら閉じる
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  // Escキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
})();

/* ------------------------------------------------------------
   2. お問い合わせフォーム
   送信先は index.html のフォームの data-endpoint（Google Apps Script のURL）です。
   人材育成メンターのサイトと同じ受け口なので、同じGmail・記録シートに届きます。
   届いた内容は Gmail に通知され、スプレッドシートにも記録されます。
------------------------------------------------------------ */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const endpoint = (form.dataset.endpoint || '').trim();
  const fallback = (form.dataset.fallback || '').trim();
  const status = form.querySelector('.contact-form__status');
  const submit = form.querySelector('.contact-form__submit');

  const messages = {
    name: 'お名前を入力してください。',
    email: 'メールアドレスを入力してください。',
    emailFormat: 'メールアドレスの形式をご確認ください（例：name@example.com）。',
    topic: 'ご相談の内容を選んでください。',
    message: 'ご相談内容を入力してください。'
  };

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach((el) => el.remove());
    form.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  }

  function showError(field, text) {
    const wrap = field.closest('.field');
    wrap.classList.add('has-error');
    const p = document.createElement('p');
    p.className = 'field-error';
    p.id = (field.id || field.name) + '-error';
    p.textContent = text;
    wrap.appendChild(p);
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', p.id);
  }

  function validate() {
    clearErrors();
    const errors = [];
    const name = form.elements.name;
    const email = form.elements.email;
    const message = form.elements.message;
    const topicChecked = form.querySelector('input[name="topic"]:checked');

    if (!name.value.trim()) errors.push([name, messages.name]);
    if (!email.value.trim()) errors.push([email, messages.email]);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) errors.push([email, messages.emailFormat]);
    if (!topicChecked) errors.push([form.querySelector('input[name="topic"]'), messages.topic]);
    if (!message.value.trim()) errors.push([message, messages.message]);

    errors.forEach(([field, text]) => showError(field, text));
    if (errors.length) errors[0][0].focus();
    return errors.length === 0;
  }

  function setStatus(html, isError) {
    status.innerHTML = html;
    status.classList.toggle('is-error', !!isError);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // 送信先がまだ設定されていないあいだは、旧フォームを案内する
    if (!endpoint) {
      setStatus(
        'ただいまフォームの準備中です。お手数ですが、' +
        (fallback ? '<a href="' + fallback + '" target="_blank" rel="noopener">こちらのフォーム</a>' : '別の方法') +
        'からお送りください。',
        true
      );
      return;
    }

    const data = new URLSearchParams(new FormData(form));
    data.append('page', location.href);

    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = '送信しています…';
    setStatus('', false);

    try {
      const res = await fetch(endpoint, { method: 'POST', body: data });
      let result = null;
      try { result = await res.json(); } catch (_) { /* 応答が読めない場合は下で判定 */ }
      if (!res.ok || (result && result.ok === false)) throw new Error((result && result.error) || 'send failed');

      const name = form.elements.name.value.trim();
      const done = document.createElement('div');
      done.className = 'contact-done';
      done.setAttribute('tabindex', '-1');
      done.innerHTML =
        '<h3>送信しました。ありがとうございます。</h3>' +
        '<p></p>' +
        '<p>内容を拝見して、河野からメールでご連絡します。数日たっても返信がない場合は、お手数ですがもう一度お送りいただくか、迷惑メールフォルダをご確認ください。</p>';
      done.querySelector('p').textContent = name + ' 様、お問い合わせを受け付けました。';
      form.replaceChildren(done);
      done.focus();
    } catch (err) {
      submit.disabled = false;
      submit.textContent = label;
      setStatus(
        '送信できませんでした。通信状況をご確認のうえ、もう一度お試しください。' +
        (fallback ? 'うまくいかない場合は<a href="' + fallback + '" target="_blank" rel="noopener">こちらのフォーム</a>からもお送りいただけます。' : ''),
        true
      );
    }
  });
})();
