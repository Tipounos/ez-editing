/**
 * carousel.js — Carousel infini & réutilisable
 * ---------------------------------------------
 * Auto-initialisé sur tout élément avec la classe "carousel"
 * Configurable 100% via data-attributes HTML, aucun JS requis côté utilisateur.
 * Compatible texte, images, cards, n'importe quel contenu HTML.
 *
 * @version 1.0.0
 *
 * ─── USAGE HTML ────────────────────────────────────────────────────────────────
 *
 * <div class="carousel">
 *   <div class="carousel-item">Slide 1</div>
 *   <div class="carousel-item">Slide 2</div>
 * </div>
 *
 * ─── DATA-ATTRIBUTES DISPONIBLES ──────────────────────────────────────────────
 *
 * data-speed="40"          Vitesse défilement px/s (défaut: 40)
 * data-direction="left"    Sens : "left" | "right" | "up" | "down" (défaut: "left")
 * data-gap="32"            Espacement entre items en px (défaut: 32)
 * data-pause-hover="true"  Pause au survol (défaut: true)
 * data-drag="true"         Glisser à la souris/doigt (défaut: true)
 * data-clone-count="3"     Nombre de fois que les items sont clonés (défaut: auto)
 * data-fade-edges="true"   Fondu sur les bords (défaut: true)
 * data-fade-size="80"      Largeur du fondu en px (défaut: 80)
 * data-accent="#ff6b35"    Couleur d'accent pour le fade (défaut: hérité du CSS)
 * data-loop="true"         Boucle infinie (défaut: true)
 * data-autoplay="true"     Défilement auto (défaut: true)
 * data-easing="linear"     Easing CSS (défaut: "linear")
 * data-item-width="auto"   Largeur forcée des items (px ou "auto") (défaut: "auto")
 * data-item-height="auto"  Hauteur forcée des items (px ou "auto") (défaut: "auto")
 *
 * ─── JS API (optionnel) ────────────────────────────────────────────────────────
 *
 * import { initCarousels, createCarousel } from './carousel.js';
 *
 * // Auto-init (appelé automatiquement au DOMContentLoaded)
 * initCarousels();
 *
 * // Init manuelle sur un élément
 * const ctrl = createCarousel(document.getElementById('mon-carousel'));
 *
 * // Contrôles
 * ctrl.pause()
 * ctrl.resume()
 * ctrl.setSpeed(80)
 * ctrl.setDirection('right')
 * ctrl.destroy()
 */

// ── Helpers ──────────────────────────────────────────────────────────────────
function px(val) { return typeof val === 'number' ? val + 'px' : val; }

function parseDataset(el) {
  const d = el.dataset;
  return {
    speed:       parseFloat(d.speed)          || 40,
    direction:   d.direction                  || 'left',
    gap:         parseFloat(d.gap)            || 32,
    pauseHover:  d.pauseHover  !== 'false',
    drag:        d.drag        !== 'false',
    cloneCount:  d.cloneCount  ? parseInt(d.cloneCount) : null,
    fadeEdges:   d.fadeEdges   !== 'false',
    fadeSize:    parseFloat(d.fadeSize)       || 80,
    accent:      d.accent                     || null,
    loop:        d.loop        !== 'false',
    autoplay:    d.autoplay    !== 'false',
    easing:      d.easing                     || 'linear',
    itemWidth:   d.itemWidth                  || 'auto',
    itemHeight:  d.itemHeight                 || 'auto',
  };
}

const isVertical = dir => dir === 'up' || dir === 'down';
const isReverse  = dir => dir === 'right' || dir === 'down';

