/**
 * typewriter.js — Effet typewriter infini avec highlight de mots
 * ---------------------------------------------------------------
 * @author  Generated for Tipounos
 * @version 1.0.0
 *
 * USAGE RAPIDE :
 *   createTypewriter(document.getElementById('mon-element'), {
 *     texts: ["Hello world", "Je suis développeur", "J'adore coder"],
 *     highlights: ["world", "développeur", "coder"],
 *     highlightColor: "#ff6b35",
 *   });
 */

/**
 * createTypewriter(element, options)
 *
 * @param {HTMLElement} element         - L'élément DOM cible
 * @param {Object}      options         - Configuration
 *
 * OPTIONS DISPONIBLES :
 * @param {string[]}  texts             - Tableau de textes à afficher (obligatoire)
 * @param {string[]}  highlights        - Mots ou phrases à coloriser (ex: ["world", "dev"])
 * @param {string}    highlightColor    - Couleur CSS des mots highlights (défaut: "#ff6b35")
 * @param {string}    highlightTag      - Tag HTML pour le highlight (défaut: "span")
 * @param {string}    highlightClass    - Classe CSS ajoutée au tag highlight (défaut: "tw-highlight")
 * @param {Object}    highlightStyle    - Styles CSS inline additionnels sur le highlight
 *                                        ex: { fontWeight: "bold", textDecoration: "underline" }
 * @param {number}    typeSpeed         - Vitesse frappe en ms par caractère (défaut: 60)
 * @param {number}    deleteSpeed       - Vitesse suppression en ms par caractère (défaut: 30)
 * @param {number}    pauseAfterType    - Pause après avoir écrit (ms) (défaut: 1800)
 * @param {number}    pauseAfterDelete  - Pause après avoir effacé (ms) (défaut: 400)
 * @param {boolean}   loop              - Boucle infinie (défaut: true)
 * @param {boolean}   deleteAll         - Efface tout avant le texte suivant (défaut: true)
 *                                        Si false, garde le texte commun (smart delete)
 * @param {boolean}   cursor            - Affiche un curseur clignotant (défaut: true)
 * @param {string}    cursorChar        - Caractère du curseur (défaut: "|")
 * @param {string}    cursorColor       - Couleur CSS du curseur (défaut: hérite de la couleur)
 * @param {number}    cursorBlinkSpeed  - Vitesse clignotement curseur en ms (défaut: 530)
 * @param {boolean}   shuffle           - Ordre aléatoire des textes (défaut: false)
 * @param {number}    startDelay        - Délai avant le démarrage en ms (défaut: 0)
 * @param {Function}  onTextStart       - Callback(index, text) quand un texte commence
 * @param {Function}  onTextComplete    - Callback(index, text) quand un texte est complet
 * @param {Function}  onLoop            - Callback(loopCount) à chaque bouclage
 *
 * @returns {Object} Contrôleur — { pause(), resume(), stop(), destroy(), goTo(index) }
 */
