/**
 * videoplayer.js — Player vidéo pro & réutilisable
 * -------------------------------------------------
 * Supporte : fichiers locaux (.mp4, .webm, .ogg) et vidéos YouTube
 * @version 1.0.0
 *
 * USAGE RAPIDE :
 *   import { createVideoPlayer } from './videoplayer.js';
 *
 *   createVideoPlayer(document.getElementById('player'), {
 *     src: 'video.mp4',          // fichier local
 *     // ou
 *     src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // YouTube
 *     title: 'Mon film',
 *     accentColor: '#ff6b35',
 *   });
 */

// ── YouTube IFrame API (chargée une seule fois) ──────────────────────────────
let ytApiReady = false;
let ytApiLoading = false;
const ytReadyCallbacks = [];

function loadYouTubeAPI() {
  if (ytApiReady || ytApiLoading) return;
  ytApiLoading = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  ytApiReady = true;
  ytReadyCallbacks.forEach(cb => cb());
  ytReadyCallbacks.length = 0;
};

function onYTReady(cb) {
  if (ytApiReady) cb();
  else { ytReadyCallbacks.push(cb); loadYouTubeAPI(); }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/,
    /youtube\.com\/shorts\/([^&?/\s]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isYouTubeUrl(src) {
  return /youtube\.com|youtu\.be/.test(src);
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ── SVG icons ────────────────────────────────────────────────────────────────
const ICONS = {
  play:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  mute:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
  unmute:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
  fullscreen:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
  exitFs:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`,
  pip:      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3C1.9 3 1 3.88 1 4.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
  rewind:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>`,
  forward:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>`,
};

// ── createVideoPlayer ─────────────────────────────────────────────────────────
/**
 * @param {HTMLElement} container   - L'élément DOM cible
 * @param {Object}      options
 *
 * OPTIONS :
 * @param {string}   src              - URL fichier vidéo OU lien YouTube (obligatoire)
 * @param {string}   [title]          - Titre affiché en overlay
 * @param {string}   [poster]         - Image de poster (fichiers locaux uniquement)
 * @param {string}   [accentColor]    - Couleur d'accent principale (défaut: '#e63946')
 * @param {string}   [theme]          - 'dark' | 'light' (défaut: 'dark')
 * @param {boolean}  [autoplay]       - Autoplay (défaut: false)
 * @param {boolean}  [muted]          - Muet au démarrage (défaut: false)
 * @param {boolean}  [loop]           - Lecture en boucle (défaut: false)
 * @param {number}   [volume]         - Volume initial 0-1 (défaut: 1)
 * @param {number}   [startTime]      - Temps de départ en secondes (défaut: 0)
 * @param {number}   [skipSeconds]    - Secondes par saut rewind/forward (défaut: 10)
 * @param {boolean}  [controls]       - Affiche les contrôles (défaut: true)
 * @param {boolean}  [showTitle]      - Affiche le titre (défaut: true)
 * @param {boolean}  [showPip]        - Bouton Picture-in-Picture (défaut: true)
 * @param {boolean}  [showSettings]   - Bouton vitesse de lecture (défaut: true)
 * @param {boolean}  [keyboard]       - Raccourcis clavier (défaut: true)
 * @param {number[]} [playbackRates]  - Vitesses dispo (défaut: [0.5,0.75,1,1.25,1.5,2])
 * @param {Function} [onPlay]         - Callback à la lecture
 * @param {Function} [onPause]        - Callback à la pause
 * @param {Function} [onEnded]        - Callback à la fin
 * @param {Function} [onTimeUpdate]   - Callback(currentTime, duration)
 * @param {Function} [onReady]        - Callback quand le player est prêt
 *
 * @returns {Object} Contrôleur — { play(), pause(), seek(s), setVolume(v),
 *                                  setPlaybackRate(r), destroy(), getTime(),
 *                                  getDuration() }
 */
function createVideoPlayer(container, options = {}) {
  const cfg = {
    src:            options.src            ?? '',
    title:          options.title          ?? '',
    poster:         options.poster         ?? '',
    accentColor:    options.accentColor    ?? '#e63946',
    theme:          options.theme          ?? 'dark',
    autoplay:       options.autoplay       ?? false,
    muted:          options.muted          ?? false,
    loop:           options.loop           ?? false,
    volume:         options.volume         ?? 1,
    startTime:      options.startTime      ?? 0,
    skipSeconds:    options.skipSeconds    ?? 10,
    controls:       options.controls       ?? true,
    showTitle:      options.showTitle      ?? true,
    showPip:        options.showPip        ?? true,
    showSettings:   options.showSettings   ?? true,
    keyboard:       options.keyboard       ?? true,
    playbackRates:  options.playbackRates  ?? [0.5, 0.75, 1, 1.25, 1.5, 2],
    onPlay:         options.onPlay         ?? null,
    onPause:        options.onPause        ?? null,
    onEnded:        options.onEnded        ?? null,
    onTimeUpdate:   options.onTimeUpdate   ?? null,
    onReady:        options.onReady        ?? null,
  };

  const isYT = isYouTubeUrl(cfg.src);
  const ytId  = isYT ? extractYouTubeId(cfg.src) : null;

  // ── DOM ───────────────────────────────────────────────────────────────────
  container.innerHTML = '';
  container.classList.add('vp-container');
  container.setAttribute('tabindex', '0');

  // Inject CSS variables
  container.style.setProperty('--vp-accent', cfg.accentColor);
  container.style.setProperty('--vp-theme-bg',
    cfg.theme === 'light' ? '#f0f0f0' : '#0a0a0c');
  container.style.setProperty('--vp-theme-ctrl',
    cfg.theme === 'light' ? 'rgba(0,0,0,0.85)' : 'rgba(10,10,15,0.9)');
  container.style.setProperty('--vp-theme-text',
    cfg.theme === 'light' ? '#111' : '#fff');

  // Wrapper
  const wrap = document.createElement('div');
  wrap.className = 'vp-wrap';

  // Media zone
  const mediaZone = document.createElement('div');
  mediaZone.className = 'vp-media';

  let videoEl = null;
  let ytPlayer = null;

  if (!isYT) {
    // ── Fichier local ────────────────────────────────────────────────────────
    videoEl = document.createElement('video');
    videoEl.className = 'vp-video';
    videoEl.src = cfg.src;
    videoEl.muted = cfg.muted;
    videoEl.loop = cfg.loop;
    videoEl.volume = cfg.volume;
    if (cfg.poster) videoEl.poster = cfg.poster;
    if (cfg.autoplay) videoEl.autoplay = true;
    mediaZone.appendChild(videoEl);
  } else {
    // ── YouTube ──────────────────────────────────────────────────────────────
    const ytDiv = document.createElement('div');
    ytDiv.className = 'vp-yt-frame';
    ytDiv.id = `vp-yt-${Date.now()}`;
    mediaZone.appendChild(ytDiv);
  }

  wrap.appendChild(mediaZone);

  // Overlay click (play/pause)
  const clickZone = document.createElement('div');
  clickZone.className = 'vp-click-zone';
  wrap.appendChild(clickZone);

  // Big play indicator
  const bigPlay = document.createElement('div');
  bigPlay.className = 'vp-big-play';
  bigPlay.innerHTML = ICONS.play;
  wrap.appendChild(bigPlay);

  // Gradient overlay
  const gradient = document.createElement('div');
  gradient.className = 'vp-gradient';
  wrap.appendChild(gradient);

  // Title
  if (cfg.title && cfg.showTitle) {
    const titleEl = document.createElement('div');
    titleEl.className = 'vp-title';
    titleEl.textContent = cfg.title;
    wrap.appendChild(titleEl);
  }



  // ── Contrôles ─────────────────────────────────────────────────────────────
  let controlsEl = null;
  let progressBar, progressFill, progressThumb, progressBuffered;
  let btnPlay, btnRewind, btnForward;
  let timeEl, durationEl;
  let btnMute, volumeBar, volumeFill;
  let btnPip, btnFs, btnSettings;
  let settingsPanel;
  let isFs = false;
  let settingsOpen = false;

  if (cfg.controls) {
    controlsEl = document.createElement('div');
    controlsEl.className = 'vp-controls';

    // Progress
    const progressWrap = document.createElement('div');
    progressWrap.className = 'vp-progress-wrap';
    progressBuffered = document.createElement('div');
    progressBuffered.className = 'vp-progress-buffered';
    progressFill = document.createElement('div');
    progressFill.className = 'vp-progress-fill';
    progressThumb = document.createElement('div');
    progressThumb.className = 'vp-progress-thumb';
    progressBar = document.createElement('div');
    progressBar.className = 'vp-progress';
    progressBar.appendChild(progressBuffered);
    progressBar.appendChild(progressFill);
    progressBar.appendChild(progressThumb);
    progressWrap.appendChild(progressBar);
    controlsEl.appendChild(progressWrap);

    // Bottom row
    const row = document.createElement('div');
    row.className = 'vp-row';

    // Left group
    const left = document.createElement('div');
    left.className = 'vp-group';

    btnRewind = document.createElement('button');
    btnRewind.className = 'vp-btn';
    btnRewind.innerHTML = ICONS.rewind;
    btnRewind.title = `Reculer ${cfg.skipSeconds}s`;

    btnPlay = document.createElement('button');
    btnPlay.className = 'vp-btn vp-btn-play';
    btnPlay.innerHTML = ICONS.play;
    btnPlay.title = 'Lecture / Pause';

    btnForward = document.createElement('button');
    btnForward.className = 'vp-btn';
    btnForward.innerHTML = ICONS.forward;
    btnForward.title = `Avancer ${cfg.skipSeconds}s`;

    // Volume
    const volGroup = document.createElement('div');
    volGroup.className = 'vp-vol-group';
    btnMute = document.createElement('button');
    btnMute.className = 'vp-btn';
    btnMute.innerHTML = ICONS.unmute;
    btnMute.title = 'Muet';
    volumeBar = document.createElement('div');
    volumeBar.className = 'vp-vol-bar';
    volumeFill = document.createElement('div');
    volumeFill.className = 'vp-vol-fill';
    volumeBar.appendChild(volumeFill);
    volGroup.appendChild(btnMute);
    volGroup.appendChild(volumeBar);

    // Time
    const timeGroup = document.createElement('div');
    timeGroup.className = 'vp-time';
    timeEl = document.createElement('span');
    timeEl.textContent = '0:00';
    const sep = document.createElement('span');
    sep.textContent = ' / ';
    sep.className = 'vp-sep';
    durationEl = document.createElement('span');
    durationEl.textContent = '0:00';
    timeGroup.appendChild(timeEl);
    timeGroup.appendChild(sep);
    timeGroup.appendChild(durationEl);

    left.appendChild(btnRewind);
    left.appendChild(btnPlay);
    left.appendChild(btnForward);
    left.appendChild(volGroup);
    left.appendChild(timeGroup);

    // Right group
    const right = document.createElement('div');
    right.className = 'vp-group';

    if (cfg.showSettings) {
      btnSettings = document.createElement('button');
      btnSettings.className = 'vp-btn';
      btnSettings.innerHTML = ICONS.settings;
      btnSettings.title = 'Vitesse';

      settingsPanel = document.createElement('div');
      settingsPanel.className = 'vp-settings';
      settingsPanel.innerHTML = `<div class="vp-settings-title">Vitesse</div>` +
        cfg.playbackRates.map(r =>
          `<button class="vp-rate-btn${r === 1 ? ' active' : ''}" data-rate="${r}">${r === 1 ? 'Normal' : r + 'x'}</button>`
        ).join('');
      wrap.appendChild(settingsPanel);

      right.appendChild(btnSettings);
    }

    if (cfg.showPip && document.pictureInPictureEnabled && !isYT) {
      btnPip = document.createElement('button');
      btnPip.className = 'vp-btn';
      btnPip.innerHTML = ICONS.pip;
      btnPip.title = 'Picture-in-Picture';
      right.appendChild(btnPip);
    }

    btnFs = document.createElement('button');
    btnFs.className = 'vp-btn';
    btnFs.innerHTML = ICONS.fullscreen;
    btnFs.title = 'Plein écran';
    right.appendChild(btnFs);

    row.appendChild(left);
    row.appendChild(right);
    controlsEl.appendChild(row);
    wrap.appendChild(controlsEl);
  }

  container.appendChild(wrap);

  // ── État interne ──────────────────────────────────────────────────────────
  let playing = false;
  let currentMuted = cfg.muted;
  let currentVolume = cfg.volume;
  let hideTimer = null;
  let draggingProgress = false;
  let draggingVolume = false;

  function getMedia() {
    if (!isYT) return videoEl;
    return ytPlayer;
  }

  function getDuration() {
    if (!isYT) return videoEl?.duration || 0;
    return ytPlayer?.getDuration?.() || 0;
  }

  function getCurrentTime() {
    if (!isYT) return videoEl?.currentTime || 0;
    return ytPlayer?.getCurrentTime?.() || 0;
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  function setPlaying(state) {
    playing = state;
    if (btnPlay) btnPlay.innerHTML = state ? ICONS.pause : ICONS.play;
  }

  function updateProgress() {
    const dur = getDuration();
    const cur = getCurrentTime();
    if (!dur) return;
    const pct = (cur / dur) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressThumb) progressThumb.style.left = pct + '%';
    if (timeEl) timeEl.textContent = formatTime(cur);
    if (!isYT && videoEl && progressBuffered && videoEl.buffered.length > 0) {
      const buf = (videoEl.buffered.end(videoEl.buffered.length - 1) / dur) * 100;
      progressBuffered.style.width = buf + '%';
    }
    cfg.onTimeUpdate?.(cur, dur);
  }

  function updateVolume() {
    const v = currentMuted ? 0 : currentVolume;
    if (volumeFill) volumeFill.style.width = (v * 100) + '%';
    if (btnMute) btnMute.innerHTML = currentMuted || currentVolume === 0 ? ICONS.mute : ICONS.unmute;
    if (!isYT && videoEl) {
      videoEl.volume = currentVolume;
      videoEl.muted = currentMuted;
    } else if (ytPlayer) {
      if (currentMuted) ytPlayer.mute?.();
      else { ytPlayer.unMute?.(); ytPlayer.setVolume?.(currentVolume * 100); }
    }
  }

  function showBigPlay() {
    bigPlay.classList.add('visible');
    setTimeout(() => bigPlay.classList.remove('visible'), 600);
  }

  function showControls() {
    if (controlsEl) controlsEl.classList.add('visible');
    if (cfg.title && cfg.showTitle) {
      container.querySelector('.vp-title')?.classList.add('visible');
    }
    clearTimeout(hideTimer);
    if (playing) {
      hideTimer = setTimeout(hideControls, 3000);
    }
  }

  function hideControls() {
    if (draggingProgress || draggingVolume || settingsOpen) return;
    if (controlsEl) controlsEl.classList.remove('visible');
    container.querySelector('.vp-title')?.classList.remove('visible');
  }

  // ── Play / Pause ──────────────────────────────────────────────────────────
  function play() {
    if (!isYT) videoEl?.play();
    else ytPlayer?.playVideo?.();
  }

  function pause() {
    if (!isYT) videoEl?.pause();
    else ytPlayer?.pauseVideo?.();
  }

  function togglePlay() {
    if (playing) pause(); else play();
    showBigPlay();
  }

  function seek(seconds) {
    const dur = getDuration();
    const t = clamp(seconds, 0, dur);
    if (!isYT) { if (videoEl) videoEl.currentTime = t; }
    else ytPlayer?.seekTo?.(t, true);
    updateProgress();
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  function progressFromEvent(e) {
    const rect = progressBar.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return clamp(x / rect.width, 0, 1);
  }

  if (progressBar) {
    progressBar.addEventListener('mousedown', e => {
      draggingProgress = true;
      seek(progressFromEvent(e) * getDuration());
    });
    progressBar.addEventListener('touchstart', e => {
      draggingProgress = true;
      seek(progressFromEvent(e) * getDuration());
    }, { passive: true });
  }

  document.addEventListener('mousemove', e => {
    if (!draggingProgress) return;
    seek(progressFromEvent(e) * getDuration());
  });
  document.addEventListener('touchmove', e => {
    if (!draggingProgress) return;
    seek(progressFromEvent(e) * getDuration());
  }, { passive: true });
  document.addEventListener('mouseup', () => { draggingProgress = false; });
  document.addEventListener('touchend', () => { draggingProgress = false; });

  // ── Volume bar ────────────────────────────────────────────────────────────
  function volumeFromEvent(e) {
    const rect = volumeBar.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return clamp(x / rect.width, 0, 1);
  }

  if (volumeBar) {
    volumeBar.addEventListener('mousedown', e => {
      draggingVolume = true;
      currentVolume = volumeFromEvent(e);
      currentMuted = currentVolume === 0;
      updateVolume();
    });
    volumeBar.addEventListener('touchstart', e => {
      draggingVolume = true;
      currentVolume = volumeFromEvent(e);
      updateVolume();
    }, { passive: true });
  }

  document.addEventListener('mousemove', e => {
    if (!draggingVolume) return;
    currentVolume = volumeFromEvent(e);
    currentMuted = currentVolume === 0;
    updateVolume();
  });
  document.addEventListener('mouseup', () => { draggingVolume = false; });

  // ── Boutons ───────────────────────────────────────────────────────────────
  clickZone.addEventListener('click', togglePlay);

  if (btnPlay)    btnPlay.addEventListener('click', togglePlay);
  if (btnRewind)  btnRewind.addEventListener('click', () => seek(getCurrentTime() - cfg.skipSeconds));
  if (btnForward) btnForward.addEventListener('click', () => seek(getCurrentTime() + cfg.skipSeconds));

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      currentMuted = !currentMuted;
      updateVolume();
    });
  }

  if (btnFs) {
    btnFs.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });
    document.addEventListener('fullscreenchange', () => {
      isFs = !!document.fullscreenElement;
      btnFs.innerHTML = isFs ? ICONS.exitFs : ICONS.fullscreen;
    });
  }

  if (btnPip && videoEl) {
    btnPip.addEventListener('click', async () => {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoEl.requestPictureInPicture();
    });
  }

  if (btnSettings && settingsPanel) {
    btnSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsOpen = !settingsOpen;
      settingsPanel.classList.toggle('visible', settingsOpen);
    });

    settingsPanel.querySelectorAll('.vp-rate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rate = parseFloat(btn.dataset.rate);
        if (!isYT && videoEl) videoEl.playbackRate = rate;
        else ytPlayer?.setPlaybackRate?.(rate);
        settingsPanel.querySelectorAll('.vp-rate-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        settingsOpen = false;
        settingsPanel.classList.remove('visible');
      });
    });

    document.addEventListener('click', () => {
      settingsOpen = false;
      settingsPanel?.classList.remove('visible');
    });
  }

  // ── Hover / auto-hide controls ────────────────────────────────────────────
  container.addEventListener('mouseenter', showControls);
  container.addEventListener('mousemove', showControls);
  container.addEventListener('mouseleave', hideControls);
  container.addEventListener('touchstart', showControls, { passive: true });

  // ── Keyboard ──────────────────────────────────────────────────────────────
  if (cfg.keyboard) {
    container.addEventListener('keydown', e => {
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft':   e.preventDefault(); seek(getCurrentTime() - cfg.skipSeconds); break;
        case 'ArrowRight':  e.preventDefault(); seek(getCurrentTime() + cfg.skipSeconds); break;
        case 'ArrowUp':     e.preventDefault(); currentVolume = clamp(currentVolume + 0.1, 0, 1); updateVolume(); break;
        case 'ArrowDown':   e.preventDefault(); currentVolume = clamp(currentVolume - 0.1, 0, 1); updateVolume(); break;
        case 'm':           currentMuted = !currentMuted; updateVolume(); break;
        case 'f':           btnFs?.click(); break;
      }
      showControls();
    });
  }

  // ── Events vidéo locale ───────────────────────────────────────────────────
  if (!isYT && videoEl) {
    videoEl.addEventListener('play',  () => { setPlaying(true);  cfg.onPlay?.(); });
    videoEl.addEventListener('pause', () => { setPlaying(false); cfg.onPause?.(); clearTimeout(hideTimer); showControls(); });
    videoEl.addEventListener('ended', () => { setPlaying(false); cfg.onEnded?.(); showControls(); });
    videoEl.addEventListener('timeupdate', updateProgress);
    videoEl.addEventListener('durationchange', () => {
      if (durationEl) durationEl.textContent = formatTime(videoEl.duration);
    });
    videoEl.addEventListener('loadedmetadata', () => {
      if (cfg.startTime) videoEl.currentTime = cfg.startTime;
      if (durationEl) durationEl.textContent = formatTime(videoEl.duration);
      updateVolume();
      cfg.onReady?.();
    });

    // Double-clic fullscreen
    mediaZone.addEventListener('dblclick', () => btnFs?.click());
  }

  // ── YouTube player init ───────────────────────────────────────────────────
  if (isYT && ytId) {
    const ytDivId = container.querySelector('.vp-yt-frame').id;
    onYTReady(() => {
      ytPlayer = new YT.Player(ytDivId, {
        videoId: ytId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          start: cfg.startTime || 0,
          mute: cfg.muted ? 1 : 0,
          autoplay: cfg.autoplay ? 1 : 0,
        },
        events: {
          onReady: (e) => {
            if (!cfg.muted) e.target.setVolume(cfg.volume * 100);
            if (durationEl) durationEl.textContent = formatTime(e.target.getDuration());
            updateVolume();
            cfg.onReady?.();
          },
          onStateChange: (e) => {
            const S = YT.PlayerState;
            if (e.data === S.PLAYING) { setPlaying(true);  cfg.onPlay?.(); startYTProgress(); }
            if (e.data === S.PAUSED)  { setPlaying(false); cfg.onPause?.(); clearTimeout(hideTimer); showControls(); }
            if (e.data === S.ENDED)   { setPlaying(false); cfg.onEnded?.(); showControls(); }
          },
        },
      });
    });
  }

  // YT progress polling
  let ytProgressInterval = null;
  function startYTProgress() {
    clearInterval(ytProgressInterval);
    ytProgressInterval = setInterval(() => {
      if (!playing) { clearInterval(ytProgressInterval); return; }
      updateProgress();
    }, 250);
  }

  // ── Init volume display ───────────────────────────────────────────────────
  updateVolume();
  if (volumeFill) volumeFill.style.width = (cfg.muted ? 0 : cfg.volume * 100) + '%';

  // ── API publique ──────────────────────────────────────────────────────────
  return {
    play()                { play(); },
    pause()               { pause(); },
    seek(s)               { seek(s); },
    setVolume(v)          { currentVolume = clamp(v, 0, 1); currentMuted = false; updateVolume(); },
    mute()                { currentMuted = true; updateVolume(); },
    unmute()              { currentMuted = false; updateVolume(); },
    setPlaybackRate(r)    {
      if (!isYT && videoEl) videoEl.playbackRate = r;
      else ytPlayer?.setPlaybackRate?.(r);
    },
    getTime()             { return getCurrentTime(); },
    getDuration()         { return getDuration(); },
    destroy() {
      clearTimeout(hideTimer);
      clearInterval(ytProgressInterval);
      if (!isYT && videoEl) { videoEl.pause(); videoEl.src = ''; }
      if (ytPlayer) ytPlayer.destroy?.();
      container.innerHTML = '';
      container.classList.remove('vp-container');
    },
  };
}