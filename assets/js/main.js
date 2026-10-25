/* Alcovea — main.js */
(function () {
  'use strict';

  var panel = document.getElementById('navMobilePanel');
  var overlay = document.querySelector('.site-nav__overlay');
  var toggle = document.querySelector('[data-nav-toggle]');

  function setNav(open) {
    if (!panel) { return; }
    panel.classList.toggle('is-open', open);
    if (overlay) { overlay.classList.toggle('is-open', open); }
    document.body.classList.toggle('is-locked', open);
    if (toggle) { toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(!panel.classList.contains('is-open'));
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-nav-close]'), function (el) {
    el.addEventListener('click', function () { setNav(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setNav(false); }
  });

  /* Form validation. Markup-driven: a field is checked because it carries
     `required`, and its message is the .field__msg with data-msg-for pointing
     at the control's id or name. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-validate]'), function (form) {
    var ok = form.querySelector('[data-form-ok]');

    function messageFor(control) {
      var key = control.id || control.name;
      return form.querySelector('[data-msg-for="' + key + '"]');
    }

    function setState(control, bad) {
      var msg = messageFor(control);
      if (msg) { msg.classList.toggle('is-shown', bad); }
      if (control.classList.contains('field__i')) {
        control.classList.toggle('is-bad', bad);
      }
      control.setAttribute('aria-invalid', bad ? 'true' : 'false');
    }

    function check(control) {
      var bad = !control.checkValidity();
      setState(control, bad);
      return !bad;
    }

    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (control) {
      control.addEventListener('blur', function () { check(control); });
      control.addEventListener('input', function () {
        if (control.getAttribute('aria-invalid') === 'true') { check(control); }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (control) {
        if (!check(control) && !first) { first = control; }
      });
      if (first) { first.focus(); return; }
      if (ok) { ok.hidden = false; }
      form.reset();
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (c) {
        setState(c, false);
      });
    });
  });

  /* Lightbox. Buttons with data-photo open the photo in a dialog, stepping
     through every photo that shares its data-group. Buttons with data-video
     open the YouTube embed. Opened from file://, YouTube refuses the embed,
     so a note with a link to the video is shown instead. */
  var box = null;
  var opener = null;
  var set = [];
  var at = 0;

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    if (text) { node.textContent = text; }
    return node;
  }

  function closeBox() {
    if (!box) { return; }
    box.parentNode.removeChild(box);
    box = null;
    document.body.classList.remove('is-locked');
    if (opener) { opener.focus(); }
  }

  function openBox(label, content, paged) {
    closeBox();
    box = make('div', 'lbox position-fixed top-0 bottom-0 start-0 end-0 d-grid');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', label);
    box.appendChild(content);
    if (paged) {
      var prev = make('button', 'lbox__btn lbox__prev position-absolute d-inline-flex align-items-center justify-content-center p-0 lh-1', '\u2190');
      var next = make('button', 'lbox__btn lbox__next position-absolute d-inline-flex align-items-center justify-content-center p-0 lh-1', '\u2192');
      prev.type = next.type = 'button';
      prev.setAttribute('aria-label', 'Previous photo');
      next.setAttribute('aria-label', 'Next photo');
      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1); });
      box.appendChild(prev);
      box.appendChild(next);
    }
    var close = make('button', 'lbox__btn lbox__close position-absolute d-inline-flex align-items-center justify-content-center p-0 lh-1', '\u00d7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', closeBox);
    box.appendChild(close);
    box.addEventListener('click', function (e) { if (e.target === box) { closeBox(); } });
    document.body.appendChild(box);
    document.body.classList.add('is-locked');
    close.focus();
  }

  function photoFigure(btn) {
    var fig = make('figure', 'lbox__fig d-grid mw-100 m-0');
    var img = make('img', 'lbox__img d-block mw-100 w-auto h-auto object-fit-contain');
    var src = btn.closest('figure') ? btn.closest('figure').querySelector('img') : null;
    var cap = btn.closest('figure') ? btn.closest('figure').querySelector('figcaption') : null;
    img.src = btn.getAttribute('data-photo');
    img.alt = src ? src.alt : '';
    fig.appendChild(img);
    var text = make('figcaption', 'lbox__cap text-center text-uppercase');
    if (set.length > 1) { text.appendChild(make('span', 'lbox__count', (at + 1) + ' / ' + set.length)); }
    text.appendChild(document.createTextNode(cap ? cap.textContent.replace(/\s+/g, ' ').trim() : img.alt));
    fig.appendChild(text);
    return fig;
  }

  function showPhoto() {
    var btn = set[at];
    if (box) {
      var old = box.querySelector('.lbox__fig');
      old.parentNode.replaceChild(photoFigure(btn), old);
      return;
    }
    openBox('Photo', photoFigure(btn), set.length > 1);
  }

  function step(dir) {
    at = (at + dir + set.length) % set.length;
    showPhoto();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-photo]'), function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.getAttribute('data-group');
      set = group ? Array.prototype.slice.call(document.querySelectorAll('[data-photo][data-group="' + group + '"]')) : [btn];
      at = set.indexOf(btn);
      opener = btn;
      showPhoto();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-video]'), function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-video');
      var frame = make('div', 'lbox__frame');
      set = [];
      opener = btn;
      if (window.location.protocol === 'file:') {
        var id = (url.match(/embed\/([\w-]+)/) || [])[1] || '';
        var note = make('div', 'lbox__note d-grid gap-3 h-100 text-center');
        var link = make('a', 'btn-a btn-a--plaster', 'Watch on YouTube');
        link.href = 'https://www.youtube.com/watch?v=' + id;
        link.target = '_blank';
        link.rel = 'noopener';
        note.appendChild(make('p', 'lbox__note-t m-0 fw-bold', 'The video plays once the site is on a web server.'));
        note.appendChild(make('p', 'lbox__note-p m-0', 'YouTube does not play inside a page opened straight from your computer. Upload the site, or preview it with a local server, and it plays right here.'));
        note.appendChild(link);
        frame.classList.add('lbox__frame--note');
        frame.appendChild(note);
      } else {
        var iframe = make('iframe');
        iframe.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1&rel=0';
        iframe.title = btn.textContent.trim() || 'Video';
        iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        frame.appendChild(iframe);
      }
      openBox('Video', frame, false);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!box) { return; }
    if (e.key === 'Escape') { closeBox(); }
    if (set.length > 1 && e.key === 'ArrowLeft') { step(-1); }
    if (set.length > 1 && e.key === 'ArrowRight') { step(1); }
  });

  /* Reveal on scroll. The class is added by script, so a page with JS turned
     off (or an old browser) simply shows everything. */
  var blocks = document.querySelectorAll('[data-reveal]');

  if (blocks.length && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('has-reveal');

    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-in');
        seen.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(blocks, function (el) { seen.observe(el); });

    /* Anything already in view on load rises immediately rather than waiting
       for a scroll that may never come. */
    window.setTimeout(function () {
      Array.prototype.forEach.call(blocks, function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-in');
          seen.unobserve(el);
        }
      });
    }, 60);
  }
}());