// ── createCarousel ────────────────────────────────────────────────────────────
function createCarousel(container) {
  if (!container || container.__carouselInit) return null;
  container.__carouselInit = true;

  const cfg = parseDataset(container);
  const vertical = isVertical(cfg.direction);
  const reverse  = isReverse(cfg.direction);

  // ── Structure DOM ────────────────────────────────────────────────────────
  container.classList.add('cr-root');
  if (vertical) container.classList.add('cr-vertical');
  container.setAttribute('tabindex', '0');
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Carousel');

  // Récupérer les items originaux avant de toucher au DOM
  const originalItems = Array.from(container.querySelectorAll('.carousel-item'));
  if (originalItems.length === 0) return null;

  // Appliquer taille forcée si demandée
  originalItems.forEach(item => {
    item.classList.add('cr-item');
    if (cfg.itemWidth  !== 'auto') item.style.width  = px(parseFloat(cfg.itemWidth));
    if (cfg.itemHeight !== 'auto') item.style.height = px(parseFloat(cfg.itemHeight));
  });

  // Wrapper de défilement
  const track = document.createElement('div');
  track.className = 'cr-track';
  track.style.setProperty('--cr-gap', px(cfg.gap));

  // Déplacer les items dans le track
  originalItems.forEach(item => track.appendChild(item));
  container.appendChild(track);

  // Clonage pour boucle infinie
  function cloneItems() {
    // Supprimer anciens clones
    track.querySelectorAll('.cr-clone').forEach(c => c.remove());

    const items = track.querySelectorAll('.cr-item:not(.cr-clone)');
    const needed = cfg.cloneCount ?? Math.max(3, Math.ceil(
      (vertical ? container.offsetHeight : container.offsetWidth)
      / (getItemSize() + cfg.gap) + 2
    ));

    for (let i = 0; i < needed; i++) {
      items.forEach(item => {
        const clone = item.cloneNode(true);
        clone.classList.add('cr-clone');
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    }
  }

  function getItemSize() {
    const first = track.querySelector('.cr-item');
    if (!first) return 200;
    return vertical ? first.offsetHeight : first.offsetWidth;
  }

  function getSetSize() {
    const items = track.querySelectorAll('.cr-item:not(.cr-clone)');
    let total = 0;
    items.forEach(item => {
      total += (vertical ? item.offsetHeight : item.offsetWidth) + cfg.gap;
    });
    return total;
  }

  // Fade edges
  if (cfg.fadeEdges) {
    const fade = document.createElement('div');
    fade.className = 'cr-fade';
    const size = px(cfg.fadeSize);
    const color = cfg.accent || 'var(--cr-bg, #000)';

    if (vertical) {
      fade.style.background = `
        linear-gradient(to bottom, ${color} 0%, transparent ${size}),
        linear-gradient(to top,    ${color} 0%, transparent ${size})
      `;
    } else {
      fade.style.background = `
        linear-gradient(to right, ${color} 0%, transparent ${size}),
        linear-gradient(to left,  ${color} 0%, transparent ${size})
      `;
    }
    container.appendChild(fade);
  }

  // ── Animation via requestAnimationFrame ─────────────────────────────────
  let pos      = 0;        // position courante en px
  let rafId    = null;
  let paused   = false;
  let lastTime = null;
  let currentSpeed = cfg.speed;
  let currentDir   = cfg.direction;

  function tick(ts) {
    if (!lastTime) lastTime = ts;
    const dt = ts - lastTime;
    lastTime = ts;

    if (!paused) {
      const rev = isReverse(currentDir);
      const delta = currentSpeed * (dt / 1000) * (rev ? -1 : 1);
      pos += delta;

      const setSize = getSetSize();
      if (setSize > 0) {
        // Boucle : réinitialise quand on a parcouru un set complet
        if (!rev && pos >= setSize)  pos -= setSize;
        if (rev  && pos <= -setSize) pos += setSize;
      }

      applyTransform();
    }

    rafId = requestAnimationFrame(tick);
  }

  function applyTransform() {
    if (vertical) {
      track.style.transform = `translateY(${-pos}px)`;
    } else {
      track.style.transform = `translateX(${-pos}px)`;
    }
  }

  function start() {
    if (rafId) return;
    lastTime = null;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // ── Pause au hover ───────────────────────────────────────────────────────
  if (cfg.pauseHover) {
    container.addEventListener('mouseenter', () => { paused = true; });
    container.addEventListener('mouseleave', () => { if (!dragging) paused = false; });
  }

  // ── Drag ────────────────────────────────────────────────────────────────
  let dragging   = false;
  let dragStart  = 0;
  let dragPos    = 0;
  let dragVel    = 0;
  let lastDragT  = 0;
  let lastDragP  = 0;

  function getPointer(e) {
    return vertical
      ? (e.touches ? e.touches[0].clientY : e.clientY)
      : (e.touches ? e.touches[0].clientX : e.clientX);
  }

  if (cfg.drag) {
    container.style.cursor = 'grab';

    const onDown = (e) => {
      if (e.type === 'mousedown' && e.button !== 0) return;
      dragging  = true;
      dragStart = getPointer(e);
      dragPos   = pos;
      dragVel   = 0;
      lastDragT = performance.now();
      lastDragP = dragStart;
      paused    = true;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!dragging) return;
      const p = getPointer(e);
      const now = performance.now();
      dragVel = (lastDragP - p) / ((now - lastDragT) || 1) * 16;
      lastDragP = p; lastDragT = now;

      pos = dragPos + (dragStart - p);
      const setSize = getSetSize();
      if (setSize > 0) {
        if (pos >= setSize)  pos -= setSize;
        if (pos <= -setSize) pos += setSize;
      }
      applyTransform();
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      container.style.cursor = 'grab';
      // Momentum
      currentSpeed = Math.min(Math.abs(dragVel) * 3, 400) || cfg.speed;
      currentDir   = dragVel > 0
        ? (vertical ? 'down' : 'right') // inversé car drag
        : (vertical ? 'up'  : 'left');
      // Revenir doucement à la vitesse de config après 1s
      setTimeout(() => {
        currentSpeed = cfg.speed;
        currentDir   = cfg.direction;
        if (cfg.pauseHover) paused = false;
        else paused = false;
      }, 1000);
    };

    container.addEventListener('mousedown',  onDown);
    container.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('touchmove',  onMove, { passive: false });
    window.addEventListener('mouseup',    onUp);
    window.addEventListener('touchend',   onUp);
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────
  container.addEventListener('keydown', e => {
    const step = 80;
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { pos -= step; applyTransform(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  { pos += step; applyTransform(); }
    if (e.key === ' ') { paused = !paused; e.preventDefault(); }
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  // Attendre que le DOM soit rendu pour mesurer
  requestAnimationFrame(() => {
    cloneItems();
    if (reverse) {
      // Partir depuis la fin pour que ça défile dans le bon sens
      pos = getSetSize();
    }
    if (cfg.autoplay) start();
  });

  // Recalcul au resize
  const ro = new ResizeObserver(() => {
    cloneItems();
  });
  ro.observe(container);

  // ── API publique ──────────────────────────────────────────────────────────
  return {
    pause()           { paused = true; },
    resume()          { paused = false; if (!rafId) start(); },
    stop()            { stop(); },
    start()           { start(); },
    setSpeed(v)       { currentSpeed = v; cfg.speed = v; },
    setDirection(d)   { currentDir = d; cfg.direction = d; },
    destroy() {
      stop();
      ro.disconnect();
      // Remettre les items originaux dans le container
      originalItems.forEach(item => {
        item.classList.remove('cr-item');
        container.appendChild(item);
      });
      container.innerHTML = '';
      originalItems.forEach(item => container.appendChild(item));
      container.classList.remove('cr-root', 'cr-vertical');
      delete container.__carouselInit;
    },
  };
}

// ── initCarousels : auto-init tous les .carousel de la page ──────────────────
function initCarousels(root = document) {
  const controllers = [];
  root.querySelectorAll('.carousel').forEach(el => {
    const ctrl = createCarousel(el);
    if (ctrl) controllers.push({ el, ctrl });
  });
  return controllers;
}

// ── Auto-init au chargement ───────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCarousels());
  } else {
    // DOM déjà prêt (script chargé en defer/module)
    initCarousels();
  }
}