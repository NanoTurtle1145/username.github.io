/* ============================================================
   双曲播放页 — 交互
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 曲目数据 ---------- */
  var TRACKS = [
    {
      title:  '杭州第七中学校歌',
      sub:    '司凤版',
      eyebrow:'SONG 01 / 02',
      theme:  'gold',
      src:    'assets/song1.mp4',
      cover:  'assets/cover1-900.jpg',
      srcset: 'assets/cover1-400.jpg 400w, assets/cover1-900.jpg 900w, assets/cover1.jpg 1920w',
      bg:     'assets/cover1-900.jpg',
      alt:    '封面：杭州第七中学校歌 司凤版',
      meta:   '司凤版'
    },
    {
      title:  '东南苦行山',
      sub:    '⚡️ 摇滚版 ⚡️',
      eyebrow:'SONG 02 / 02',
      theme:  'fire',
      src:    'assets/song2.mp4',
      cover:  'assets/cover2-900.jpg',
      srcset: 'assets/cover2-400.jpg 400w, assets/cover2-900.jpg 900w, assets/cover2.jpg 1920w',
      bg:     'assets/cover2-900.jpg',
      alt:    '封面：烈焰中弹奏的吉他手',
      meta:   '摇滚版 · 牢蒋の小曲 Level 1'
    }
  ];

  /* ---------- DOM ---------- */
  var audio    = document.getElementById('audio');
  var playBtn  = document.getElementById('play');
  var disc     = document.getElementById('disc');
  var discCover= document.getElementById('discCover');
  var track    = document.getElementById('track');
  var fill     = document.getElementById('fill');
  var dot      = document.getElementById('dot');
  var curEl    = document.getElementById('cur');
  var durEl    = document.getElementById('dur');
  var hintEl   = document.getElementById('hint');
  var fallback = document.getElementById('fallback');
  var fbLink   = document.getElementById('fallbackLink');
  var wave     = document.getElementById('wave');
  var eyebrow  = document.getElementById('eyebrow');
  var titleCn  = document.getElementById('titleCn');
  var titleEn  = document.getElementById('titleEn');
  var subEl    = document.getElementById('sub');
  var bgImg    = document.getElementById('bgImg');
  var listEl   = document.getElementById('list');
  var prevBtn  = document.getElementById('prev');
  var nextBtn  = document.getElementById('next');
  var autoNext = document.getElementById('autonext');
  var items    = Array.prototype.slice.call(listEl.querySelectorAll('.list__item'));
  var body     = document.body;

  var current  = 0;
  var dragging = false;
  var swapTimer = null;

  /* ---------- 工具 ---------- */
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function setHint(text) {
    if (text) {
      hintEl.textContent = text;
      hintEl.style.opacity = '1';
    } else {
      hintEl.style.opacity = '0';
    }
  }

  function preloadAll() {
    TRACKS.forEach(function (t) {
      var i = new Image();
      i.src = t.cover;
    });
  }

  /* ---------- 渲染曲目信息 ---------- */
  function renderTrack(i) {
    var t = TRACKS[i];

    body.setAttribute('data-theme', t.theme);

    eyebrow.textContent = t.eyebrow;
    titleCn.textContent = t.title;
    titleEn.textContent = t.sub;
    subEl.textContent   = i === 0 ? '点一下封面，开唱。' : '吉他起，火起。按一下就开。';

    discCover.src    = t.cover;
    discCover.srcset = t.srcset;
    discCover.alt    = t.alt;

    bgImg.style.backgroundImage = 'url("' + t.bg + '")';

    fbLink.href = t.src;

    document.title = t.title + ' · ' + t.sub;

    items.forEach(function (el, idx) {
      var on = idx === i;
      el.classList.toggle('is-active', on);
      if (on) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });

    // 视觉淡入
    body.classList.add('is-swapping');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      body.classList.remove('is-swapping');
    }, 340);
  }

  /* ---------- 切歌 ---------- */
  function loadTrack(i, autoplay) {
    current = (i + TRACKS.length) % TRACKS.length;
    var t = TRACKS[current];

    fallback.hidden = true;
    dragging = false;
    fill.style.width = '0%';
    dot.style.left = '0%';
    curEl.textContent = '0:00';
    durEl.textContent = '0:00';
    track.setAttribute('aria-valuenow', '0');

    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio.src = t.src;

    renderTrack(current);

    if (autoplay) start();
    else setHint('点播放键开始');
  }

  function next(autoplay) { loadTrack(current + 1, autoplay); }
  function prev() {
    // 播放超过 3 秒就回到本曲开头，否则切上一首
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      render();
      return;
    }
    loadTrack(current - 1, !audio.paused);
  }

  /* ---------- 播放控制 ---------- */
  function start() {
    var p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function (err) {
        setHint('播放被拦住了，再点一次试试');
        console.warn('play() 失败：', err);
      });
    }
  }

  function toggle() {
    if (audio.paused) start();
    else audio.pause();
  }

  /* ---------- 时长 ---------- */
  function syncDuration() {
    if (isFinite(audio.duration) && audio.duration > 0) {
      durEl.textContent = fmt(audio.duration);
    }
  }

  /* ---------- 进度渲染 ---------- */
  function render() {
    var d = audio.duration;
    if (!isFinite(d) || d <= 0) return;
    var p = Math.min(1, Math.max(0, audio.currentTime / d));
    var pct = (p * 100).toFixed(3) + '%';
    fill.style.width = pct;
    dot.style.left = pct;
    track.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    curEl.textContent = fmt(audio.currentTime);
  }

  /* ---------- 拖拽 / 点击跳转 ---------- */
  function seekFromEvent(e) {
    var d = audio.duration;
    if (!isFinite(d) || d <= 0) return null;
    var r = track.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    var p = Math.min(1, Math.max(0, x / r.width));
    fill.style.width = (p * 100).toFixed(3) + '%';
    dot.style.left = (p * 100).toFixed(3) + '%';
    curEl.textContent = fmt(p * d);
    return p * d;
  }

  function onDown(e) {
    dragging = true;
    if (e.pointerId != null && track.setPointerCapture) {
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    }
    seekFromEvent(e);
    e.preventDefault();
  }
  function onMove(e) { if (dragging) seekFromEvent(e); }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    var t = seekFromEvent(e);
    if (typeof t === 'number') audio.currentTime = t;
    render();
  }

  /* ---------- 绑定 ---------- */
  playBtn.addEventListener('click', toggle);
  disc.addEventListener('click', toggle);
  disc.style.cursor = 'pointer';

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', function () { next(true); });

  items.forEach(function (el, idx) {
    el.addEventListener('click', function () {
      if (idx === current) toggle();
      else loadTrack(idx, true);
    });
  });

  audio.addEventListener('loadedmetadata', syncDuration);
  audio.addEventListener('durationchange', syncDuration);
  audio.addEventListener('timeupdate', function () { if (!dragging) render(); });
  audio.addEventListener('seeked', render);

  track.addEventListener('pointerdown', onDown);
  track.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  track.addEventListener('keydown', function (e) {
    var d = audio.duration || 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      audio.currentTime = Math.min(d, audio.currentTime + 5); e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault();
    } else if (e.key === 'Home') {
      audio.currentTime = 0; e.preventDefault();
    } else if (e.key === 'End') {
      audio.currentTime = d; e.preventDefault();
    }
  });

  audio.addEventListener('play', function () {
    body.classList.add('is-playing');
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.setAttribute('aria-label', '暂停');
    wave.hidden = false;
    setHint('');
  });

  audio.addEventListener('pause', function () {
    body.classList.remove('is-playing');
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.setAttribute('aria-label', '播放');
  });

  /* 播完：自动连播 or 停下 */
  audio.addEventListener('ended', function () {
    body.classList.remove('is-playing');
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.setAttribute('aria-label', '播放');

    if (autoNext.checked) {
      next(true);
    } else {
      setHint('本曲结束 · 点下一首');
    }
  });

  audio.addEventListener('error', function () {
    fallback.hidden = false;
    setHint('音频加载失败');
  });

  /* 键盘：空格播放/暂停，←/→ 上下曲 */
  document.addEventListener('keydown', function (e) {
    if (e.target !== document.body) return;
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault(); toggle();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); next(true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); loadTrack(current - 1, !audio.paused);
    }
  });

  /* ---------- 光尘粒子 ---------- */
  var host = document.querySelector('.sparks');
  if (host && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var n = window.innerWidth < 640 ? 16 : 30;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'spark';
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.setProperty('--dx', (Math.random() * 160 - 80).toFixed(0) + 'px');
      s.style.animationDuration = (8 + Math.random() * 10).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 16).toFixed(1) + 's';
      var size = (1.5 + Math.random() * 2.4).toFixed(1);
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      frag.appendChild(s);
    }
    host.appendChild(frag);
  }

  /* ---------- 初始化 ---------- */
  loadTrack(0, false);
  preloadAll();
})();