function createTypewriter(element, options = {}) {
  // ── Valeurs par défaut ──────────────────────────────────────────────────────
  const cfg = {
    texts:            options.texts            ?? ["Typewriter effect..."],
    highlights:       options.highlights       ?? [],
    highlightColor:   options.highlightColor   ?? "#ff6b35",
    highlightTag:     options.highlightTag     ?? "span",
    highlightClass:   options.highlightClass   ?? "tw-highlight",
    highlightStyle:   options.highlightStyle   ?? {},
    typeSpeed:        options.typeSpeed        ?? 60,
    deleteSpeed:      options.deleteSpeed      ?? 30,
    pauseAfterType:   options.pauseAfterType   ?? 1800,
    pauseAfterDelete: options.pauseAfterDelete ?? 400,
    loop:             options.loop             ?? true,
    deleteAll:        options.deleteAll        ?? true,
    cursor:           options.cursor           ?? true,
    cursorChar:       options.cursorChar       ?? "|",
    cursorColor:      options.cursorColor      ?? null,
    cursorBlinkSpeed: options.cursorBlinkSpeed ?? 530,
    shuffle:          options.shuffle          ?? false,
    startDelay:       options.startDelay       ?? 0,
    onTextStart:      options.onTextStart      ?? null,
    onTextComplete:   options.onTextComplete   ?? null,
    onLoop:           options.onLoop           ?? null,
  };

  // ── État interne ────────────────────────────────────────────────────────────
  let currentIndex  = 0;
  let charIndex     = 0;
  let isDeleting    = false;
  let isPaused      = false;
  let isStopped     = false;
  let loopCount     = 0;
  let timerId       = null;
  let cursorEl      = null;
  let cursorTimerId = null;

  const texts = cfg.shuffle ? shuffleArray([...cfg.texts]) : [...cfg.texts];

  // ── Container ───────────────────────────────────────────────────────────────
  element.style.display   = "inline";
  element.style.whiteSpace = "pre-wrap";

  // Wrapper texte
  const textNode = document.createElement("span");
  textNode.className = "tw-text";
  element.appendChild(textNode);

  // Curseur
  if (cfg.cursor) {
    cursorEl = document.createElement("span");
    cursorEl.className = "tw-cursor";
    cursorEl.textContent = cfg.cursorChar;
    cursorEl.style.cssText = [
      "display:inline-block",
      "margin-left:1px",
      "animation:none",
      cfg.cursorColor ? `color:${cfg.cursorColor}` : "",
    ].filter(Boolean).join(";");
    element.appendChild(cursorEl);

    // Inject keyframes si pas déjà présent
    if (!document.getElementById("tw-cursor-style")) {
      const style = document.createElement("style");
      style.id = "tw-cursor-style";
      style.textContent = `@keyframes tw-blink{0%,100%{opacity:1}50%{opacity:0}}`;
      document.head.appendChild(style);
    }
    startCursorBlink();
  }

  // ── Rendu HTML avec highlights ───────────────────────────────────────────────
  function renderText(text) {
    if (!cfg.highlights.length) {
      textNode.textContent = text;
      return;
    }

    // Trier les highlights du plus long au plus court pour éviter les conflits
    const sorted = [...cfg.highlights].sort((a, b) => b.length - a.length);
    const escaped = sorted.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");

    const parts = text.split(regex);
    textNode.innerHTML = "";

    parts.forEach(part => {
      if (regex.test(part)) {
        const tag = document.createElement(cfg.highlightTag);
        tag.className = cfg.highlightClass;
        tag.textContent = part;
        tag.style.color = cfg.highlightColor;
        Object.assign(tag.style, cfg.highlightStyle);
        textNode.appendChild(tag);
      } else if (part) {
        textNode.appendChild(document.createTextNode(part));
      }
      regex.lastIndex = 0; // reset pour chaque test
    });
  }

  // ── Logique principale ───────────────────────────────────────────────────────
  function tick() {
    if (isStopped || isPaused) return;

    const fullText    = texts[currentIndex];
    const displayed   = fullText.slice(0, charIndex);

    renderText(displayed);

    if (!isDeleting) {
      // Frappe
      if (charIndex < fullText.length) {
        charIndex++;
        timerId = setTimeout(tick, randomize(cfg.typeSpeed));
      } else {
        // Texte complet
        cfg.onTextComplete?.(currentIndex, fullText);
        isDeleting = true;
        timerId = setTimeout(tick, cfg.pauseAfterType);
      }
    } else {
      // Suppression
      if (charIndex > 0) {
        charIndex--;
        timerId = setTimeout(tick, randomize(cfg.deleteSpeed));
      } else {
        // Tout effacé
        isDeleting = false;
        const nextIndex = (currentIndex + 1) % texts.length;

        if (nextIndex === 0) {
          loopCount++;
          cfg.onLoop?.(loopCount);
          if (!cfg.loop) { isStopped = true; return; }
        }

        currentIndex = nextIndex;
        cfg.onTextStart?.(currentIndex, texts[currentIndex]);
        timerId = setTimeout(tick, cfg.pauseAfterDelete);
      }
    }
  }

  // ── Curseur ──────────────────────────────────────────────────────────────────
  function startCursorBlink() {
    if (!cursorEl) return;
    clearInterval(cursorTimerId);
    let visible = true;
    cursorTimerId = setInterval(() => {
      cursorEl.style.opacity = visible ? "1" : "0";
      visible = !visible;
    }, cfg.cursorBlinkSpeed);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function randomize(speed) {
    // Légère variation naturelle (±20%)
    return speed + (Math.random() * speed * 0.4 - speed * 0.2);
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── Démarrage ────────────────────────────────────────────────────────────────
  cfg.onTextStart?.(0, texts[0]);
  timerId = setTimeout(tick, cfg.startDelay);

  // ── API publique ─────────────────────────────────────────────────────────────
  return {
    /** Met en pause l'animation */
    pause()  { isPaused = true; clearTimeout(timerId); },

    /** Reprend l'animation */
    resume() { if (isPaused) { isPaused = false; tick(); } },

    /** Arrête définitivement */
    stop()   { isStopped = true; clearTimeout(timerId); clearInterval(cursorTimerId); },

    /** Détruit et nettoie le DOM */
    destroy() {
      this.stop();
      element.innerHTML = "";
    },

    /** Saute directement à un index de texte */
    goTo(index) {
      clearTimeout(timerId);
      currentIndex = ((index % texts.length) + texts.length) % texts.length;
      charIndex    = 0;
      isDeleting   = false;
      isPaused     = false;
      isStopped    = false;
      cfg.onTextStart?.(currentIndex, texts[currentIndex]);
      tick();
    },
  };
}