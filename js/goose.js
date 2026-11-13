
/* ==========================================
   COURSEWISE GOOSE v2.0
   Idle, walking, sleeping, and interactive honks.
   Future: mischief and theme-specific outfits.
   ========================================== */

(() => {
  const ID = "cw-goose";

  // Prevent duplicate goose instances.
  if (window.CoursewiseGooseLoaded) return;
  window.CoursewiseGooseLoaded = true;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let goose = null;
  let behaviorTimer = null;
  let honkTimer = null;
  let state = "idle";
  let position = 22;
  let facing = 1;

  const random = (min, max) =>
    Math.round(min + Math.random() * (max - min));

  function gooseMarkup() {
    return `
      <div id="${ID}"
           role="button"
           tabindex="0"
           aria-label="Honk at the goose"
           data-state="idle">

        <!-- Standing and walking illustration -->
        <svg class="cw-goose-standing"
             viewBox="0 0 170 150"
             role="presentation">

          <ellipse cx="83" cy="137" rx="56" ry="7"
            fill="#2f3a44" opacity=".10"/>

          <g class="cw-goose-body-wrap">

            <!-- Tail -->
            <path d="M49 93
              Q33 89 31 76
              Q43 82 56 83
              L65 96Z"
              fill="#f7f7f3"
              stroke="#89929a"
              stroke-width="3"
              stroke-linejoin="round"/>

            <!-- Legs and feet, separately animated -->
            <g class="cw-goose-leg-back">
              <path d="M100 112V132"
                stroke="#df942f"
                stroke-width="4.5"
                stroke-linecap="round"/>

              <path d="M100 130
                L90 137
                Q88 140 98 140
                H114
                Q118 139 109 134Z"
                fill="#e9a03a"
                stroke="#ad6d2c"
                stroke-width="2.5"/>
            </g>

            <g class="cw-goose-leg-front">
              <path d="M76 113V132"
                stroke="#df942f"
                stroke-width="4.5"
                stroke-linecap="round"/>

              <path d="M76 130
                L65 137
                Q62 140 72 140
                H89
                Q93 139 84 134Z"
                fill="#e9a03a"
                stroke="#ad6d2c"
                stroke-width="2.5"/>
            </g>

            <!-- Continuous body and neck -->
            <path d="
              M45 96
              Q48 73 78 70
              Q102 68 113 85
              Q115 66 117 48
              Q118 23 133 20
              Q146 17 149 30
              Q153 43 140 48
              Q137 69 134 90
              Q132 111 113 121
              Q91 130 65 120
              Q44 114 45 96Z"
              fill="#f7f7f3"
              stroke="#89929a"
              stroke-width="3.5"
              stroke-linejoin="round"/>

            <!-- Wing -->
            <path class="cw-goose-wing" d="
              Q94 79 112 90
              Q110 107 91 112
              Q73 110 73 88Z"
              fill="#e9ece9"
              stroke="#a6adaf"
              stroke-width="2.5"
              stroke-linejoin="round"/>

            <!-- Beak -->
            <path d="
              M145 34
              Q157 31 166 38
              Q158 44 145 42Z"
              fill="#e9a03a"
              stroke="#ad6d2c"
              stroke-width="2.5"
              stroke-linejoin="round"/>


            <!-- Stolen pencil: visible during mischief only -->
            <g class="cw-goose-stolen-object"
               transform="translate(159 42) rotate(24)">
              <rect x="0" y="-3" width="24" height="6"
                rx="1"
                fill="#f0c65a"
                stroke="#ad8434"
                stroke-width="1.5"/>

              <rect x="0" y="-3" width="5" height="6"
                fill="#ef9ba0"/>

              <path d="M24 -3L31 0L24 3Z"
                fill="#d8b590"
                stroke="#ad8434"
                stroke-width="1"/>

              <path d="M28 -1.3L31 0L28 1.3Z"
                fill="#414141"/>
            </g>


            <!-- Eye -->
            <ellipse class="cw-goose-eye"
              cx="139" cy="29"
              rx="2.7" ry="3.2"
              fill="#31363a"/>

            <path d="M151 40Q157 42 162 39"
              fill="none"
              stroke="#ad6d2c"
              stroke-width="1.7"
              stroke-linecap="round"/>

            <!-- Reserved for future costumes -->
            <g class="cw-goose-accessories"></g>
          </g>
        </svg>

        
        <!-- Sleeping illustration: properly curled-up goose -->
        <svg class="cw-goose-sleeping"
             viewBox="0 0 170 150"
             role="presentation">

          <!-- Ground shadow -->
          <ellipse cx="82" cy="137" rx="48" ry="7"
            fill="#2f3a44" opacity=".10"/>

          <!-- Small tucked tail -->
          <path d="M47 111
            Q34 106 35 95
            Q46 100 57 102
            L60 111Z"
            fill="#f7f7f3"
            stroke="#89929a"
            stroke-width="3"
            stroke-linejoin="round"/>

          <!-- Rounded loaf body -->
          <path d="
            M44 113
            Q44 89 70 82
            Q97 75 119 86
            Q136 95 133 114
            Q130 130 100 134
            Q71 137 50 129
            Q44 124 44 113Z"
            fill="#f7f7f3"
            stroke="#89929a"
            stroke-width="3.5"
            stroke-linejoin="round"/>

          <!-- Folded wing like a blanket -->
          <path d="
            M63 106
            Q84 97 109 105
            Q107 121 86 124
            Q68 122 63 106Z"
            fill="#e9ece9"
            stroke="#a6adaf"
            stroke-width="2.5"
            stroke-linejoin="round"/>

          
          <!-- Soft folded neck, mostly hidden in feathers -->
          <path d="
            M112 105
            Q120 98 115 90
            Q110 82 103 84
            Q99 89 101 96
            Q105 102 112 105Z"
            fill="#f7f7f3"
            stroke="#89929a"
            stroke-width="2.5"
            stroke-linejoin="round"/>


          <!-- Head resting against his back -->
          <ellipse cx="99" cy="91"
            rx="13" ry="11"
            fill="#f7f7f3"
            stroke="#89929a"
            stroke-width="3"/>

          <!-- Closed sleepy eye -->
          <path d="M96 90Q100 93 104 90"
            fill="none"
            stroke="#515960"
            stroke-width="2.3"
            stroke-linecap="round"/>

          <!-- Beak turned back toward his body -->
          <path d="M87 94
            Q77 92 74 98
            Q80 102 88 100Z"
            fill="#e9a03a"
            stroke="#ad6d2c"
            stroke-width="2.5"
            stroke-linejoin="round"/>


          <!-- Tucked feet -->
          <path d="M66 131Q60 136 73 137H85
                   M95 132Q93 137 106 137H117"
            fill="none"
            stroke="#df942f"
            stroke-width="4"
            stroke-linecap="round"/>

          <!-- Future outfit layer -->
          <g class="cw-goose-sleep-accessories"></g>
        </svg>

        <span class="cw-goose-zzz"
              aria-hidden="true">z z Z</span>
      </div>
    `;
  }

  function shouldShowGoose() {
    return Boolean(document.body?.dataset?.page);
  }

  function stopTimer() {
    clearTimeout(behaviorTimer);
    behaviorTimer = null;
  }

  function maxPosition() {
    if (!goose) return position;

    const width = goose.getBoundingClientRect().width;

    // Keep the goose toward the bottom-left of the screen.
    return Math.max(
      12,
      Math.min(280, window.innerWidth - width - 16)
    );
  }

  function setState(next) {
    if (!goose) return;

    state = next;
    goose.dataset.state = next;
  }

  function idle() {
    stopTimer();
    setState("idle");

    behaviorTimer = setTimeout(
      chooseNextBehavior,
      random(7000, 14000)
    );
  }

  
  function walk(mode = "walking") {
     if (!goose || reducedMotion.matches) {
        idle();
        return;
    }

    stopTimer();

    const max = maxPosition();
    const min = Math.min(22, max);

    let destination;

    if (position >= max - 12) {
        destination = min;
    } else if (position <= min + 12) {
        destination = max;
    } else {
        destination = facing === 1 ? max : min;
    }

    if (Math.abs(destination - position) < 5) {
        idle();
        return;
    }

    facing = destination >= position ? 1 : -1;
    goose.dataset.facing = facing === 1 ? "right" : "left";

    const distance = Math.abs(destination - position);

    // Chaos mode moves significantly faster.
    const duration = mode === "chaos"
        ? Math.max(950, Math.round(distance * 9))
        : mode === "stealing"
        ? Math.max(2000, Math.round(distance * 29))
        : Math.max(2000, Math.round(distance * 32));

    goose.style.transition = "none";
    goose.style.left = `${position}px`;

    void goose.offsetWidth;

    setState(mode);

    goose.style.setProperty(
        "--cw-goose-travel-time",
        `${duration}ms`
    );

    goose.style.transition = `left ${duration}ms linear`;
    goose.style.left = `${destination}px`;

    position = destination;

    behaviorTimer = setTimeout(() => {
        if (!goose) return;

        goose.style.transition = "none";

        // Rare incident report after a mischievous adventure.
        if (
        (mode === "stealing" || mode === "chaos") &&
        whimsyEnabled() &&
        Math.random() < 0.10
        ) {
        showGooseIncident();
        }

        idle();
    }, duration);
    }


  function sleep() {
    stopTimer();
    setState("sleeping");

    behaviorTimer = setTimeout(
      chooseNextBehavior,
      random(13000, 24000)
    );
  }

  
/* ==========================================
   GOOSE MISCHIEF SYSTEM
   ========================================== */

function whimsyEnabled() {
  const theme = document.documentElement.dataset.whimsy;

  return Boolean(
    theme &&
    theme !== "off" &&
    theme !== "none"
  );
}

const GOOSE_INCIDENTS = [
  "GOOSE INCIDENT #004: A pencil has been stolen. Authorities notified.",
  "GOOSE INCIDENT #017: The goose has challenged the calendar to single combat.",
  "GOOSE INCIDENT #031: The goose was asked to leave. He declined.",
  "GOOSE INCIDENT #042: Local goose denies all allegations.",
  "GOOSE INCIDENT #056: Suspicious waddling reported near the homework.",
  "GOOSE INCIDENT #063: The goose has requested diplomatic immunity.",
  "GOOSE INCIDENT #078: Witnesses describe the suspect as extremely feathery.",
  "GOOSE INCIDENT #091: The goose has promoted himself to administrator."
];

function showGooseIncident() {
  if (!goose || !whimsyEnabled()) return;

  goose.querySelector(".cw-goose-incident")?.remove();

  const report = document.createElement("div");
  report.className = "cw-goose-incident";

  report.textContent = GOOSE_INCIDENTS[
    Math.floor(Math.random() * GOOSE_INCIDENTS.length)
  ];

  goose.appendChild(report);

  setTimeout(() => report.remove(), 3800);
}

function spontaneousHonk() {
  if (!goose || !whimsyEnabled()) {
    idle();
    return;
  }

  stopTimer();
  setState("idle");

  // Reuse the already-working click-to-HONK animation.
  honk();

  behaviorTimer = setTimeout(
    chooseNextBehavior,
    random(3500, 6000)
  );
}

function chooseNextBehavior() {
 if (!goose || document.hidden) return;

    if (reducedMotion.matches) {
        setState("idle");
        return;
    }

    const roll = Math.random();

    // Without Whimsy Mode, only peaceful behaviors.
    if (!whimsyEnabled()) {
        if (roll < 0.43) {
        idle();
        } else if (roll < 0.77) {
        walk();
        } else {
        sleep();
        }

        return;
    }

    // Whimsy Mode unlocks the goose's criminal tendencies.
    if (roll < 0.30) {
        idle();
    } else if (roll < 0.55) {
        walk();
    } else if (roll < 0.75) {
        sleep();
    } else if (roll < 0.87) {
        walk("stealing");
    } else if (roll < 0.95) {
        spontaneousHonk();
    } else {
        walk("chaos");
    }
  }


  function honk() {
    if (!goose) return;

    clearTimeout(honkTimer);

    goose.classList.remove("cw-goose-honking");
    void goose.offsetWidth;
    goose.classList.add("cw-goose-honking");

    let bubble = goose.querySelector(".cw-goose-honk");

    if (!bubble) {
      bubble = document.createElement("span");
      bubble.className = "cw-goose-honk";
      bubble.textContent = "HONK!";
      goose.appendChild(bubble);
    }

    bubble.classList.remove("cw-goose-honk-show");
    void bubble.offsetWidth;
    bubble.classList.add("cw-goose-honk-show");

    honkTimer = setTimeout(() => {
      goose.classList.remove("cw-goose-honking");
      bubble.remove();
    }, 1400);
  }

  function mountGoose() {
    if (!shouldShowGoose() || !document.body) return;

    document.getElementById(ID)?.remove();

    document.body.insertAdjacentHTML(
      "beforeend",
      gooseMarkup()
    );

    goose = document.getElementById(ID);

    position = Math.min(22, maxPosition());
    goose.style.left = `${position}px`;
    goose.dataset.facing = "right";

    goose.addEventListener("click", honk);

    goose.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        honk();
      }
    });

    // The goose begins as a polite, stationary citizen.
    idle();
  }

  // Keep movement within the viewport after resizing.
  window.addEventListener("resize", () => {
    if (!goose) return;

    stopTimer();
    goose.style.transition = "none";
    position = Math.min(position, maxPosition());
    goose.style.left = `${position}px`;
    idle();
  });

  document.addEventListener("visibilitychange", () => {
    if (!goose) return;

    if (document.hidden) {
      stopTimer();
      goose.style.left =
        `${goose.getBoundingClientRect().left}px`;
      goose.style.transition = "none";
      position = goose.getBoundingClientRect().left;
      setState("idle");
    } else {
      idle();
    }
  });

  reducedMotion.addEventListener("change", () => {
    if (!goose) return;

    stopTimer();
    goose.style.transition = "none";
    position = goose.getBoundingClientRect().left;
    goose.style.left = `${position}px`;
    idle();
  });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      mountGoose,
      {once:true}
    );
  } else {
    mountGoose();
  }
})();


  // Respond immediately when Whimsy Mode changes.
  let previousWhimsy = whimsyEnabled();

  new MutationObserver(() => {
    const enabled = whimsyEnabled();

    if (enabled === previousWhimsy || !goose) return;

    previousWhimsy = enabled;

    // Stop the current activity safely.
    stopTimer();

    const currentLeft = goose.getBoundingClientRect().left;
    goose.style.transition = "none";

    position = Math.max(
      0,
      Math.min(currentLeft, maxPosition())
    );

    goose.style.left = `${position}px`;

    goose.querySelector(".cw-goose-incident")?.remove();

    // Return to a peaceful state before choosing
    // another activity.
    idle();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-whimsy"]
  });

