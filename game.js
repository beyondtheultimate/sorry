(() => {
  'use strict';

  /* ========================================================================
     1. QUIZ DATA & SCREEN CONFIG
     ======================================================================== */
  const SCREEN_ORDER = ['identity', 'start', 'level1', 'level2', 'letter'];

  const SCREEN_TITLES = {
    identity: 'Who Are You? | A Little Mission for You',
    start: 'A Little Mission for You',
    level1: 'Level 1: Catch My Hearts | A Little Mission for You',
    level2: 'Level 2: A Little Quiz | A Little Mission for You',
    letter: 'Your Secret Letter | A Little Mission for You',
  };

  const QUIZ_QUESTIONS = [
    {
      question: 'Who is the most dramatic person?',
      options: [
        {
          label: 'You',
          reaction: 'Hehe, okay fair... maybe just a tiny bit! (Okay, maybe a lot.) ♥',
        },
        {
          label: 'Obviously you',
          reaction: 'Exposed! Zero denial possible, moving right along~',
        },
        {
          label: 'Still you',
          reaction: 'Guilty as charged! At least I keep life interesting, right?',
        },
      ],
    },
    {
      question: 'Who deserves extra love today?',
      options: [
        {
          label: 'You',
          reaction: '1000/10 answer! Extra hugs and patience officially unlocked.',
        },
        {
          label: 'You again',
          reaction: 'Always you! Today, tomorrow, and especially right now.',
        },
        {
          label: 'YOU!',
          reaction: 'YES! Loud and clear—you mean the world to me ♥',
        },
      ],
    },
    {
      question: "What's waiting at the end of this game?",
      options: [
        {
          label: 'A surprise',
          reaction: 'Ooh, good guess! Wait till you break the wax seal...',
        },
        {
          label: 'A secret message',
          reaction: 'Getting warmer! Something straight from the heart is inside.',
        },
        {
          label: 'Both!',
          reaction: 'Ding ding ding! You know me way too well ♥',
        },
      ],
    },
  ];

  const HEART_STYLES = [
    { fill: '#e0315b', stroke: '#991437', highlight: '#ff9ebb', pop: 'Sweet! ♥' },
    { fill: '#ff6f9c', stroke: '#bd1e45', highlight: '#ffd9e6', pop: 'Gotcha!' },
    { fill: '#c9234b', stroke: '#7a0e2b', highlight: '#ff96b4', pop: 'Mine! ★' },
    { fill: '#f25582', stroke: '#991437', highlight: '#ffc9db', pop: 'So close!' },
    { fill: '#d62851', stroke: '#87102f', highlight: '#bde0ff', pop: '5/5! ♥' },
  ];

  /* ========================================================================
     2. CENTRAL GAME STATE
     ======================================================================== */
  const state = {
    runId: 0,
    screen: 'identity',
    soundEnabled: true,
    motionPaused: false,
    identity: {
      status: 'entry',
      busy: false,
      edited: false,
    },
    level1: {
      collected: 0,
      total: 5,
      completed: false,
      hearts: [],
      rafId: null,
      lastTime: 0,
      arenaW: 0,
      arenaH: 0,
    },
    level2: {
      currentQuestion: 0,
      selectedOptions: [null, null, null],
      completed: false,
    },
    letter: {
      opening: false,
      opened: false,
      lastThingShown: false,
    },
  };

  /* ========================================================================
     3. DOM REFERENCES
     ======================================================================== */
  const el = {
    liveAnnouncer: document.getElementById('live-announcer'),
    skyStars: document.getElementById('sky-stars'),
    skyHearts: document.getElementById('sky-hearts'),
    missionSteps: Array.from(document.querySelectorAll('#mission-steps .step-pip')),
    soundToggle: document.getElementById('sound-toggle'),
    soundToggleLabel: document.getElementById('sound-toggle-label'),
    motionToggle: document.getElementById('motion-toggle'),
    motionToggleLabel: document.getElementById('motion-toggle-label'),
    restartBtn: document.getElementById('restart-btn'),
    footerCredit: document.getElementById('footer-credit'),
    screens: {
      identity: document.getElementById('screen-identity'),
      start: document.getElementById('screen-start'),
      level1: document.getElementById('screen-level1'),
      level2: document.getElementById('screen-level2'),
      letter: document.getElementById('screen-letter'),
    },
    headings: {
      identity: document.getElementById('identity-heading'),
      start: document.getElementById('start-heading'),
      level1: document.getElementById('level1-heading'),
      level2: document.getElementById('level2-heading'),
      letter: document.getElementById('letter-heading'),
    },
    // Identity Gate
    identityFormView: document.getElementById('identity-form-view'),
    identityForm: document.getElementById('identity-form'),
    identityInput: document.getElementById('identity-name'),
    identityError: document.getElementById('identity-error'),
    identitySuccessView: document.getElementById('identity-success-view'),
    identitySuccessHeading: document.getElementById('identity-success-heading'),
    enterWorldBtn: document.getElementById('enter-world-btn'),
    identityDeniedView: document.getElementById('identity-denied-view'),
    identityDeniedHeading: document.getElementById('identity-denied-heading'),
    tryAgainBtn: document.getElementById('try-again-btn'),
    startPlayBtn: document.getElementById('start-play-btn'),
    // Level 1
    heartCounterText: document.getElementById('heart-counter-text'),
    heartSlots: Array.from(document.querySelectorAll('#heart-slots .heart-slot')),
    heartArena: document.getElementById('heart-arena'),
    arenaHeartsLayer: document.getElementById('arena-hearts-layer'),
    arenaBurstLayer: document.getElementById('arena-burst-layer'),
    level1Complete: document.getElementById('level1-complete'),
    toLevel2Btn: document.getElementById('to-level2-btn'),
    // Level 2
    quizStepLabel: document.getElementById('quiz-step-label'),
    quizPips: Array.from(document.querySelectorAll('#quiz-pips .quiz-pip')),
    quizCard: document.getElementById('quiz-card'),
    quizQuestionText: document.getElementById('quiz-question-text'),
    quizOptions: document.getElementById('quiz-options'),
    quizReactionBox: document.getElementById('quiz-reaction-box'),
    quizReactionText: document.getElementById('quiz-reaction-text'),
    quizNextWrap: document.getElementById('quiz-next-wrap'),
    quizNextBtn: document.getElementById('quiz-next-btn'),
    quizComplete: document.getElementById('quiz-complete'),
    unlockLetterBtn: document.getElementById('unlock-letter-btn'),
    // Final Screen
    envelopeStage: document.getElementById('envelope-stage'),
    envelopeBtn: document.getElementById('envelope-btn'),
    envelopeWrapper: document.getElementById('envelope-wrapper'),
    letterPaper: document.getElementById('letter-paper'),
    oneLastWrap: document.getElementById('one-last-wrap'),
    oneLastBtn: document.getElementById('one-last-btn'),
    finalHugCard: document.getElementById('final-hug-card'),
    finalRestartBtn: document.getElementById('final-restart-btn'),
  };

  /* ========================================================================
     4. COZY WEB AUDIO SYNTHESIZER (Triggered only on user interaction)
     ======================================================================== */
  const SoundFX = (() => {
    let ctx = null;

    function getContext() {
      if (!state.soundEnabled) return null;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!ctx) {
        ctx = new AudioCtx();
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    function tone(freq, duration = 0.18, delay = 0, type = 'triangle', peak = 0.11) {
      const audio = getContext();
      if (!audio) return;
      const now = audio.currentTime + delay;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    return {
      playStart() {
        tone(523.25, 0.14, 0, 'triangle', 0.1);
        tone(659.25, 0.14, 0.08, 'triangle', 0.1);
        tone(783.99, 0.24, 0.16, 'sine', 0.12);
      },
      playHeartCatch(idx) {
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0];
        const base = notes[idx % notes.length];
        tone(base, 0.16, 0, 'sine', 0.12);
        tone(base * 1.5, 0.18, 0.05, 'triangle', 0.07);
      },
      playLevelClear() {
        tone(523.25, 0.14, 0, 'triangle', 0.1);
        tone(659.25, 0.14, 0.09, 'triangle', 0.1);
        tone(783.99, 0.16, 0.18, 'triangle', 0.11);
        tone(1046.5, 0.34, 0.27, 'sine', 0.12);
      },
      playQuizPick(idx) {
        const notes = [493.88, 554.37, 622.25];
        tone(notes[idx % notes.length], 0.14, 0, 'sine', 0.1);
      },
      playEnvelopeOpen() {
        [349.23, 440.0, 523.25, 659.25, 783.99].forEach((freq, i) => {
          tone(freq, 0.35, i * 0.07, 'sine', 0.09);
        });
      },
      playVirtualHug() {
        [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((freq, i) => {
          tone(freq, 0.42, i * 0.08, 'triangle', 0.09);
        });
      },
      playClick() {
        tone(587.33, 0.08, 0, 'sine', 0.06);
      },
      playAccessGranted() {
        tone(523.25, 0.14, 0, 'triangle', 0.1);
        tone(659.25, 0.14, 0.08, 'triangle', 0.1);
        tone(783.99, 0.16, 0.16, 'triangle', 0.11);
        tone(1046.5, 0.3, 0.24, 'sine', 0.12);
      },
      playAccessDenied() {
        tone(329.63, 0.14, 0, 'triangle', 0.09);
        tone(261.63, 0.22, 0.1, 'sine', 0.1);
      },
    };
  })();

  /* ========================================================================
     5. UTILITY HELPERS (Motion, Display Transitions, Announcements)
     ======================================================================== */
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function prefersReducedMotion() {
    return reducedMotionQuery.matches || state.motionPaused;
  }

  function announce(message) {
    if (!el.liveAnnouncer) return;
    el.liveAnnouncer.textContent = '';
    window.requestAnimationFrame(() => {
      el.liveAnnouncer.textContent = message;
    });
  }

  let supportsDisplayTransition;
  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
      supportsDisplayTransition = false;
      return false;
    }
    const probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = 'none';
    supportsDisplayTransition = getComputedStyle(probe).display === 'block';
    probe.remove();
    return supportsDisplayTransition;
  }

  async function hideElement(target) {
    if (!target || target.hidden) return;
    if (canTransitionDisplay()) {
      target.hidden = true;
    } else {
      target.setAttribute('data-closing', '');
    }

    const animations = target.getAnimations();
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((resolve) => window.setTimeout(resolve, 1000)),
      ]);
    }

    if (target.hasAttribute('data-closing')) {
      target.removeAttribute('data-closing');
      target.hidden = true;
    }
  }

  function showElement(target) {
    if (!target) return;
    target.removeAttribute('data-closing');
    target.hidden = false;
  }

  /* ========================================================================
     6. ANIMATED SKY BACKDROP (Stars & Floating Hearts)
     ======================================================================== */
  function createSvgElement(tag, attrs) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  function initSkyDecor() {
    const starColors = ['#ffffff', '#9fd2ff', '#ffeaa0', '#ff9fc2'];
    for (let i = 0; i < 20; i++) {
      const svg = createSvgElement('svg', {
        viewBox: '0 0 24 24',
        class: 'bg-star',
        'aria-hidden': 'true',
      });
      svg.appendChild(
        createSvgElement('path', {
          fill: 'currentColor',
          d: 'M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2z',
        })
      );
      svg.style.setProperty('--x', `${(i * 19 + 7) % 95}%`);
      svg.style.setProperty('--y', `${(i * 13 + 5) % 88}%`);
      svg.style.setProperty('--size', `${12 + (i % 4) * 3}px`);
      svg.style.setProperty('--star-color', starColors[i % starColors.length]);
      svg.style.setProperty('--base-op', `${0.62 + (i % 3) * 0.12}`);
      svg.style.setProperty('--dur', `${2.6 + (i % 5) * 0.65}s`);
      svg.style.setProperty('--delay', `${-(i * 0.45)}s`);
      el.skyStars.appendChild(svg);
    }

    const heartColors = ['#ff8db5', '#ffa6c6', '#e86891', '#8bc3f5', '#ffbad1'];
    for (let i = 0; i < 16; i++) {
      const svg = createSvgElement('svg', {
        viewBox: '0 0 24 24',
        class: 'bg-heart',
        'aria-hidden': 'true',
      });
      svg.appendChild(
        createSvgElement('path', {
          fill: 'currentColor',
          d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
        })
      );
      svg.style.setProperty('--x', `${(i * 23 + 4) % 94}%`);
      svg.style.setProperty('--size', `${16 + (i % 4) * 5}px`);
      svg.style.setProperty('--heart-color', heartColors[i % heartColors.length]);
      svg.style.setProperty('--base-op', `${0.38 + (i % 3) * 0.1}`);
      svg.style.setProperty('--dur', `${12 + (i % 5) * 2.4}s`);
      svg.style.setProperty('--delay', `${-(i * 1.15)}s`);
      svg.style.setProperty('--sway', `${(i % 2 === 0 ? 1 : -1) * (16 + (i % 4) * 7)}px`);
      svg.style.setProperty('--tilt', `${(i % 2 === 0 ? -1 : 1) * (6 + (i % 3) * 4)}deg`);
      svg.style.setProperty('--static-y', `${10 + ((i * 17) % 78)}%`);
      el.skyHearts.appendChild(svg);
    }
  }

  function spawnCelebrationHearts() {
    if (prefersReducedMotion()) return;
    const colors = ['#d62851', '#ff8db5', '#8bc3f5', '#f25582'];
    for (let i = 0; i < 16; i++) {
      const svg = createSvgElement('svg', {
        viewBox: '0 0 24 24',
        class: 'bg-heart',
        'aria-hidden': 'true',
      });
      svg.appendChild(
        createSvgElement('path', {
          fill: 'currentColor',
          d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
        })
      );
      svg.style.setProperty('--x', `${8 + ((i * 6.1) % 86)}%`);
      svg.style.setProperty('--size', `${18 + (i % 3) * 6}px`);
      svg.style.setProperty('--heart-color', colors[i % colors.length]);
      svg.style.setProperty('--base-op', '0.78');
      svg.style.setProperty('--dur', `${4.4 + (i % 4) * 0.65}s`);
      svg.style.setProperty('--delay', `${(i % 5) * 0.14}s`);
      svg.style.setProperty('--sway', `${(i % 2 === 0 ? 1 : -1) * 28}px`);
      svg.style.animationIterationCount = '1';
      svg.addEventListener('animationend', () => svg.remove(), { once: true });
      el.skyHearts.appendChild(svg);
    }
  }

  /* ========================================================================
     7. NAVIGATION & VIEW TRANSITIONS
     ======================================================================== */
  function updateHudSteps(activeScreen) {
    const activeIdx = SCREEN_ORDER.indexOf(activeScreen);
    el.missionSteps.forEach((pip, idx) => {
      pip.classList.toggle('is-done', idx < activeIdx);
      if (idx === activeIdx) {
        pip.setAttribute('aria-current', 'step');
      } else {
        pip.removeAttribute('aria-current');
      }
    });
  }

  function navigateToScreen(nextScreen, direction = 'forward', focusTarget = null) {
    if (state.screen === nextScreen && direction !== 'restart') return;

    const applyDOMUpdate = () => {
      if (state.screen === 'level1' && nextScreen !== 'level1') {
        stopLevel1Loop();
      }

      state.screen = nextScreen;
      SCREEN_ORDER.forEach((key) => {
        el.screens[key].hidden = key !== nextScreen;
      });

      document.title = SCREEN_TITLES[nextScreen] || 'A Little Mission for You';
      updateHudSteps(nextScreen);

      if (nextScreen === 'level1') {
        initLevel1View();
      } else if (nextScreen === 'level2') {
        renderQuizQuestion();
      }
    };

    const finishNavigation = () => {
      const target = focusTarget || el.headings[nextScreen];
      if (target) {
        target.focus();
      }
      announce(`Moved to ${SCREEN_TITLES[nextScreen]}`);
    };

    if (document.startViewTransition && !prefersReducedMotion()) {
      const supportsTypes = typeof window.ViewTransition !== 'undefined' && 'types' in window.ViewTransition.prototype;
      try {
        const vt = supportsTypes
          ? document.startViewTransition({ update: applyDOMUpdate, types: [direction] })
          : document.startViewTransition(applyDOMUpdate);
        vt.finished.then(finishNavigation).catch(() => {});
        return;
      } catch {
        // Fallback if browser throws on transition options
      }
    }

    applyDOMUpdate();
    finishNavigation();
  }

  /* ========================================================================
     8. IDENTITY VERIFICATION GATE
     ======================================================================== */
  function linkError(input, shown) {
    const errorId = input.dataset.error;
    if (!errorId) return;
    const ids = (input.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter((id) => id && id !== errorId);
    if (shown) ids.push(errorId);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  function setIdentityEmptyError(shown) {
    el.identityInput.setAttribute('aria-invalid', shown ? 'true' : 'false');
    el.identityInput.classList.toggle('user-invalid-fallback', shown);
    linkError(el.identityInput, shown);
    el.identityError.hidden = !shown;
  }

  function triggerInputShake() {
    if (prefersReducedMotion()) return;
    el.identityInput.classList.remove('is-shaking');
    void el.identityInput.offsetWidth;
    el.identityInput.classList.add('is-shaking');
  }

  async function handleIdentitySubmit(event) {
    event.preventDefault();
    if (state.identity.busy) return;

    const trimmed = el.identityInput.value.trim();
    if (trimmed === '') {
      setIdentityEmptyError(true);
      SoundFX.playAccessDenied();
      triggerInputShake();
      el.identityInput.focus();
      announce('Please enter your name first.');
      return;
    }

    setIdentityEmptyError(false);
    state.identity.busy = true;
    const activeRunId = state.runId;

    if (trimmed.toLowerCase() === 'rohan') {
      state.identity.status = 'granted';
      SoundFX.playAccessGranted();
      if (el.footerCredit) {
        el.footerCredit.textContent = 'Made with ♥ for Rohan • A Little Mission for You';
      }
      await hideElement(el.identityFormView);
      if (state.runId !== activeRunId || state.screen !== 'identity') return;
      showElement(el.identitySuccessView);
      state.identity.busy = false;
      el.identitySuccessHeading.focus();
      announce('ACCESS GRANTED! Well, hello Rohan! We were waiting for you. Your little adventure begins now...');
    } else {
      state.identity.status = 'denied';
      SoundFX.playAccessDenied();
      await hideElement(el.identityFormView);
      if (state.runId !== activeRunId || state.screen !== 'identity') return;
      showElement(el.identityDeniedView);
      state.identity.busy = false;
      el.identityDeniedHeading.focus();
      announce('ACCESS DENIED! GAME NOT MEANT FOR YOU. Sorry, this little world belongs to someone special. Nice try though!');
    }
  }

  async function handleTryAgain() {
    if (state.identity.busy) return;
    state.identity.busy = true;
    SoundFX.playClick();
    const activeRunId = state.runId;

    await hideElement(el.identityDeniedView);
    if (state.runId !== activeRunId || state.screen !== 'identity') return;

    state.identity.status = 'entry';
    state.identity.edited = false;
    el.identityForm.reset();
    el.identityInput.value = '';
    el.identityInput.classList.remove('is-shaking');
    setIdentityEmptyError(false);
    showElement(el.identityFormView);
    state.identity.busy = false;
    el.identityInput.focus();
    announce('Enter your name to try again.');
  }

  /* ========================================================================
     9. LEVEL 1: CATCH MY HEARTS
     ======================================================================== */
  function stopLevel1Loop() {
    if (state.level1.rafId !== null) {
      window.cancelAnimationFrame(state.level1.rafId);
      state.level1.rafId = null;
    }
  }

  function measureArena() {
    const rect = el.heartArena.getBoundingClientRect();
    state.level1.arenaW = rect.width || 560;
    state.level1.arenaH = rect.height || 320;
  }

  function updateHeartCounterUI() {
    const { collected, total } = state.level1;
    el.heartCounterText.textContent = `Hearts collected: ${collected}/${total}`;
    el.heartSlots.forEach((slot, idx) => {
      slot.classList.toggle('is-collected', idx < collected);
    });
  }

  function spawnHeartPopBurst(cx, cy, styleMeta) {
    const burst = document.createElement('div');
    burst.className = 'pop-burst';
    burst.style.setProperty('--bx', `${cx}px`);
    burst.style.setProperty('--by', `${cy}px`);

    const ring = document.createElement('span');
    ring.className = 'pop-ring';
    burst.appendChild(ring);

    const label = document.createElement('span');
    label.className = 'pop-label';
    label.textContent = styleMeta.pop;
    burst.appendChild(label);

    const sparkAngles = [0, 60, 120, 180, 240, 300];
    const sparkColors = ['#d62851', '#ff8db5', '#5b9bd5'];
    sparkAngles.forEach((deg, i) => {
      const spark = document.createElement('span');
      spark.className = 'pop-spark';
      spark.textContent = i % 2 === 0 ? '✦' : '♥';
      const rad = (deg * Math.PI) / 180;
      const dist = 34 + (i % 2) * 10;
      spark.style.setProperty('--sx', `${Math.round(Math.cos(rad) * dist)}px`);
      spark.style.setProperty('--sy', `${Math.round(Math.sin(rad) * dist)}px`);
      spark.style.setProperty('--spark-color', sparkColors[i % sparkColors.length]);
      burst.appendChild(spark);
    });

    el.arenaBurstLayer.appendChild(burst);
    window.setTimeout(() => burst.remove(), 900);
  }

  function createFloatingHeartButton(index, styleMeta) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'floating-heart-btn';
    btn.setAttribute('aria-label', `Catch floating heart ${index + 1} of ${state.level1.total}`);

    const svg = createSvgElement('svg', {
      viewBox: '0 0 48 44',
      class: 'floating-heart-svg',
      'aria-hidden': 'true',
    });
    svg.appendChild(
      createSvgElement('path', {
        d: 'M24 40S4 27.6 4 15.2C4 8.7 9.2 4 15.4 4c3.6 0 6.6 1.7 8.6 4.4C26 5.7 29 4 32.6 4 38.8 4 44 8.7 44 15.2 44 27.6 24 40 24 40Z',
        fill: styleMeta.fill,
        stroke: styleMeta.stroke,
        'stroke-width': '2.4',
        'stroke-linejoin': 'round',
      })
    );
    svg.appendChild(
      createSvgElement('path', {
        d: 'M13.5 10.2c-2.3.7-4 2.7-4.2 5.3-.1 1 1.2 1.3 1.5.3.4-1.5 1.6-2.9 3.1-3.5.9-.3.7-2.4-.4-2.1Z',
        fill: styleMeta.highlight,
        'fill-opacity': '0.88',
      })
    );
    btn.appendChild(svg);
    return btn;
  }

  function initLevel1View() {
    stopLevel1Loop();
    measureArena();
    el.arenaHeartsLayer.replaceChildren();
    el.arenaBurstLayer.replaceChildren();

    if (state.level1.completed) {
      updateHeartCounterUI();
      showElement(el.level1Complete);
      return;
    }

    el.level1Complete.hidden = true;
    updateHeartCounterUI();

    const w = Math.max(state.level1.arenaW, 280);
    const h = Math.max(state.level1.arenaH, 250);
    const heartSize = window.matchMedia('(pointer: coarse)').matches ? 64 : 60;
    const pad = 16;
    const usableW = Math.max(w - heartSize - pad * 2, 80);
    const usableH = Math.max(h - heartSize - pad * 2, 80);

    const anchorFractions = [
      [0.16, 0.24],
      [0.78, 0.22],
      [0.48, 0.48],
      [0.2, 0.74],
      [0.76, 0.72],
    ];

    state.level1.hearts = anchorFractions.map(([fx, fy], idx) => {
      const styleMeta = HEART_STYLES[idx];
      const btn = createFloatingHeartButton(idx, styleMeta);
      const x = pad + fx * usableW;
      const y = pad + fy * usableH;
      const angle = (idx * 1.25 + 0.45);
      const speed = 26 + (idx % 3) * 6;

      const heartObj = {
        id: idx,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        phase: idx * 1.3,
        size: heartSize,
        styleMeta,
        hovered: false,
        focused: false,
        collected: false,
        el: btn,
      };

      btn.style.setProperty('--hx', `${Math.round(x)}px`);
      btn.style.setProperty('--hy', `${Math.round(y)}px`);

      btn.addEventListener('pointerenter', () => { heartObj.hovered = true; });
      btn.addEventListener('pointerleave', () => { heartObj.hovered = false; });
      btn.addEventListener('focus', () => { heartObj.focused = true; });
      btn.addEventListener('blur', () => { heartObj.focused = false; });
      btn.addEventListener('click', (event) => {
        const fromKeyboard = event.detail === 0;
        catchHeart(heartObj, fromKeyboard);
      });

      el.arenaHeartsLayer.appendChild(btn);
      return heartObj;
    });

    state.level1.lastTime = performance.now();
    state.level1.rafId = window.requestAnimationFrame(stepLevel1);
  }

  function stepLevel1(now) {
    if (state.screen !== 'level1' || state.level1.completed) {
      state.level1.rafId = null;
      return;
    }

    const dt = Math.min((now - state.level1.lastTime) / 1000, 0.05);
    state.level1.lastTime = now;

    if (!prefersReducedMotion()) {
      const pad = 12;
      const hearts = state.level1.hearts;

      for (let i = 0; i < hearts.length; i++) {
        const h = hearts[i];
        if (h.collected || h.hovered || h.focused) continue;

        const maxX = Math.max(pad, state.level1.arenaW - h.size - pad);
        const maxY = Math.max(pad, state.level1.arenaH - h.size - pad);

        h.phase += dt * 1.9;
        h.x += h.vx * dt;
        h.y += h.vy * dt + Math.sin(h.phase) * 10 * dt;

        // Gentle separation from nearby active hearts
        for (let j = 0; j < hearts.length; j++) {
          if (i === j || hearts[j].collected) continue;
          const other = hearts[j];
          const dx = h.x - other.x;
          const dy = h.y - other.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 66) {
            const push = (66 - dist) * 0.45 * dt;
            h.x += (dx / dist) * push;
            h.y += (dy / dist) * push;
          }
        }

        if (h.x <= pad) {
          h.x = pad;
          h.vx = Math.abs(h.vx);
        } else if (h.x >= maxX) {
          h.x = maxX;
          h.vx = -Math.abs(h.vx);
        }

        if (h.y <= pad) {
          h.y = pad;
          h.vy = Math.abs(h.vy);
        } else if (h.y >= maxY) {
          h.y = maxY;
          h.vy = -Math.abs(h.vy);
        }

        const tilt = Math.sin(h.phase * 0.9) * 8;
        h.el.style.setProperty('--hx', `${h.x.toFixed(1)}px`);
        h.el.style.setProperty('--hy', `${h.y.toFixed(1)}px`);
        h.el.style.setProperty('--hrot', `${tilt.toFixed(1)}deg`);
      }
    }

    state.level1.rafId = window.requestAnimationFrame(stepLevel1);
  }

  function catchHeart(heartObj, fromKeyboard) {
    if (heartObj.collected || state.level1.completed) return;
    heartObj.collected = true;
    state.level1.collected += 1;

    const idx = state.level1.collected - 1;
    SoundFX.playHeartCatch(idx);

    const cx = heartObj.x + heartObj.size / 2;
    const cy = heartObj.y + heartObj.size / 2;
    spawnHeartPopBurst(cx, cy, heartObj.styleMeta);

    heartObj.el.classList.add('is-caught');
    heartObj.el.disabled = true;
    heartObj.el.setAttribute('aria-hidden', 'true');

    updateHeartCounterUI();
    announce(`Hearts collected: ${state.level1.collected} of ${state.level1.total}`);

    window.setTimeout(() => {
      heartObj.el.remove();
    }, 320);

    if (state.level1.collected >= state.level1.total) {
      state.level1.completed = true;
      stopLevel1Loop();
      const activeRunId = state.runId;
      window.setTimeout(() => {
        if (state.runId !== activeRunId || state.screen !== 'level1') return;
        SoundFX.playLevelClear();
        showElement(el.level1Complete);
        announce('Yay! You found all my hearts!');
        el.toLevel2Btn.focus();
      }, 340);
    } else if (fromKeyboard) {
      const remaining = state.level1.hearts.find((h) => !h.collected);
      if (remaining) {
        remaining.el.focus();
      }
    }
  }

  /* ========================================================================
     9. LEVEL 2: A LITTLE QUIZ
     ======================================================================== */
  function renderQuizQuestion() {
    if (state.level2.completed) {
      el.quizCard.hidden = true;
      showElement(el.quizComplete);
      el.quizStepLabel.textContent = 'Quiz Complete!';
      el.quizPips.forEach((pip) => {
        pip.classList.remove('is-active');
        pip.classList.add('is-done');
      });
      return;
    }

    el.quizComplete.hidden = true;
    el.quizCard.hidden = false;

    const qIdx = state.level2.currentQuestion;
    const qData = QUIZ_QUESTIONS[qIdx];
    const selectedIdx = state.level2.selectedOptions[qIdx];

    el.quizStepLabel.textContent = `Question ${qIdx + 1} of ${QUIZ_QUESTIONS.length}`;
    el.quizPips.forEach((pip, i) => {
      pip.classList.toggle('is-done', i < qIdx);
      pip.classList.toggle('is-active', i === qIdx);
    });

    el.quizQuestionText.textContent = qData.question;
    el.quizOptions.replaceChildren();

    const letters = ['A', 'B', 'C'];
    qData.options.forEach((opt, optIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option-btn';
      btn.setAttribute('aria-pressed', selectedIdx === optIdx ? 'true' : 'false');

      const tag = document.createElement('span');
      tag.className = 'option-tag';
      tag.setAttribute('aria-hidden', 'true');
      tag.textContent = letters[optIdx];

      const label = document.createElement('span');
      label.textContent = opt.label;

      btn.append(tag, label);
      btn.addEventListener('click', () => handleQuizSelect(qIdx, optIdx));
      el.quizOptions.appendChild(btn);
    });

    if (selectedIdx !== null) {
      el.quizReactionText.textContent = qData.options[selectedIdx].reaction;
      showElement(el.quizReactionBox);
      el.quizNextBtn.textContent =
        qIdx === QUIZ_QUESTIONS.length - 1 ? 'See My Surprise ★' : 'Next Question →';
      showElement(el.quizNextWrap);
    } else {
      el.quizReactionBox.hidden = true;
      el.quizNextWrap.hidden = true;
    }
  }

  function handleQuizSelect(qIdx, optIdx) {
    state.level2.selectedOptions[qIdx] = optIdx;
    SoundFX.playQuizPick(optIdx);

    const optionButtons = Array.from(el.quizOptions.querySelectorAll('.quiz-option-btn'));
    optionButtons.forEach((btn, idx) => {
      btn.setAttribute('aria-pressed', idx === optIdx ? 'true' : 'false');
    });

    const reaction = QUIZ_QUESTIONS[qIdx].options[optIdx].reaction;
    el.quizReactionText.textContent = reaction;
    showElement(el.quizReactionBox);

    el.quizNextBtn.textContent =
      qIdx === QUIZ_QUESTIONS.length - 1 ? 'See My Surprise ★' : 'Next Question →';
    showElement(el.quizNextWrap);
    announce(reaction);
  }

  async function handleQuizNext() {
    SoundFX.playClick();
    if (state.level2.currentQuestion < QUIZ_QUESTIONS.length - 1) {
      state.level2.currentQuestion += 1;
      renderQuizQuestion();
      const firstOption = el.quizOptions.querySelector('.quiz-option-btn');
      if (firstOption) firstOption.focus();
    } else {
      state.level2.completed = true;
      SoundFX.playLevelClear();
      const activeRunId = state.runId;
      await hideElement(el.quizCard);
      if (state.runId !== activeRunId || state.screen !== 'level2') return;
      el.quizStepLabel.textContent = 'Quiz Complete!';
      el.quizPips.forEach((pip) => {
        pip.classList.remove('is-active');
        pip.classList.add('is-done');
      });
      showElement(el.quizComplete);
      announce("Okay, you're officially qualified for your surprise!");
      el.unlockLetterBtn.focus();
    }
  }

  /* ========================================================================
     10. FINAL SCREEN: ENVELOPE & LETTER REVEAL
     ======================================================================== */
  function handleOpenEnvelope() {
    if (state.letter.opening || state.letter.opened) return;
    state.letter.opening = true;
    el.envelopeBtn.setAttribute('aria-expanded', 'true');
    el.envelopeWrapper.classList.add('is-open');
    SoundFX.playEnvelopeOpen();

    const activeRunId = state.runId;
    const waitMs = prefersReducedMotion() ? 180 : 760;
    window.setTimeout(async () => {
      if (state.runId !== activeRunId || state.screen !== 'letter') return;
      state.letter.opened = true;
      state.letter.opening = false;
      await hideElement(el.envelopeStage);
      if (state.runId !== activeRunId || state.screen !== 'letter') return;
      showElement(el.letterPaper);
      el.letterPaper.setAttribute('tabindex', '-1');
      el.letterPaper.focus();
      announce('Letter opened. Hey Rohan, I know things are not quite okay right now...');
    }, waitMs);
  }

  async function handleOneLastThing() {
    if (state.letter.lastThingShown) return;
    state.letter.lastThingShown = true;
    SoundFX.playVirtualHug();
    spawnCelebrationHearts();
    const activeRunId = state.runId;
    await hideElement(el.oneLastWrap);
    if (state.runId !== activeRunId || state.screen !== 'letter') return;
    showElement(el.finalHugCard);
    announce('Sending you the biggest virtual heart. No pressure, take your time.');
    el.finalRestartBtn.focus();
  }

  /* ========================================================================
     11. RESTART & UTILITY CONTROLS
     ======================================================================== */
  function restartGame() {
    state.runId += 1;
    SoundFX.playClick();
    stopLevel1Loop();

    state.identity.status = 'entry';
    state.identity.busy = false;
    state.identity.edited = false;
    el.identityForm.reset();
    el.identityInput.value = '';
    el.identityInput.classList.remove('is-shaking');
    setIdentityEmptyError(false);
    el.identityFormView.hidden = false;
    el.identityFormView.removeAttribute('data-closing');
    el.identitySuccessView.hidden = true;
    el.identitySuccessView.removeAttribute('data-closing');
    el.identityDeniedView.hidden = true;
    el.identityDeniedView.removeAttribute('data-closing');
    if (el.footerCredit) {
      el.footerCredit.textContent = 'Made with ♥ • A Little Mission for You';
    }

    state.level1.collected = 0;
    state.level1.completed = false;
    state.level1.hearts = [];
    el.arenaHeartsLayer.replaceChildren();
    el.arenaBurstLayer.replaceChildren();
    el.level1Complete.hidden = true;
    el.level1Complete.removeAttribute('data-closing');
    updateHeartCounterUI();

    state.level2.currentQuestion = 0;
    state.level2.selectedOptions = [null, null, null];
    state.level2.completed = false;
    el.quizReactionBox.hidden = true;
    el.quizReactionBox.removeAttribute('data-closing');
    el.quizNextWrap.hidden = true;
    el.quizNextWrap.removeAttribute('data-closing');
    el.quizComplete.hidden = true;
    el.quizComplete.removeAttribute('data-closing');
    el.quizCard.hidden = false;
    el.quizCard.removeAttribute('data-closing');

    state.letter.opening = false;
    state.letter.opened = false;
    state.letter.lastThingShown = false;
    el.envelopeWrapper.classList.remove('is-open');
    el.envelopeBtn.setAttribute('aria-expanded', 'false');
    el.envelopeStage.hidden = false;
    el.envelopeStage.removeAttribute('data-closing');
    el.letterPaper.hidden = true;
    el.letterPaper.removeAttribute('data-closing');
    el.oneLastWrap.hidden = false;
    el.oneLastWrap.removeAttribute('data-closing');
    el.finalHugCard.hidden = true;
    el.finalHugCard.removeAttribute('data-closing');

    navigateToScreen('identity', 'restart');
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    el.soundToggle.setAttribute('aria-pressed', String(state.soundEnabled));
    el.soundToggle.setAttribute(
      'aria-label',
      state.soundEnabled ? 'Mute sound effects' : 'Enable sound effects'
    );
    el.soundToggleLabel.textContent = state.soundEnabled ? 'Sound' : 'Muted';
    if (state.soundEnabled) {
      SoundFX.playClick();
    }
    announce(state.soundEnabled ? 'Sound effects enabled' : 'Sound effects muted');
  }

  function toggleMotion() {
    state.motionPaused = !state.motionPaused;
    document.body.classList.toggle('motion-paused', state.motionPaused);
    el.motionToggle.setAttribute('data-paused', String(state.motionPaused));
    el.motionToggle.setAttribute(
      'aria-label',
      state.motionPaused ? 'Resume background animation' : 'Pause background animation'
    );
    el.motionToggleLabel.textContent = state.motionPaused ? 'Resume' : 'Pause';
    announce(state.motionPaused ? 'Background animations paused' : 'Background animations resumed');
  }

  /* ========================================================================
     12. INITIALIZATION & EVENT BINDING
     ======================================================================== */
  function bindEvents() {
    el.identityForm.addEventListener('submit', handleIdentitySubmit);

    el.identityInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.isComposing || event.keyCode === 229) return;
        el.identityForm.requestSubmit();
      }
    });

    el.identityInput.addEventListener('input', () => {
      state.identity.edited = true;
      el.identityInput.classList.remove('is-shaking');
      if (el.identityInput.value.trim() !== '' || el.identityInput.getAttribute('aria-invalid') === 'true') {
        if (el.identityInput.value.trim() !== '') {
          setIdentityEmptyError(false);
        }
      }
    });

    el.identityInput.addEventListener('blur', () => {
      if (state.identity.edited && el.identityInput.value.trim() === '') {
        setIdentityEmptyError(true);
      }
    });

    el.enterWorldBtn.addEventListener('click', () => {
      SoundFX.playClick();
      navigateToScreen('start', 'forward');
    });

    el.tryAgainBtn.addEventListener('click', handleTryAgain);

    el.startPlayBtn.addEventListener('click', () => {
      SoundFX.playStart();
      navigateToScreen('level1', 'forward');
    });

    el.toLevel2Btn.addEventListener('click', () => {
      SoundFX.playClick();
      navigateToScreen('level2', 'forward');
    });

    el.quizNextBtn.addEventListener('click', handleQuizNext);

    el.unlockLetterBtn.addEventListener('click', () => {
      SoundFX.playClick();
      navigateToScreen('letter', 'forward');
    });

    el.envelopeBtn.addEventListener('click', handleOpenEnvelope);
    el.oneLastBtn.addEventListener('click', handleOneLastThing);
    el.restartBtn.addEventListener('click', restartGame);
    el.finalRestartBtn.addEventListener('click', restartGame);
    el.soundToggle.addEventListener('click', toggleSound);
    el.motionToggle.addEventListener('click', toggleMotion);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (state.screen !== 'level1') return;
        measureArena();
        const pad = 12;
        state.level1.hearts.forEach((h) => {
          if (h.collected) return;
          const maxX = Math.max(pad, state.level1.arenaW - h.size - pad);
          const maxY = Math.max(pad, state.level1.arenaH - h.size - pad);
          h.x = Math.min(Math.max(h.x, pad), maxX);
          h.y = Math.min(Math.max(h.y, pad), maxY);
          h.el.style.setProperty('--hx', `${h.x.toFixed(1)}px`);
          h.el.style.setProperty('--hy', `${h.y.toFixed(1)}px`);
        });
      });
      ro.observe(el.heartArena);
    }
  }

  initSkyDecor();
  document.title = SCREEN_TITLES.identity;
  updateHudSteps('identity');
  bindEvents();
})();
