"use strict";

/* ---------------------------------------------------------------------- */
/* World setup: a seaside village, after Carmel-by-the-Sea                */
/*                                                                        */
/* The ocean runs along the top, then a strip of beach, then the village, */
/* with one cobblestone path zig-zagging through it in a Z:               */
/*                                                                        */
/*   1st stretch (left -> right):  Repair     -> Augmentation             */
/*   2nd stretch (right -> left):  Sound      -> Context                  */
/*   3rd stretch (left -> right):  Individual -> Community & Environment  */
/*                                                                        */
/* Anna starts on the beach and follows the path down to Cafe Lumen.    */
/* ---------------------------------------------------------------------- */

// The map's height is fixed; its width follows the window's shape so the
// overview fills the whole page (see layoutWorld).
const WORLD = { width: 2000, height: 1500 };
const MIN_ASPECT = 1.15; // narrower than this and the shops stop fitting along the path
const SEA = 118; // where the waves wash up
const SAND = 212; // where the beach gives way to grass
const PATH_HALF = 56; // half the width of the cobblestone path
const PATH_INSET = 220; // how far the path's corners sit in from the sides of the map
const PATH_ROWS = [470, 1220]; // the y of the first and last stretches

// Storybook palette: soft greens, warm wood and cream, all outlined in ink.
const INK = "#3e3226";
const COLORS = {
  ink: INK,
  grass: "#95c46a",
  curb: "#e8dcc6",
  sand: "#f0dfb8",
};

// The three stretches of the Z, in the order Anna walks them. Each runs
// from `a` to `b` (set in layoutWorld); its two ends are named on street signs.
const LEGS = [
  { id: "repairAugmentation", from: "Repair", to: "Augmentation", kicker: "First stretch", accent: "#c9793a" },
  { id: "soundContext", from: "Sound", to: "Context", kicker: "Second stretch", accent: "#5b8fa8" },
  { id: "individualCommunity", from: "Individual", to: "Community & Environment", kicker: "Last stretch", accent: "#5f8a3c" },
];
LEGS.forEach((leg) => (leg.name = `${leg.from} → ${leg.to}`));

const SHORE = { id: "shore", name: "The Shore", kicker: "Carmel-by-the-Sea", accent: "#5b8fa8" };

// The whole route as a polyline: down from the beach, then the three stretches.
const ROUTE = [];

// Shops along the path. Each sits on the uphill side of its stretch (`leg`),
// centred `at` that far along it, with its front walk running down to the path.
const buildings = [
  // First stretch: Repair -> Augmentation
  {
    // A little nod to Carmel: a real local landmark, with its name on a sign
    // above the door (it's not a place you can go in).
    leg: 0, at: 0.3, w: 180, h: 118, wall: "#f6e7cf", roof: "#8a6a9c", trim: "#fbf3e6", windows: 2,
    chimney: true, flowerBoxes: true, door: true, doorColor: "#5b8fa8",
    sign: "The Carmel Foundation",
  },
  {
    leg: 0, at: 0.52, w: 170, h: 112, wall: "#fdf3e1", roof: "#b85c3c", trim: "#fff6ea", windows: 2,
    awning: true, door: true, doorColor: "#7a4a36",
  },
  {
    name: "Form Studio", leg: 0, at: 0.74, w: 300, h: 150,
    style: "spa", glow: "#f6c27a",
    door: true, enter: "lab", enterLabel: "enter the Form Studio",
  },
  // Second stretch: Sound -> Context
  {
    leg: 1, at: 0.5, w: 180, h: 116, wall: "#e9eef0", roof: "#5f7f8f", trim: "#f6fafb", windows: 2,
    chimney: true, flowerBoxes: true, door: true, doorColor: "#c9793a",
  },
  {
    // Anna's friend Jamie lives here: inside is "Subtitles for the World".
    name: "Jamie's House", leg: 1, at: 0.8, w: 210, h: 118,
    style: "cottage", door: true,
    enter: "subtitles", enterLabel: "visit Jamie's House",
  },
  // Last stretch: Individual -> Community & Environment
  {
    leg: 2, at: 0.55, w: 170, h: 116, wall: "#f4e2c4", roof: "#6f8f4a", trim: "#fbf2e3", windows: 2,
    chimney: true, flowerBoxes: true, door: true, doorColor: "#b85c3c",
  },
  {
    name: "Cafe Lumen", leg: 2, at: 0.84, w: 340, h: 190, style: "cafe",
    door: true, enter: "cafe", enterLabel: "enter Cafe Lumen",
  },
];

/* ---------------------------------------------------------------------- */
/* People: residents of the map, each with a quote from our research.     */
/* They're scattered at random along their stretch of the path on every   */
/* visit, and share their quote in a speech bubble when Anna walks up.  */
/* `region` is the id of a stretch in LEGS.                               */
/* ---------------------------------------------------------------------- */

const people = [
  {
    name: null, // TBD
    region: "repairAugmentation",
    quote: "hearing better isn't actually hearing louder",
    palette: { skin: "#f1c9a5", hair: "#c7732f", hairStyle: "short", outfit: "#4f86b8", outfitTrim: "#e3eff8" },
  },
  {
    name: "Nathan",
    region: "individualCommunity",
    quote:
      "at some point my friends started getting earplugs, it became normalized, and i ended up buying them too. the main driver for that was the social influence and not the ‘i care about my hearing’",
    palette: { skin: "#e8b98a", hair: "#3c2f22", hairStyle: "short", outfit: "#6b7f94", outfitTrim: "#dde9f4" },
  },
  {
    name: null, // TBD
    region: "soundContext",
    quote: "wearing airpods makes me feel closed to the world",
    palette: { skin: "#8d5a3b", hair: "#1d1713", hairStyle: "short", outfit: "#f2b36b", outfitTrim: "#fff4e8" },
  },
  {
    name: "Michael",
    region: "soundContext",
    quote: "we don't hear sound, we hear meaning",
    palette: { skin: "#d9a27a", hair: "#2b2320", hairStyle: "short", outfit: "#23384d", outfitTrim: "#c6dbea" },
  },
  {
    name: "Laura",
    region: "individualCommunity",
    quote:
      "Loop made themselves so popular... it became an accessory, like jewelry... you're cool if you're wearing loops.",
    palette: { skin: "#f2d0b0", hair: "#b5793f", hairStyle: "medium", outfit: "#e07a2f", outfitTrim: "#fde2c6" },
  },
  {
    name: "Megan",
    region: "repairAugmentation",
    quote:
      "When your eyes go bad... you put readers on to read... whereas when your hearing goes, it has much more to do with your brain than with your ears... you have to wear them even when you're sitting at home reading a book, or else your brain doesn't get used to them.",
    palette: { skin: "#f0c9a4", hair: "#a8a29a", hairStyle: "medium", outfit: "#8fc1e3", outfitTrim: "#f4f8fb" },
  },
  {
    name: "Josephine",
    region: "repairAugmentation",
    quote:
      "If you're in your 40s, you're like, ‘I'm not 70, I'm not ready for that’. And when I was told I needed them, I was very honest. I was like, is there anything else? Can I wait?",
    palette: { skin: "#c98a55", hair: "#241c15", hairStyle: "short", outfit: "#c95f1f", outfitTrim: "#fbd7b5" },
  },
  {
    name: "Arya",
    region: "individualCommunity",
    // Placeholder quote, not from research: replace before sharing.
    quote:
      "if there was a cool place to hangout on a friday night that was made to be easy on the ears, i'd go there all the time",
    palette: { skin: "#b97a56", hair: "#3a2419", hairStyle: "medium", outfit: "#3f7cb0", outfitTrim: "#e3eff8" },
  },
];
people.forEach((p) => (p.facing = "down"));

const QUOTE_REACH = 80; // how close Anna gets before a quote pops up
const PERSON_SPACING = 130; // minimum distance between people on the same stretch

/* Path geometry ---------------------------------------------------------- */

function legPoint(leg, t) {
  return { x: leg.a.x + (leg.b.x - leg.a.x) * t, y: leg.a.y + (leg.b.y - leg.a.y) * t };
}

// The y of a stretch's centre line at a given x.
function legY(leg, x) {
  return legPoint(leg, (x - leg.a.x) / (leg.b.x - leg.a.x)).y;
}

// How far the path's edge sits above its centre line, measured straight up
// (more than PATH_HALF on the sloping middle stretch).
function legHalfHeight(leg) {
  const dx = leg.b.x - leg.a.x, dy = leg.b.y - leg.a.y;
  return (PATH_HALF * Math.hypot(dx, dy)) / Math.abs(dx);
}

// Unit vector pointing away from a stretch on its uphill (seaward) side.
function legNormal(leg) {
  const dx = leg.b.x - leg.a.x, dy = leg.b.y - leg.a.y;
  const len = Math.hypot(dx, dy);
  const n = { x: dy / len, y: -dx / len };
  return n.y > 0 ? { x: -n.x, y: -n.y } : n;
}

// A spot beside a stretch, `t` of the way along it: `side` 1 is uphill,
// -1 downhill, `gap` past the path's edge.
function besidePath(leg, t, side, gap) {
  const p = legPoint(leg, t);
  const n = legNormal(leg);
  const off = side * (PATH_HALF + gap);
  return { x: p.x + n.x * off, y: p.y + n.y * off };
}

function distToSegment(x, y, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t));
}

function distToRoute(x, y) {
  let d = Infinity;
  for (let i = 1; i < ROUTE.length; i++) d = Math.min(d, distToSegment(x, y, ROUTE[i - 1], ROUTE[i]));
  return d;
}

// The wavy lines where the waves wash up, and where the sand meets the grass.
function shoreY(x) {
  return SEA + Math.sin(x / 140) * 10 + Math.sin(x / 57 + 1) * 4;
}
function sandY(x) {
  return SAND + Math.sin(x / 190 + 2) * 12;
}

// Maps a person's random (u, v) in 0..1 to a spot on the grass beside the
// path along their stretch, so they keep their place when the map stretches
// with the window. They stand well back, so Anna can walk anywhere on the
// path without bumping into them or setting off their quotes: she has to
// step off the path toward someone to hear what they have to say.
const PERSON_PATH_GAP = 115; // from the edge of the path to where they stand
function regionPoint(region, u, v) {
  const leg = LEGS.find((l) => l.id === region);
  return besidePath(leg, 0.18 + u * 0.64, v < 0.5 ? 1 : -1, PERSON_PATH_GAP);
}

/* Street signs, lamp posts and greenery ---------------------------------- */

// The names at each end of each stretch, on street signs beside the path.
function streetSigns() {
  const [first, second, last] = LEGS;
  const span = WORLD.width - 2 * PATH_INSET;
  return [
    { text: first.from, ...besidePath(first, 130 / span, 1, 10) },
    { text: first.to, ...besidePath(first, 1 - 90 / span, 1, 10) },
    { text: second.from, ...besidePath(second, 0.14, -1, 70) },
    { text: second.to, ...besidePath(second, 0.93, 1, 10) },
    { text: last.from, ...besidePath(last, 110 / span, -1, 70) },
    { text: last.to, ...besidePath(last, 1 - 170 / span, -1, 70) },
  ];
}

const lamps = [];
const decor = []; // cypress trees, bushes and flower beds, sorted back to front

// Lamp posts along the path, and greenery scattered over the open grass,
// kept clear of the path, the shops and the signs. Seeded, so the village
// looks the same on every visit.
function layoutDecor() {
  const signs = streetSigns();
  const nearShop = (x, y, pad) =>
    buildings.some((b) => x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad + 20);

  lamps.length = 0;
  LEGS.forEach((leg, i) => {
    const len = Math.hypot(leg.b.x - leg.a.x, leg.b.y - leg.a.y);
    let side = i % 2 ? -1 : 1;
    for (let d = 150; d < len - 120; d += 260, side = -side) {
      const lamp = besidePath(leg, d / len, side, 16);
      if (signs.some((s) => Math.hypot(s.x - lamp.x, s.y - lamp.y) < 120)) continue;
      if (lamps.some((l) => Math.hypot(l.x - lamp.x, l.y - lamp.y) < 160)) continue;
      if (nearShop(lamp.x, lamp.y, 30)) continue;
      lamps.push(lamp);
    }
  });

  decor.length = 0;
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const STEP = 150;
  for (let gy = SAND + 60; gy < WORLD.height; gy += STEP * 0.8) {
    for (let gx = 50; gx < WORLD.width - 30; gx += STEP) {
      const x = gx + (rand() - 0.5) * STEP * 0.6;
      const y = gy + (rand() - 0.5) * STEP * 0.5;
      const kind = rand();
      const s = Math.floor(rand() * 1000);
      if (rand() < 0.3) continue; // leave some open meadow
      const type = kind < 0.38 ? "cypress" : kind < 0.75 ? "bush" : "flowers";
      if (y < sandY(x) + 50 || y > WORLD.height - 24) continue;
      if (distToRoute(x, y) < PATH_HALF + (type === "cypress" ? 100 : 55)) continue;
      if (nearShop(x, y, 60)) continue;
      if ([...signs, ...lamps].some((o) => Math.hypot(o.x - x, o.y - y) < 90)) continue;
      decor.push({ type, x, y, seed: s });
    }
  }
  decor.sort((a, b) => a.y - b.y);
}

// Collision boxes for everything on the map, rebuilt whenever it's laid out.
const worldObstacles = [];

function rebuildWorldObstacles() {
  worldObstacles.length = 0;
  worldObstacles.push({ x: 0, y: 0, w: WORLD.width, h: SEA + 10 }); // the sea
  worldObstacles.push(...buildings);
  [...streetSigns(), ...lamps].forEach((p) => worldObstacles.push({ x: p.x - 6, y: p.y - 6, w: 12, h: 10 }));
  decor.forEach((d) => {
    if (d.type === "cypress") worldObstacles.push({ x: d.x - 9, y: d.y - 8, w: 18, h: 12 });
  });
  people.forEach((p) => {
    if (p.u !== undefined) worldObstacles.push({ x: p.x - 12, y: p.y - 8, w: 24, h: 22 });
  });
}

function layoutWorld(aspect) {
  WORLD.width = Math.round(WORLD.height * Math.max(aspect, MIN_ASPECT));
  const left = PATH_INSET, right = WORLD.width - PATH_INSET;
  const [top, bottom] = PATH_ROWS;
  ROUTE.length = 0;
  ROUTE.push(
    { x: left, y: SAND - 6 },
    { x: left, y: top },
    { x: right, y: top },
    { x: left, y: bottom },
    { x: right, y: bottom }
  );
  LEGS.forEach((leg, i) => {
    leg.a = ROUTE[i + 1];
    leg.b = ROUTE[i + 2];
  });

  buildings.forEach((b) => {
    const leg = LEGS[b.leg];
    const cx = legPoint(leg, b.at).x;
    b.x = cx - b.w / 2;
    // Stand just uphill of the path; on the slope, clear of wherever it rises highest.
    const edge = Math.min(legY(leg, b.x), legY(leg, b.x + b.w)) - legHalfHeight(leg);
    b.y = edge - 14 - b.h;
    b.pathY = legY(leg, cx); // where its front walk meets the path
  });

  layoutDecor();
  people.forEach((p) => {
    if (p.u !== undefined) Object.assign(p, regionPoint(p.region, p.u, p.v));
  });
  rebuildWorldObstacles();
}
layoutWorld(window.innerWidth / window.innerHeight);

const cafeBuilding = buildings.find((b) => b.enter === "cafe");

/* ---------------------------------------------------------------------- */
/* Anna: the one character we follow through the map                    */
/* ---------------------------------------------------------------------- */

// She starts on the beach, at the top of the path.
const anna = {
  name: "Anna",
  x: ROUTE[0].x,
  y: SEA + 52,
  facing: "down",
  palette: {
    skin: "#e3b48f",
    hair: "#4a2f23",
    hairStyle: "bun",
    ears: true,
    outfit: "#5f7fa3",
    outfitTrim: "#eef1f3",
  },
};

const CHAR_RADIUS = 16;
const MOVE_SPEED = 210; // px/sec

// Scatter everyone: pick random spots that stay clear of buildings (and their
// doors), of each other, and of where Anna starts.
function scatterPeople() {
  const placed = [];
  const clearOfBuildings = (x, y) =>
    !buildings.some((b) => x > b.x - 60 && x < b.x + b.w + 60 && y > b.y - 60 && y < b.y + b.h + 100);
  // Keep well clear of street signs, so nobody stands in front of a name.
  const signs = streetSigns();
  const props = [...lamps, ...decor.filter((d) => d.type === "cypress")];
  const clearOfProps = (x, y) =>
    signs.every((o) => Math.hypot(x - o.x, y - o.y) > 130) &&
    props.every((o) => Math.hypot(x - o.x, y - o.y) > 50);
  people.forEach((p) => {
    let best = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const u = Math.random(), v = Math.random();
      const pt = regionPoint(p.region, u, v);
      const ok =
        distToRoute(pt.x, pt.y) > PATH_HALF + QUOTE_REACH + 20 && // out of quote range from anywhere on the path
        clearOfBuildings(pt.x, pt.y) &&
        clearOfProps(pt.x, pt.y) &&
        Math.hypot(pt.x - anna.x, pt.y - anna.y) > 120 &&
        placed.every((o) => Math.hypot(pt.x - o.x, pt.y - o.y) > PERSON_SPACING);
      best = { u, v, ...pt };
      if (ok) break;
    }
    Object.assign(p, best);
    placed.push(p);
  });
  rebuildWorldObstacles();
}
scatterPeople();

/* ---------------------------------------------------------------------- */
/* Scene state: world (the grid) -> cafe (inside Cafe Lumen)              */
/*                               -> lab (the Form Studio)                 */
/*                               -> subtitles (Jamie's house)             */
/* ---------------------------------------------------------------------- */

const appEl = document.getElementById("app");
const openLinkEl = document.getElementById("openLink");
const enterPromptEl = document.getElementById("enterPrompt");
let currentScene = "world";

function setScene(scene) {
  currentScene = scene;
  appEl.dataset.scene = scene;
  keys.clear();
  openLinkEl.hidden = true;
  if (scene !== "world") {
    enterPromptEl.hidden = true;
    shownEntrance = null;
    quoteBubbleEl.hidden = true;
    activeSpeaker = null;
  }
}

/* ---------------------------------------------------------------------- */
/* Canvas setup                                                           */
/* ---------------------------------------------------------------------- */

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");

let viewW = 0, viewH = 0, dpr = 1;
let cameraX = 0, cameraY = 0;


function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  viewW = window.innerWidth;
  viewH = window.innerHeight;

  const oldWidth = WORLD.width;
  layoutWorld(viewW / viewH);
  // Inside the cafe or lab Anna is in room coordinates; she's placed back
  // at the door on her way out, so only her position on the map is rescaled.
  if (currentScene === "world") {
    anna.x *= WORLD.width / oldWidth;
    const inside = buildings.find((b) => circleRectCollides(anna.x, anna.y, CHAR_RADIUS, b));
    if (inside) anna.y = inside.y + inside.h + CHAR_RADIUS + 20;
  }

  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  canvas.style.width = viewW + "px";
  canvas.style.height = viewH + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Zoom: the page opens on an overview of the whole village filling the
// window (`fitZoom`), and can zoom in to follow Anna up close.
const FOLLOW_ZOOM = 1;
const MAX_ZOOM = 1.6;
let zoom = 1;
let targetZoom = 1;
let wantOverview = true;
let zoomReady = false;

// In the overview, a resize snaps straight to the new fit instead of easing.
window.addEventListener("resize", () => {
  if (wantOverview) zoomReady = false;
});

function fitZoom() {
  return Math.min(viewW / WORLD.width, viewH / WORLD.height);
}

// 0 in the full overview, 1 once zoomed in far enough to follow Anna.
function followAmount() {
  const fit = fitZoom();
  return clamp((zoom - fit) / (fit * 0.6), 0, 1);
}

// Labels grow as the map zooms out so they stay readable in the overview.
function labelScale(max = 1.7, at = 0.7) {
  return clamp(at / zoom, 1, max);
}

function setZoom(value) {
  const fit = fitZoom();
  targetZoom = clamp(value, fit, MAX_ZOOM);
  wantOverview = targetZoom <= fit * 1.01;
}

function updateCamera(dt) {
  // Hold still while Anna is being dragged, so she stays under the cursor.
  if (draggingAnna) return;
  const fit = fitZoom();
  if (wantOverview) targetZoom = fit;
  targetZoom = clamp(targetZoom, fit, MAX_ZOOM);
  if (!zoomReady) {
    zoom = targetZoom;
    zoomReady = true;
  }
  const ease = 1 - Math.exp(-dt * 5);
  zoom = Math.exp(Math.log(zoom) + (Math.log(targetZoom) - Math.log(zoom)) * ease);

  // Blend between a camera that frames the whole map and one that follows Anna.
  const visW = viewW / zoom, visH = viewH / zoom;
  const overviewX = WORLD.width / 2 - visW / 2;
  const overviewY = WORLD.height / 2 - visH / 2;
  const followX = clamp(anna.x - visW / 2, 0, Math.max(0, WORLD.width - visW));
  const followY = clamp(anna.y - visH / 2, 0, Math.max(0, WORLD.height - visH));
  const t = followAmount();
  cameraX = overviewX + (followX - overviewX) * t;
  cameraY = overviewY + (followY - overviewY) * t;

  appEl.classList.toggle("overview", t < 0.5);
  const inOverview = wantOverview || targetZoom <= fit * 1.05;
  if (inOverview !== zoomToggleShowsOverview) {
    zoomToggleShowsOverview = inOverview;
    zoomToggleEl.textContent = inOverview ? "Zoom in on Anna" : "View the whole map";
  }
}

const zoomToggleEl = document.getElementById("zoomToggle");
let zoomToggleShowsOverview = null;

zoomToggleEl.addEventListener("click", () => {
  if (zoomToggleShowsOverview) setZoom(FOLLOW_ZOOM);
  else setZoom(0);
});
document.getElementById("zoomIn").addEventListener("click", () => setZoom(targetZoom * 1.35));
document.getElementById("zoomOut").addEventListener("click", () => setZoom(targetZoom / 1.35));

canvas.addEventListener(
  "wheel",
  (e) => {
    if (currentScene !== "world") return;
    e.preventDefault();
    setZoom(targetZoom * Math.exp(-e.deltaY * 0.0015));
  },
  { passive: false }
);

/* ---------------------------------------------------------------------- */
/* Input                                                                  */
/* ---------------------------------------------------------------------- */

const keys = new Set();

const MOVE_KEYS = new Set([
  "arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d",
]);

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();

  if (k === "escape") {
    if (currentScene === "cafe") leaveCafe();
    else if (currentScene === "lab") leaveLab();
    else if (currentScene === "subtitles") leaveSubs();
    return;
  }

  if (MOVE_KEYS.has(k)) {
    keys.add(k);
    e.preventDefault();
  }

  if (currentScene === "lab") {
    if ((k === "e" || k === "enter") && appPromptShowing) {
      // The companion app opens in its own tab. Closing that tab brings
      // Anna back to the studio, cuff on.
      e.preventDefault();
      appPromptShowing = false;
      openInNewTab(COMPANION_APP_URL, "Open the Sunny Ears app");
      return;
    }
    if ((k === "e" || k === "enter") && nearPickup()) {
      // The cuff lifts off its stand and floats over onto Anna's ear.
      e.preventDefault();
      cuffFlight = { t: 0 };
      return;
    }
    if ((k === "e" || k === "enter") && nearFitter()) {
      // The fitter shows Anna the product rendering, in its own tab. Closing
      // that tab brings her back to the lab, right where she was.
      e.preventDefault();
      openInNewTab(PRODUCT_RENDERING_URL, "Open the product rendering");
    }
    return;
  }
  if (currentScene === "cafe") {
    if (k === "e" || k === "enter") {
      if (cafeSeated) {
        e.preventDefault();
        standUpFromChat();
      } else if (nearChatTable()) {
        e.preventDefault();
        sitDownToChat();
      }
    }
    return;
  }
  if (currentScene === "subtitles") {
    if (k === "e" || k === "enter" || k === " ") {
      e.preventDefault();
      advanceStory();
    }
    return;
  }
  if (currentScene !== "world") return;

  if (k === "+" || k === "=") setZoom(targetZoom * 1.35);
  if (k === "-" || k === "_") setZoom(targetZoom / 1.35);

  const entrance = entranceNear(anna);
  if ((k === "e" || k === "enter") && entrance) {
    e.preventDefault();
    enterBuilding(entrance);
  }
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (MOVE_KEYS.has(k)) keys.delete(k);
});

window.addEventListener("blur", () => keys.clear());

/* ---------------------------------------------------------------------- */
/* Character + world rendering                                            */
/* ---------------------------------------------------------------------- */

// A Sunny Ears cuff on an ear at (x, y): a short, chunky, polished piece
// clipped over the upper outer rim of the ear (`out` is the direction away
// from the face), with a thin wire curving down from it into the ear. It
// stays on the outer side of the ear, so it never crosses onto the cheek.
function drawHearingAid(g, x, y, out, color) {
  g.save();
  g.lineCap = "round";
  const cx = x + out * 0.4, cy = y - 0.3; // the rim of the ear, as an ellipse
  const rimAt = (a) => ({ x: cx + Math.cos(a) * 2.1 * out, y: cy + Math.sin(a) * 3 });

  // The wire, from the front of the cuff down into the ear
  const start = rimAt(-Math.PI * 0.38);
  g.beginPath();
  g.moveTo(start.x, start.y);
  g.quadraticCurveTo(x + out * 0.2, y - 1.6, x + out * 0.3, y + 0.8);
  g.strokeStyle = "rgba(70,60,50,0.75)";
  g.lineWidth = 0.35;
  g.stroke();

  // The cuff: a short, thick arc over the rim, with a glint on top
  const seg = (width, style) => {
    g.beginPath();
    for (let i = 0; i <= 6; i++) {
      const p = rimAt(-Math.PI * 0.38 + (i / 6) * Math.PI * 0.3);
      if (i) g.lineTo(p.x, p.y);
      else g.moveTo(p.x, p.y);
    }
    g.strokeStyle = style;
    g.lineWidth = width;
    g.stroke();
  };
  seg(1.8, INK);
  seg(1.1, color);
  const glint = rimAt(-Math.PI * 0.27);
  g.beginPath();
  g.arc(glint.x - out * 0.15, glint.y - 0.15, 0.28, 0, Math.PI * 2);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.fill();
  g.restore();
}

// Draws a character at (cx, cy) in the given context, scaled by `scale`.
// `phase` drives the idle/walk animation; `facing` is one of down/up/left/right.
function drawCharacter(g, ch, cx, cy, scale, phase, moving) {
  const p = ch.palette;
  const s = scale;
  // Hand-drawn ink outline, like the rest of the town
  const outline = () => {
    g.strokeStyle = INK;
    g.lineWidth = 1.3;
    g.lineJoin = "round";
    g.stroke();
  };

  g.save();
  g.translate(cx, cy);
  g.scale(s, s);

  const bob = moving ? Math.sin(phase * 10) * 1.4 : Math.sin(phase * 2) * 0.6;
  const stepSwing = moving ? Math.sin(phase * 10) * 6 : 0;

  // Shadow
  g.beginPath();
  g.ellipse(0, 20, 14, 5, 0, 0, Math.PI * 2);
  g.fillStyle = "rgba(46,42,38,0.16)";
  g.fill();

  g.translate(0, bob);

  // Feet / legs
  g.fillStyle = "#3a332b";
  g.beginPath();
  g.ellipse(-6 + stepSwing * 0.2, 17, 4, 3, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(6 - stepSwing * 0.2, 17, 4, 3, 0, 0, Math.PI * 2);
  g.fill();

  // Body (coat)
  g.fillStyle = p.outfit;
  g.beginPath();
  g.moveTo(-13, 14);
  g.quadraticCurveTo(-15, -6, -9, -10);
  g.lineTo(9, -10);
  g.quadraticCurveTo(15, -6, 13, 14);
  g.closePath();
  g.fill();
  outline();

  // Outfit trim
  g.strokeStyle = p.outfitTrim;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -9);
  g.lineTo(0, 13);
  g.stroke();

  // Arms
  g.fillStyle = p.outfit;
  const armSwing = moving ? Math.sin(phase * 10 + Math.PI) * 5 : 0;
  g.beginPath();
  g.ellipse(-13, -1 + armSwing * 0.3, 4, 9, 0.15, 0, Math.PI * 2);
  g.fill();
  outline();
  g.beginPath();
  g.ellipse(13, -1 - armSwing * 0.3, 4, 9, -0.15, 0, Math.PI * 2);
  g.fill();
  outline();

  // Medium-length hair sits behind the head and falls evenly to the jaw on
  // both sides, framing the face without covering it. The two sides stay
  // separate, leaving a gap under the chin.
  if (p.hairStyle === "medium") {
    const backHair = [
      () => {
        g.beginPath();
        g.arc(0, -19, 12.5, Math.PI, Math.PI * 2);
      },
      () => roundRect(g, -12.5, -24, 7, 19, 3.5),
      () => roundRect(g, 5.5, -24, 7, 19, 3.5),
    ];
    // Outline every piece first, then fill them all, so they read as one shape.
    backHair.forEach((shape) => {
      shape();
      outline();
    });
    g.fillStyle = p.hair;
    backHair.forEach((shape) => {
      shape();
      g.fill();
    });
  }

  // A bun: a round topknot on the crown, tucked behind the head so it shows
  // from every side, with a little hair tie where it meets the head.
  if (p.hairStyle === "bun") {
    g.fillStyle = p.hair;
    g.beginPath();
    g.arc(0, -31, 6, 0, Math.PI * 2);
    g.fill();
    outline();
    g.fillStyle = p.outfitTrim;
    roundRect(g, -3.5, -27.5, 7, 2.6, 1.3);
    g.fill();
    outline();
  }

  // Ears, peeking out either side of the head when seen from the front or back.
  const dir = ch.facing;
  const sideways = dir === "left" || dir === "right";
  if (p.ears && !sideways) {
    [-1, 1].forEach((side) => {
      g.fillStyle = p.skin;
      g.beginPath();
      g.ellipse(side * 10.2, -16.5, 2.8, 3.8, 0, 0, Math.PI * 2);
      g.fill();
      outline();
    });
  }

  // Head
  g.fillStyle = p.skin;
  g.beginPath();
  g.arc(0, -18, 10, 0, Math.PI * 2);
  g.fill();
  outline();

  // Seen side-on, one ear sits on the side of the head, behind the face.
  if (p.ears && sideways) {
    const ex = dir === "left" ? 7 : -7;
    g.fillStyle = p.skin;
    g.beginPath();
    g.ellipse(ex, -16.5, 2.6, 3.6, 0, 0, Math.PI * 2);
    g.fill();
    outline();
    g.strokeStyle = "rgba(160,90,70,0.6)";
    g.lineWidth = 1;
    g.beginPath();
    g.arc(ex, -16.5, 1.3, Math.PI * 0.6, Math.PI * 1.6, dir === "right");
    g.stroke();
  }

  // Hearing cuffs. Anna wears a gold one on her right ear once she's picked
  // it up; Jamie wears a pair (`hearingAidPair`). Side-on, it's on whichever
  // ear we can see.
  if (ch.hearingAid && p.ears) {
    if (sideways) {
      const out = dir === "left" ? 1 : -1; // toward the back of the ear
      drawHearingAid(g, out * 7, -16.5, out, ch.hearingAid);
    } else {
      const sides = ch.hearingAidPair ? [-1, 1] : [dir === "up" ? 1 : -1];
      sides.forEach((side) => drawHearingAid(g, side * 10.2, -16.5, side, ch.hearingAid));
    }
  }

  // Hair on top: a short fringe for "medium", hair swept back into the bun
  // for "bun", a close crop for "short". All stop above the face and are
  // symmetrical.
  g.fillStyle = p.hair;
  g.beginPath();
  if (p.hairStyle === "medium" || p.hairStyle === "bun") {
    g.arc(0, -19, 10.5, Math.PI * 1.08, Math.PI * 1.92);
  } else {
    g.arc(0, -20, 10.5, Math.PI * 1.0, Math.PI * 2.0);
  }
  g.closePath();
  g.fill();
  outline();

  // A simple, cute face: two dot eyes and rosy cheeks, turned the way they're
  // facing (nothing when facing away).
  if (dir !== "up") {
    const shift = dir === "left" ? -3.5 : dir === "right" ? 3.5 : 0;
    g.fillStyle = "rgba(226,120,110,0.35)";
    [-6, 6].forEach((x) => {
      if (Math.abs(x + shift) > 8) return;
      g.beginPath();
      g.ellipse(x + shift, -13.5, 2.2, 1.4, 0, 0, Math.PI * 2);
      g.fill();
    });
    g.fillStyle = INK;
    [-3.5, 3.5].forEach((x) => {
      g.beginPath();
      g.arc(x + shift, -16.5, 1.3, 0, Math.PI * 2);
      g.fill();
    });
  }

  g.restore();
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// A storybook shop: pitched shingle roof, arched upper windows, a striped
// awning over framed shop windows, and a front door, all outlined in ink.
function drawBuilding(g, b) {
  const special = { spa: drawSpaStore, cafe: drawCafeStore, cottage: drawCottage }[b.style];
  if (special) {
    special(g, b);
    drawBuildingName(g, b);
    return;
  }
  const { x, y, w, h } = b;
  g.lineJoin = "round";

  // Shadow on the ground
  g.fillStyle = "rgba(60,40,20,0.18)";
  roundRect(g, x - 4, y + 10, w + 12, h, 10);
  g.fill();

  // Walls
  g.fillStyle = b.wall;
  roundRect(g, x, y, w, h, 6);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();

  // A stone chimney poking up through the roof
  if (b.chimney) {
    const cx = x + w * 0.72;
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.fillStyle = "#b9a58c";
    roundRect(g, cx - 9, y - 44, 18, 40, 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#8f7b63";
    roundRect(g, cx - 12, y - 49, 24, 7, 2);
    g.fill();
    g.stroke();
  }

  // Pitched roof with rows of scalloped shingles
  const roof = () => {
    g.beginPath();
    g.moveTo(x - 12, y + 16);
    g.lineTo(x + 8, y - 26);
    g.lineTo(x + w - 8, y - 26);
    g.lineTo(x + w + 12, y + 16);
    g.closePath();
  };
  roof();
  g.fillStyle = b.roof;
  g.fill();
  g.save();
  roof();
  g.clip();
  g.strokeStyle = "rgba(40,20,10,0.22)";
  g.lineWidth = 1.2;
  for (let row = 0, ry = y - 20; ry < y + 16; row++, ry += 9) {
    g.beginPath();
    for (let sx = x - 12 + (row % 2) * 7; sx < x + w + 12; sx += 14) {
      g.moveTo(sx, ry);
      g.arc(sx + 7, ry, 7, Math.PI, 0, true);
    }
    g.stroke();
  }
  g.restore();
  roof();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();

  const frame = (fx, fy, fw, fh, arched) => {
    g.beginPath();
    if (arched) {
      g.moveTo(fx, fy + fh);
      g.lineTo(fx, fy + fw / 2);
      g.arc(fx + fw / 2, fy + fw / 2, fw / 2, Math.PI, 0);
      g.lineTo(fx + fw, fy + fh);
      g.closePath();
    } else {
      g.rect(fx, fy, fw, fh);
    }
    g.fillStyle = "#fffaf0";
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.stroke();
    // Glass and mullions
    g.save();
    g.clip();
    g.fillStyle = b.windowColor || "#cfe6ee";
    g.fillRect(fx + 3, fy + 3, fw - 6, fh - 6);
    g.fillStyle = "rgba(255,255,255,0.45)";
    g.beginPath();
    g.moveTo(fx + 4, fy + fh - 6);
    g.lineTo(fx + fw * 0.55, fy + 4);
    g.lineTo(fx + fw * 0.75, fy + 4);
    g.lineTo(fx + 8, fy + fh - 4);
    g.closePath();
    g.fill();
    g.restore();
    g.strokeStyle = INK;
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(fx + fw / 2, fy + 3);
    g.lineTo(fx + fw / 2, fy + fh - 3);
    g.moveTo(fx + 3, fy + fh / 2 + (arched ? 4 : 0));
    g.lineTo(fx + fw - 3, fy + fh / 2 + (arched ? 4 : 0));
    g.stroke();
  };

  // Upper floor: small arched windows (only tall buildings have room)
  if (h >= 160) {
    const upper = Math.max(2, b.windows);
    const upGap = (w - upper * 22) / (upper + 1);
    for (let i = 0; i < upper; i++) frame(x + upGap + i * (22 + upGap), y + 30, 22, 30, true);
  }

  // Ground floor: shop windows either side of the door
  const cols = b.windows;
  const winW = 30, winH = 34;
  const gap = (w - cols * winW) / (cols + 1);
  const winY = y + h - winH - 18;
  for (let i = 0; i < cols; i++) frame(x + gap + i * (winW + gap), winY, winW, winH, false);

  // Window boxes spilling over with flowers
  if (b.flowerBoxes) {
    const blooms = ["#e8889a", "#f2cf5b", "#a58ad0", "#e0664f"];
    for (let i = 0; i < cols; i++) {
      const fx = x + gap + i * (winW + gap);
      g.fillStyle = "#5e8f3e";
      g.beginPath();
      g.ellipse(fx + winW / 2, winY + winH - 1, winW / 2 + 2, 5, 0, 0, Math.PI * 2);
      g.fill();
      for (let f = 0; f < 4; f++) {
        g.fillStyle = blooms[(i + f) % blooms.length];
        g.beginPath();
        g.arc(fx + 3 + f * ((winW - 6) / 3), winY + winH - 3 + (f % 2) * 2, 3, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "#9a653b";
      roundRect(g, fx - 3, winY + winH + 1, winW + 6, 7, 2);
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = 1.5;
      g.stroke();
    }
  }

  // Striped, scalloped awning over the shop front
  if (b.awning) {
    const ay = winY - 26, ah = 18;
    const stripes = Math.max(6, Math.round(w / 22));
    const sw = (w + 8) / stripes;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? b.trim || "#fff4e8" : b.roof;
      g.beginPath();
      g.moveTo(x - 4 + i * sw, ay);
      g.lineTo(x - 4 + (i + 1) * sw, ay);
      g.lineTo(x - 4 + (i + 1) * sw, ay + ah);
      g.arc(x - 4 + (i + 0.5) * sw, ay + ah, sw / 2, 0, Math.PI);
      g.closePath();
      g.fill();
    }
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 4, ay + ah);
    g.lineTo(x - 4, ay);
    g.lineTo(x + w + 4, ay);
    g.lineTo(x + w + 4, ay + ah);
    for (let i = stripes - 1; i >= 0; i--) {
      g.arc(x - 4 + (i + 0.5) * sw, ay + ah, sw / 2, 0, Math.PI);
    }
    g.stroke();
  }

  if (b.door) {
    const dx = x + w / 2;
    const dy = y + h;
    // Warm light and a little stone step
    g.fillStyle = "rgba(243,213,154,0.35)";
    g.beginPath();
    g.ellipse(dx, dy + 8, 32, 10, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#d9cdb8";
    roundRect(g, dx - 22, dy - 2, 44, 9, 3);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    g.stroke();
    // Door with a rounded top
    g.beginPath();
    g.moveTo(dx - 15, dy - 1);
    g.lineTo(dx - 15, dy - 34);
    g.arc(dx, dy - 34, 15, Math.PI, 0);
    g.lineTo(dx + 15, dy - 1);
    g.closePath();
    g.fillStyle = b.doorColor || "#7a4a36";
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "#f3d59a";
    g.beginPath();
    g.arc(dx, dy - 34, 7, Math.PI, 0);
    g.lineTo(dx + 7, dy - 28);
    g.lineTo(dx - 7, dy - 28);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#f2cf5b";
    g.beginPath();
    g.arc(dx + 9, dy - 16, 2, 0, Math.PI * 2);
    g.fill();
  }

  if (b.sign) drawHouseSign(g, b);
  drawBuildingName(g, b);
}

// A painted wooden sign on the front wall, between the roof and the door.
function drawHouseSign(g, b) {
  const cx = b.x + b.w / 2, cy = b.y + 40;
  g.font = `600 13px "Cormorant Garamond", Georgia, serif`;
  const sw = g.measureText(b.sign).width + 18, sh = 19;
  g.fillStyle = "rgba(60,40,20,0.2)";
  roundRect(g, cx - sw / 2 + 2, cy - sh / 2 + 3, sw, sh, 4);
  g.fill();
  roundRect(g, cx - sw / 2, cy - sh / 2, sw, sh, 4);
  g.fillStyle = "#7a5236";
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  g.stroke();
  roundRect(g, cx - sw / 2 + 3, cy - sh / 2 + 3, sw - 6, sh - 6, 2.5);
  g.fillStyle = "#fbf3e6";
  g.fill();
  g.fillStyle = "#4a3426";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(b.sign, cx, cy + 0.5);
}

function drawBuildingName(g, b) {
  if (!b.name) return;
  const { x, y, w, h } = b;
  const k = labelScale(2.4, 0.9);
  g.font = `700 ${13 * k}px Inter, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.lineWidth = 4 * Math.min(k, 1.6);
  g.strokeStyle = "rgba(253,247,234,0.9)";
  g.strokeText(b.name, x + w / 2, y + h + 12 + 14 * k);
  g.fillStyle = INK;
  g.fillText(b.name, x + w / 2, y + h + 12 + 14 * k);
}

// A cozy, modern cafe front for the evening: a thin dark roof over warm wood
// slats with a glowing round logo, a slim black canopy strung with festoon
// lights, and big steel-framed windows glowing amber, with pendant lamps
// and people chatting inside. Out front, a little terrace: bistro tables,
// potted olive trees and a chalkboard sign.
function drawCafeStore(g, b) {
  const { x, y, w, h } = b;
  const breathe = 0.85 + 0.15 * Math.sin(animPhase * 1.1);
  const dx = x + w / 2, ground = y + h;
  g.lineJoin = "round";
  const outlined = (width = 2) => {
    g.strokeStyle = INK;
    g.lineWidth = width;
    g.stroke();
  };

  // Shadow, and warm light spilling out onto the ground
  g.fillStyle = "rgba(60,40,20,0.18)";
  roundRect(g, x - 4, y + 10, w + 12, h, 10);
  g.fill();
  g.save();
  g.globalAlpha = 0.32 * breathe;
  g.fillStyle = "#ffc879";
  g.beginPath();
  g.ellipse(dx, ground + 8, w * 0.48, 16, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // The building: charcoal below, warm wood slats above
  const roofH = 14, bandBottom = y + 80;
  roundRect(g, x, y + roofH - 4, w, h - roofH + 4, 6);
  g.fillStyle = "#2f2a26";
  g.fill();
  outlined(2.5);
  g.fillStyle = "#a8744a";
  g.fillRect(x + 2, y + roofH, w - 4, bandBottom - y - roofH);
  g.fillStyle = "#8a5a38";
  for (let sx = x + 6; sx < x + w - 4; sx += 9) g.fillRect(sx, y + roofH, 4, bandBottom - y - roofH);
  g.beginPath();
  g.rect(x + 2, y + roofH, w - 4, bandBottom - y - roofH);
  outlined(1.5);

  // The thin flat roof
  roundRect(g, x - 8, y, w + 16, roofH, 4);
  g.fillStyle = "#26211e";
  g.fill();
  outlined(2.5);

  // A glowing round logo: a little cup of coffee, steaming
  const lx = dx, ly = y + roofH + (bandBottom - y - roofH) / 2;
  g.save();
  g.shadowColor = "#ffc879";
  g.shadowBlur = 14 * breathe;
  g.beginPath();
  g.arc(lx, ly, 22, 0, Math.PI * 2);
  g.fillStyle = "#2a2420";
  g.fill();
  g.strokeStyle = "#ffd28f";
  g.lineWidth = 2.5;
  g.stroke();
  g.restore();
  g.beginPath();
  g.arc(lx, ly, 22, 0, Math.PI * 2);
  outlined(1.5);
  g.strokeStyle = "#ffd28f";
  g.lineWidth = 2;
  g.lineCap = "round";
  g.beginPath(); // the cup
  g.moveTo(lx - 8, ly - 1);
  g.lineTo(lx - 6, ly + 8);
  g.lineTo(lx + 6, ly + 8);
  g.lineTo(lx + 8, ly - 1);
  g.closePath();
  g.stroke();
  g.beginPath(); // its handle
  g.arc(lx + 9.5, ly + 3, 3, -Math.PI / 2, Math.PI / 2);
  g.stroke();
  for (let i = 0; i < 2; i++) { // steam
    const sway = Math.sin(animPhase * 2 + i * 2) * 1.5;
    g.beginPath();
    g.moveTo(lx - 3 + i * 6, ly - 4);
    g.quadraticCurveTo(lx - 6 + i * 6 + sway, ly - 9, lx - 3 + i * 6, ly - 14);
    g.stroke();
  }

  // Big glowing windows, steel-framed, with the door in the middle
  const glassTop = bandBottom + 10, glassBottom = ground - 4, doorW = 44;
  const panes = [
    { x: x + 14, w: dx - doorW / 2 - 8 - (x + 14) },
    { x: dx + doorW / 2 + 8, w: x + w - 14 - (dx + doorW / 2 + 8) },
  ];
  const warm = g.createLinearGradient(0, glassTop, 0, glassBottom);
  warm.addColorStop(0, "#ffd69a");
  warm.addColorStop(1, "#e79a52");
  panes.forEach((p, side) => {
    roundRect(g, p.x, glassTop, p.w, glassBottom - glassTop, 3);
    g.fillStyle = warm;
    g.fill();
    g.save();
    roundRect(g, p.x, glassTop, p.w, glassBottom - glassTop, 3);
    g.clip();
    // Pendant lamps hanging inside
    for (let k = 0; k < 3; k++) {
      const px = p.x + p.w * (0.2 + k * 0.3);
      const py = glassTop + 22 + (k % 2) * 6;
      g.strokeStyle = "rgba(60,35,20,0.5)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(px, glassTop);
      g.lineTo(px, py - 4);
      g.stroke();
      g.fillStyle = `rgba(255,248,225,${0.75 + 0.25 * Math.sin(animPhase * 1.6 + k + side)})`;
      g.beginPath();
      g.arc(px, py, 4.5, 0, Math.PI * 2);
      g.fill();
    }
    // People inside, chatting at a table, and a leafy plant
    g.fillStyle = "rgba(70,40,28,0.55)";
    const tx = p.x + p.w * (side ? 0.4 : 0.55), floor = glassBottom;
    [-14, 14].forEach((o, n) => {
      const bob = Math.sin(animPhase * 2.2 + n * 1.7 + side) * 0.8;
      g.beginPath();
      g.arc(tx + o, floor - 30 + bob, 6, 0, Math.PI * 2); // head
      g.fill();
      roundRect(g, tx + o - 8, floor - 24 + bob, 16, 24, 6); // shoulders
      g.fill();
    });
    g.fillRect(tx - 9, floor - 18, 18, 3); // the table between them
    g.fillStyle = "rgba(60,80,45,0.5)";
    const plantX = side ? p.x + p.w - 14 : p.x + 12;
    [[0, -16, 8], [-6, -24, 6], [6, -26, 6]].forEach(([ox, oy, r]) => {
      g.beginPath();
      g.ellipse(plantX + ox, floor + oy, r * 0.7, r, ox * 0.06, 0, Math.PI * 2);
      g.fill();
    });
    // A soft reflection across the glass
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.beginPath();
    g.moveTo(p.x + p.w * 0.6, glassTop);
    g.lineTo(p.x + p.w * 0.6 + 14, glassTop);
    g.lineTo(p.x + p.w * 0.6 - 10, glassBottom);
    g.lineTo(p.x + p.w * 0.6 - 24, glassBottom);
    g.closePath();
    g.fill();
    g.restore();
    // Black steel frame and mullions
    roundRect(g, p.x, glassTop, p.w, glassBottom - glassTop, 3);
    g.strokeStyle = "#1c1916";
    g.lineWidth = 3;
    g.stroke();
    g.lineWidth = 2;
    g.beginPath();
    for (let m = 1; m < 3; m++) {
      g.moveTo(p.x + (p.w * m) / 3, glassTop);
      g.lineTo(p.x + (p.w * m) / 3, glassBottom);
    }
    g.stroke();
  });

  // The glass door, a touch brighter, with a long wooden handle
  const doorTop = glassTop + 4;
  roundRect(g, dx - doorW / 2, doorTop, doorW, ground - doorTop, 3);
  g.fillStyle = "#ffe0ad";
  g.fill();
  g.strokeStyle = "#1c1916";
  g.lineWidth = 3;
  g.stroke();
  roundRect(g, dx + 8, doorTop + 18, 4, 26, 2);
  g.fillStyle = "#a8744a";
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.stroke();

  // A slim black canopy over the windows, with little downlights under it
  const canopyY = bandBottom + 2;
  roundRect(g, x - 6, canopyY, w + 12, 7, 3);
  g.fillStyle = "#1f1b18";
  g.fill();
  outlined(2);
  for (let k = 0; k < 6; k++) {
    const cx = x + 30 + k * ((w - 60) / 5);
    g.fillStyle = "rgba(255,214,150,0.22)";
    g.beginPath();
    g.moveTo(cx - 3, canopyY + 7);
    g.lineTo(cx + 3, canopyY + 7);
    g.lineTo(cx + 10, canopyY + 26);
    g.lineTo(cx - 10, canopyY + 26);
    g.closePath();
    g.fill();
    g.fillStyle = "#fff1cf";
    g.fillRect(cx - 2, canopyY + 6, 4, 2);
  }

  // Festoon lights draped along the front of the canopy
  const lights = [];
  const anchors = [x - 4, x + w * 0.34, x + w * 0.66, x + w + 4];
  g.strokeStyle = "#2a2420";
  g.lineWidth = 1.2;
  g.beginPath();
  for (let a = 0; a < anchors.length - 1; a++) {
    const ax = anchors[a], bx = anchors[a + 1];
    for (let i = 0; i <= 12; i++) {
      const f = i / 12;
      const px = ax + (bx - ax) * f, py = canopyY + 9 + Math.sin(f * Math.PI) * 10;
      if (a === 0 && i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
      if (i % 3 === 1) lights.push({ x: px, y: py + 2.5 });
    }
  }
  g.stroke();
  lights.forEach((l, i) => {
    const glow = 0.7 + 0.3 * Math.sin(animPhase * 2 + i * 1.3);
    g.fillStyle = `rgba(255,200,110,${0.28 * glow})`;
    g.beginPath();
    g.arc(l.x, l.y, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgba(255,236,190,${0.85 + 0.15 * glow})`;
    g.beginPath();
    g.arc(l.x, l.y, 2.3, 0, Math.PI * 2);
    g.fill();
  });

  // The terrace: bistro tables with a chair either side
  [x + 66, x + w - 66].forEach((tx, n) => {
    [-14, 14].forEach((o) => {
      g.strokeStyle = "#1c1916";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(tx + o, ground + 4);
      g.lineTo(tx + o, ground - 10);
      g.lineTo(tx + o + (o > 0 ? 5 : -5), ground - 18);
      g.stroke();
    });
    g.strokeStyle = "#1c1916";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(tx, ground + 4);
    g.lineTo(tx, ground - 10);
    g.stroke();
    g.beginPath();
    g.ellipse(tx, ground - 11, 12, 3.5, 0, 0, Math.PI * 2);
    g.fillStyle = "#c9a27a";
    g.fill();
    outlined(1.4);
    g.beginPath(); // a cup on the table
    g.arc(tx + (n ? -4 : 4), ground - 13, 2.2, 0, Math.PI * 2);
    g.fillStyle = "#f6efe2";
    g.fill();
  });

  // Potted olive trees at the corners
  [x + 10, x + w - 10].forEach((ox, n) => {
    roundRect(g, ox - 8, ground - 14, 16, 16, 3);
    g.fillStyle = "#3a3330";
    g.fill();
    outlined(1.5);
    g.strokeStyle = "#5a4636";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(ox, ground - 14);
    g.lineTo(ox + (n ? -2 : 2), ground - 32);
    g.stroke();
    const sway = Math.sin(animPhase * 1.2 + n) * 1;
    [[0, -40, 11], [-7, -34, 7], [7, -33, 7]].forEach(([fx, fy, r]) => {
      g.beginPath();
      g.arc(ox + fx + sway, ground + fy, r, 0, Math.PI * 2);
      g.fillStyle = "#8aa36a";
      g.fill();
      outlined(1.2);
    });
  });

  // A chalkboard sign by the door
  const cx = dx + doorW / 2 + 18;
  g.beginPath();
  g.moveTo(cx - 7, ground + 4);
  g.lineTo(cx - 5, ground - 16);
  g.lineTo(cx + 5, ground - 16);
  g.lineTo(cx + 7, ground + 4);
  g.closePath();
  g.fillStyle = "#2b302c";
  g.fill();
  outlined(1.5);
  g.strokeStyle = "rgba(255,248,230,0.75)";
  g.lineWidth = 0.9;
  g.beginPath();
  [[-10, 4], [-6, 5], [-2, 3]].forEach(([yy, half]) => {
    g.moveTo(cx - half, ground + yy);
    g.lineTo(cx + half, ground + yy);
  });
  g.stroke();
}

// Jamie's cottage, straight out of a storybook: a round, golden thatched
// roof with a little eyebrow window peeking out of it, a stone chimney,
// cream walls on a stone base, shuttered windows with
// heart cut-outs and flower boxes, roses climbing the corner, a round-topped
// sage door with a lantern, and a white picket fence round a flower garden.
function drawCottage(g, b) {
  const { x, y, w, h } = b;
  const ground = y + h, dx = x + w / 2;
  g.lineJoin = "round";
  g.lineCap = "round";
  const outlined = (width = 2) => {
    g.strokeStyle = INK;
    g.lineWidth = width;
    g.stroke();
  };

  // Shadow
  g.fillStyle = "rgba(60,40,20,0.18)";
  roundRect(g, x - 2, y + 30, w + 10, h - 26, 14);
  g.fill();

  // The stone chimney
  const chX = x + w * 0.76;
  roundRect(g, chX - 10, y - 20, 20, 40, 3);
  g.fillStyle = "#b9ab98";
  g.fill();
  outlined(2);
  g.fillStyle = "rgba(90,75,60,0.35)";
  [[-6, -14, 8], [2, -6, 7], [-5, 2, 7], [3, 10, 6]].forEach(([ox, oy, sw]) => {
    roundRect(g, chX + ox, y + oy, sw, 5, 2);
    g.fill();
  });
  roundRect(g, chX - 12, y - 24, 24, 6, 2);
  g.fillStyle = "#9c8e7c";
  g.fill();
  outlined(1.6);

  // Walls: cream plaster on a stone base
  const wallTop = y + 40;
  roundRect(g, x + 6, wallTop, w - 12, ground - wallTop, 8);
  g.fillStyle = "#fbf1de";
  g.fill();
  outlined(2.5);
  g.save();
  roundRect(g, x + 6, wallTop, w - 12, ground - wallTop, 8);
  g.clip();
  g.fillStyle = "#cbbca6";
  g.fillRect(x, ground - 14, w, 14);
  g.fillStyle = "#b3a38c";
  for (let sx = x + 8, k = 0; sx < x + w - 6; sx += 14, k++) {
    roundRect(g, sx + (k % 2) * 3, ground - 12 + (k % 2) * 4, 11, 6, 3);
    g.fill();
  }
  g.restore();

  // Shuttered windows with heart cut-outs, and flower boxes below
  [x + 40, x + w - 40].forEach((wx, n) => {
    const wy = wallTop + 34, ww = 24, wh = 24;
    roundRect(g, wx - ww / 2, wy - wh / 2, ww, wh, 4);
    g.fillStyle = "#ffe6b5";
    g.fill();
    outlined(2);
    g.strokeStyle = "#a8744a";
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(wx, wy - wh / 2);
    g.lineTo(wx, wy + wh / 2);
    g.moveTo(wx - ww / 2, wy);
    g.lineTo(wx + ww / 2, wy);
    g.stroke();
    [-1, 1].forEach((side) => {
      const sx = wx + side * (ww / 2 + 6);
      roundRect(g, sx - 5, wy - wh / 2 - 1, 10, wh + 2, 2);
      g.fillStyle = "#8fb7d6";
      g.fill();
      outlined(1.5);
      // a little heart cut into each shutter
      g.fillStyle = "#4f7795";
      g.beginPath();
      g.arc(sx - 1.2, wy - 3, 1.4, 0, Math.PI * 2);
      g.arc(sx + 1.2, wy - 3, 1.4, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(sx - 2.6, wy - 2.6);
      g.lineTo(sx, wy + 0.8);
      g.lineTo(sx + 2.6, wy - 2.6);
      g.closePath();
      g.fill();
    });
    roundRect(g, wx - 16, wy + wh / 2 + 1, 32, 7, 2);
    g.fillStyle = "#a8744a";
    g.fill();
    outlined(1.4);
    ["#f29bb0", "#ffd166", "#f7f2ff", "#e8889a", "#ffd166"].forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.arc(wx - 12 + i * 6, wy + wh / 2 + Math.sin(i * 2 + n) * 1.2, 2.6, 0, Math.PI * 2);
      g.fill();
    });
  });

  // The round-topped door, painted sage, with a little round window, a
  // knob, a stone step and a lantern beside it
  const doorW = 28, doorTop = ground - 46;
  const door = () => {
    g.beginPath();
    g.moveTo(dx - doorW / 2, ground);
    g.lineTo(dx - doorW / 2, doorTop + doorW / 2);
    g.arc(dx, doorTop + doorW / 2, doorW / 2, Math.PI, 0);
    g.lineTo(dx + doorW / 2, ground);
    g.closePath();
  };
  door();
  g.fillStyle = "#7fa07a";
  g.fill();
  outlined(2.2);
  g.strokeStyle = "rgba(40,60,40,0.3)";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(dx - 5, doorTop + 10);
  g.lineTo(dx - 5, ground - 2);
  g.moveTo(dx + 5, doorTop + 10);
  g.lineTo(dx + 5, ground - 2);
  g.stroke();
  g.beginPath();
  g.arc(dx, doorTop + 13, 5, 0, Math.PI * 2);
  g.fillStyle = "#ffe6b5";
  g.fill();
  outlined(1.4);
  g.beginPath();
  g.arc(dx + 8, ground - 20, 1.8, 0, Math.PI * 2);
  g.fillStyle = "#e0b04a";
  g.fill();
  roundRect(g, dx - 20, ground - 2, 40, 5, 2);
  g.fillStyle = "#cbbca6";
  g.fill();
  outlined(1.4);
  const lx = dx + doorW / 2 + 9, ly = ground - 34;
  g.fillStyle = `rgba(255,214,140,${0.3 + 0.1 * Math.sin(animPhase * 2)})`;
  g.beginPath();
  g.arc(lx, ly, 8, 0, Math.PI * 2);
  g.fill();
  roundRect(g, lx - 3.5, ly - 5, 7, 10, 2);
  g.fillStyle = "#ffe3a3";
  g.fill();
  outlined(1.2);

  // Roses climbing the left corner
  g.strokeStyle = "#5e8f3e";
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(x + 12, ground - 2);
  g.bezierCurveTo(x + 4, ground - 30, x + 22, ground - 50, x + 12, wallTop + 4);
  g.stroke();
  [[x + 9, ground - 16], [x + 13, ground - 32], [x + 15, ground - 48], [x + 11, wallTop + 10]].forEach(([rx, ry], i) => {
    g.fillStyle = "#79ad4f";
    g.beginPath();
    g.ellipse(rx + (i % 2 ? -4 : 4), ry + 2, 3, 1.8, 0.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = i % 2 ? "#e8889a" : "#f29bb0";
    g.beginPath();
    g.arc(rx, ry, 3, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(150,50,70,0.5)";
    g.lineWidth = 0.8;
    g.beginPath();
    g.arc(rx, ry, 1.4, 0, Math.PI * 1.5);
    g.stroke();
  });

  // The thatched roof: a big, soft, rounded mound of golden straw with a
  // scalloped edge, overhanging the walls
  const eaveY = wallTop + 8, left = x - 12, right = x + w + 12;
  const roof = () => {
    g.beginPath();
    g.moveTo(left, eaveY);
    g.bezierCurveTo(left - 4, y - 6, x + w * 0.28, y - 14, dx, y - 12);
    g.bezierCurveTo(x + w * 0.72, y - 14, right + 4, y - 6, right, eaveY);
    const bumps = 9;
    for (let i = bumps; i > 0; i--) {
      const bx0 = left + ((right - left) * i) / bumps;
      const bx1 = left + ((right - left) * (i - 1)) / bumps;
      g.quadraticCurveTo((bx0 + bx1) / 2, eaveY + 9, bx1, eaveY);
    }
    g.closePath();
  };
  roof();
  const straw = g.createLinearGradient(0, y - 12, 0, eaveY + 8);
  straw.addColorStop(0, "#e9bd6c");
  straw.addColorStop(1, "#c98f45");
  g.fillStyle = straw;
  g.fill();
  g.save();
  roof();
  g.clip();
  g.strokeStyle = "rgba(140,90,40,0.35)";
  g.lineWidth = 1.2;
  for (let row = 0; row < 5; row++) {
    const ry = y + row * 11;
    for (let sx = left + (row % 2) * 7; sx < right; sx += 14) {
      g.beginPath();
      g.moveTo(sx, ry);
      g.quadraticCurveTo(sx + 3, ry + 5, sx + 1, ry + 10);
      g.stroke();
    }
  }
  // A rounded ridge along the top
  g.strokeStyle = "rgba(255,236,190,0.6)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x + w * 0.12, y + 4);
  g.quadraticCurveTo(dx, y - 16, x + w * 0.88, y + 4);
  g.stroke();
  g.restore();
  roof();
  outlined(2.5);

  // The eyebrow window peeking out of the thatch
  const ex = x + w * 0.32, ey = y + 18;
  g.beginPath();
  g.ellipse(ex, ey + 2, 20, 12, 0, Math.PI, 0);
  g.fillStyle = "#d9a75a";
  g.fill();
  outlined(1.8);
  g.beginPath();
  g.arc(ex, ey + 6, 8, Math.PI, 0);
  g.closePath();
  g.fillStyle = "#ffe6b5";
  g.fill();
  outlined(1.6);
  g.strokeStyle = "#a8744a";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(ex, ey - 2);
  g.lineTo(ex, ey + 6);
  g.stroke();

  // A white picket fence round a little flower garden, either side of the path
  [[x + 2, dx - 26], [dx + 26, x + w - 2]].forEach(([fx0, fx1], side) => {
    const fy = ground + 4;
    // flowers behind the fence
    for (let fx = fx0 + 6; fx < fx1 - 2; fx += 9) {
      g.fillStyle = "#6aa04a";
      g.beginPath();
      g.arc(fx, fy - 4, 4, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = ["#f29bb0", "#ffd166", "#b7a6f0", "#f7f2ff"][Math.round((fx - fx0) / 9 + side) % 4];
      g.beginPath();
      g.arc(fx + 1, fy - 7, 2.3, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = INK;
    g.lineWidth = 1.3;
    g.fillStyle = "#fffaf0";
    for (let px = fx0; px <= fx1; px += 8) {
      g.beginPath();
      g.moveTo(px - 2, fy + 4);
      g.lineTo(px - 2, fy - 6);
      g.lineTo(px, fy - 9);
      g.lineTo(px + 2, fy - 6);
      g.lineTo(px + 2, fy + 4);
      g.closePath();
      g.fill();
      g.stroke();
    }
    roundRect(g, fx0 - 2, fy - 3, fx1 - fx0 + 4, 3, 1);
    g.fill();
    g.stroke();
  });
}

// A modern spa pavilion: warm plaster walls under a thin flat roof planted
// with moss, timber slat screens with lamplight glowing through the gaps, a
// tall arched glass doorway, and grasses and smooth stones along the front.
// A wisp of steam drifts up off the roof.
function drawSpaStore(g, b) {
  const { x, y, w, h } = b;
  const glow = b.glow;
  const breathe = 0.85 + 0.15 * Math.sin(animPhase * 1.2);
  g.lineJoin = "round";

  // Shadow, and warm light spilling onto the grass from the doorway
  g.fillStyle = "rgba(60,40,20,0.18)";
  roundRect(g, x - 4, y + 10, w + 12, h, 12);
  g.fill();
  g.save();
  g.globalAlpha = 0.3 * breathe;
  g.fillStyle = glow;
  g.beginPath();
  g.ellipse(x + w / 2, y + h + 6, w * 0.3, 12, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // Steam curling up off the roof
  for (let i = 0; i < 4; i++) {
    const ph = (animPhase * 0.18 + i / 4) % 1;
    g.fillStyle = `rgba(255,255,255,${0.45 * Math.sin(ph * Math.PI)})`;
    g.beginPath();
    g.arc(x + w * 0.78 + Math.sin(ph * 5 + i) * 6, y - 4 - ph * 46, 5 + ph * 9, 0, Math.PI * 2);
    g.fill();
  }

  // Walls: warm, softly shaded plaster
  const roofH = 18;
  const wallTop = y + roofH - 4;
  const wall = g.createLinearGradient(0, wallTop, 0, y + h);
  wall.addColorStop(0, "#f3e9da");
  wall.addColorStop(1, "#e4d3bb");
  g.fillStyle = wall;
  roundRect(g, x, wallTop, w, y + h - wallTop, 8);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();

  // Timber slat screens either side, lit from behind
  const slatW = w * 0.3;
  const slatTop = wallTop + 16, slatH = y + h - slatTop - 14;
  [x + 16, x + w - 16 - slatW].forEach((sx) => {
    const light = g.createLinearGradient(0, slatTop, 0, slatTop + slatH);
    light.addColorStop(0, "#f7c98a");
    light.addColorStop(1, "#e9a660");
    g.fillStyle = light;
    roundRect(g, sx, slatTop, slatW, slatH, 4);
    g.fill();
    g.save();
    g.globalAlpha = 0.25 + 0.15 * breathe;
    g.fillStyle = "#fff4dc";
    roundRect(g, sx, slatTop, slatW, slatH, 4);
    g.fill();
    g.restore();
    g.fillStyle = "#9a6a43";
    for (let sx2 = sx + 2; sx2 < sx + slatW - 2; sx2 += 8) {
      g.fillRect(sx2, slatTop, 5, slatH);
    }
    roundRect(g, sx, slatTop, slatW, slatH, 4);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.stroke();
  });

  // The thin flat roof, its edge in dark timber, with moss growing on top
  roundRect(g, x - 12, y, w + 24, roofH, 5);
  g.fillStyle = "#4a3a2c";
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();
  roundRect(g, x - 6, y + 2, w + 12, 7, 3.5);
  g.fillStyle = "#7f9d5a";
  g.fill();
  g.fillStyle = "#9cbd6e";
  for (let k = 0; k < 18; k++) {
    const mx = x + 4 + (k / 17) * (w - 8);
    g.beginPath();
    g.arc(mx, y + 3 + (k % 3), 3 + (k % 2), Math.PI, 0);
    g.fill();
  }

  // A tall arched glass doorway, glowing warm from inside
  const doorW = 58;
  const dx = x + w / 2, dy = y + h;
  const archTop = wallTop + 12;
  const arch = () => {
    g.beginPath();
    g.moveTo(dx - doorW / 2, dy);
    g.lineTo(dx - doorW / 2, archTop + doorW / 2);
    g.arc(dx, archTop + doorW / 2, doorW / 2, Math.PI, 0);
    g.lineTo(dx + doorW / 2, dy);
    g.closePath();
  };
  const inside = g.createLinearGradient(0, archTop, 0, dy);
  inside.addColorStop(0, "#ffe6b8");
  inside.addColorStop(1, "#f2b46c");
  arch();
  g.fillStyle = inside;
  g.fill();
  // A leafy plant silhouetted inside, and a soft pendant light
  g.save();
  arch();
  g.clip();
  g.fillStyle = "rgba(255,255,255,0.5)";
  g.beginPath();
  g.arc(dx + 10, archTop + 26, 5 * breathe, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(90,110,70,0.55)";
  [[-14, dy - 16, 11], [-6, dy - 26, 9], [-20, dy - 28, 8]].forEach(([ox, py, r]) => {
    g.beginPath();
    g.ellipse(dx + ox, py, r * 0.6, r, ox * 0.04, 0, Math.PI * 2);
    g.fill();
  });
  g.restore();
  arch();
  g.strokeStyle = "#b8925a";
  g.lineWidth = 3;
  g.stroke();
  arch();
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  g.stroke();
  g.strokeStyle = "rgba(184,146,90,0.9)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(dx, archTop + doorW / 2);
  g.lineTo(dx, dy - 2);
  g.stroke();

  // Grasses and smooth stones along the front of the building
  const stones = [[x + 22, 7], [x + 36, 5], [x + w - 30, 7], [x + w - 46, 4.5]];
  [x + 50, x + 66, x + w - 64, x + w - 80].forEach((gx, k) => {
    g.strokeStyle = k % 2 ? "#8fae68" : "#a9c47c";
    g.lineWidth = 1.6;
    g.lineCap = "round";
    for (let blade = -2; blade <= 2; blade++) {
      const sway = Math.sin(animPhase * 1.3 + k + blade) * 1.5;
      g.beginPath();
      g.moveTo(gx + blade * 1.5, dy + 2);
      g.quadraticCurveTo(gx + blade * 3, dy - 8, gx + blade * 5 + sway, dy - 16 + Math.abs(blade) * 2);
      g.stroke();
    }
  });
  stones.forEach(([sx, r]) => {
    g.beginPath();
    g.ellipse(sx, dy + 1, r * 1.3, r, 0, 0, Math.PI * 2);
    g.fillStyle = "#cfc6b8";
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.stroke();
    g.fillStyle = "rgba(255,255,255,0.5)";
    g.beginPath();
    g.ellipse(sx - r * 0.4, dy - r * 0.35, r * 0.45, r * 0.25, -0.3, 0, Math.PI * 2);
    g.fill();
  });

  // A stone step up to the door
  roundRect(g, dx - 34, dy - 3, 68, 7, 3);
  g.fillStyle = "#d9cfc0";
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  g.stroke();
}

function circleRectCollides(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

function moveWithCollision(ch, dx, dy, obstacles = worldObstacles, bounds = WORLD) {
  // Resolve axes independently so characters slide along walls.
  let nx = ch.x + dx;
  if (!obstacles.some((b) => circleRectCollides(nx, ch.y, CHAR_RADIUS, b))) {
    ch.x = clamp(nx, CHAR_RADIUS, bounds.width - CHAR_RADIUS);
  }
  let ny = ch.y + dy;
  if (!obstacles.some((b) => circleRectCollides(ch.x, ny, CHAR_RADIUS, b))) {
    ch.y = clamp(ny, CHAR_RADIUS, bounds.height - CHAR_RADIUS);
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Bounding box of a circle, for collision.
function circleBox(c, r = c.r) {
  return { x: c.x - r, y: c.y - r, w: r * 2, h: r * 2 };
}

// Moves `ch` from the current keyboard input, colliding against `obstacles`.
function stepCharacter(ch, dt, speed, obstacles, bounds) {
  let dx = 0, dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;

  const moving = dx !== 0 || dy !== 0;

  if (moving) {
    const len = Math.hypot(dx, dy) || 1;
    dx = (dx / len) * speed * dt;
    dy = (dy / len) * speed * dt;
    moveWithCollision(ch, dx, dy, obstacles, bounds);

    if (Math.abs(dx) > Math.abs(dy)) {
      ch.facing = dx > 0 ? "right" : "left";
    } else {
      ch.facing = dy > 0 ? "down" : "up";
    }
    animPhase += dt;
  } else {
    animPhase += dt;
  }

  ch.moving = moving;
}

function drawGround(g) {
  // Grass everywhere, the beach and the sea along the top, then the path.
  g.fillStyle = grassPattern(g);
  g.fillRect(0, 0, WORLD.width, WORLD.height);
  drawShore(g);
  buildings.forEach((b) => drawDoorPath(g, b));
  drawPath(g);
}

// Traces a wavy line across the map, left to right (or right to left).
function traceEdge(g, edgeY, reverse = false) {
  const W = WORLD.width;
  for (let i = 0; i <= W; i += 20) {
    const x = reverse ? W - i : i;
    g.lineTo(x, edgeY(x));
  }
}

// The beach and the sea: waves washing in and out, foam, and a few rocks.
function drawShore(g) {
  const W = WORLD.width;
  const t = animPhase;

  // Sand, with a soft grassy edge
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(W, 0);
  traceEdge(g, sandY, true);
  g.closePath();
  g.fillStyle = sandPattern(g);
  g.fill();
  g.beginPath();
  traceEdge(g, sandY);
  g.strokeStyle = "rgba(94,143,62,0.6)";
  g.lineWidth = 4;
  g.stroke();

  // Wet sand the waves have just left
  const surge = Math.sin(t * 1.1) * 6;
  const sea = (x) => shoreY(x) + surge;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(W, 0);
  traceEdge(g, (x) => shoreY(x) + 14, true);
  g.closePath();
  g.fillStyle = "rgba(196,170,124,0.35)";
  g.fill();

  // The sea
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(W, 0);
  traceEdge(g, sea, true);
  g.closePath();
  const water = g.createLinearGradient(0, 0, 0, SEA + 16);
  water.addColorStop(0, "#3d7fa6");
  water.addColorStop(0.6, "#5aa6c4");
  water.addColorStop(1, "#86cbd9");
  g.fillStyle = water;
  g.fill();

  // Rocks out in the water, with foam around their feet
  [[0.08, 58, 26], [0.11, 80, 14], [0.63, 44, 30], [0.67, 70, 18], [0.9, 62, 22]].forEach(([fx, ry, r], i) => {
    const rx = fx * W;
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.beginPath();
    g.ellipse(rx, ry + r * 0.45, r * 1.3 + Math.sin(t * 2 + i) * 2, r * 0.4, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(rx - r, ry + r * 0.4);
    g.quadraticCurveTo(rx - r * 0.9, ry - r * 0.6, rx - r * 0.1, ry - r * 0.7);
    g.quadraticCurveTo(rx + r * 0.9, ry - r * 0.5, rx + r, ry + r * 0.4);
    g.closePath();
    g.fillStyle = "#8d8a84";
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "rgba(255,255,255,0.22)";
    g.beginPath();
    g.ellipse(rx - r * 0.3, ry - r * 0.3, r * 0.35, r * 0.15, -0.3, 0, Math.PI * 2);
    g.fill();
  });

  // Little ripples drifting along the water
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 2;
  g.lineCap = "round";
  for (let i = 0; i * 150 < W + 150; i++) {
    const x = ((i * 150 + t * 14) % (W + 150)) - 75;
    const y = 28 + ((i * 37) % 54) + Math.sin(t * 1.5 + i) * 3;
    g.beginPath();
    g.moveTo(x - 14, y);
    g.quadraticCurveTo(x - 7, y - 5, x, y);
    g.quadraticCurveTo(x + 7, y + 5, x + 14, y);
    g.stroke();
  }

  // Foam: a bright line where the wave breaks, and a fainter one behind it
  g.lineJoin = "round";
  g.beginPath();
  traceEdge(g, (x) => sea(x) - 12 + Math.sin(x / 40 + t * 2) * 2);
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 3;
  g.stroke();
  g.beginPath();
  traceEdge(g, sea);
  g.strokeStyle = "rgba(255,255,255,0.92)";
  g.lineWidth = 6;
  g.stroke();
}

// Traces the path: down from the beach, then along the Z.
function traceRoute(g) {
  g.beginPath();
  ROUTE.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
}

// The cobblestone path, edged with a pale stone curb.
function drawPath(g) {
  g.lineJoin = "round";
  g.lineCap = "round";
  g.save();
  g.translate(2, 6);
  traceRoute(g);
  g.strokeStyle = "rgba(90,64,38,0.16)";
  g.lineWidth = PATH_HALF * 2 + 6;
  g.stroke();
  g.restore();
  traceRoute(g);
  g.strokeStyle = INK;
  g.lineWidth = PATH_HALF * 2 + 5;
  g.stroke();
  g.strokeStyle = COLORS.curb;
  g.lineWidth = PATH_HALF * 2;
  g.stroke();
  g.strokeStyle = cobblePattern(g);
  g.lineWidth = PATH_HALF * 2 - 16;
  g.stroke();
}

// A pale stone front walk from each shop door down to the path.
function drawDoorPath(g, b) {
  if (!b.door) return;
  const door = doorOf(b);
  g.beginPath();
  g.moveTo(door.x, door.y);
  g.lineTo(door.x, b.pathY);
  g.lineCap = "butt";
  g.strokeStyle = INK;
  g.lineWidth = 38;
  g.stroke();
  g.strokeStyle = "#ecdfc7";
  g.lineWidth = 34;
  g.stroke();
}

// Trees, bushes, flower beds and lamp posts.
function drawDecor(g) {
  decor.forEach((d) => {
    if (d.type === "cypress") drawCypress(g, d.x, d.y, d.seed);
    else if (d.type === "bush") drawBush(g, d.x, d.y, d.seed);
    else drawFlowerBed(g, d.x, d.y, d.seed);
  });
  lamps.forEach((l) => drawLamp(g, l.x, l.y));
}

// A Monterey cypress: a short, twisting trunk under dense, layered clouds
// of dark needles, leaning with the wind off the sea.
function drawCypress(g, x, y, seed) {
  const lean = (seed % 2 ? 1 : -1) * (6 + (seed % 5) * 2);
  const s = 0.9 + (seed % 4) * 0.08;
  g.fillStyle = "rgba(60,40,20,0.2)";
  g.beginPath();
  g.ellipse(x + 6, y + 3, 40 * s, 10 * s, 0, 0, Math.PI * 2);
  g.fill();

  // Trunk and a forked branch, ink first and bark on top
  g.lineCap = "round";
  const limbs = () => {
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + lean * 0.1, y - 18 * s, x + lean * 0.7, y - 34 * s);
    g.moveTo(x + lean * 0.08, y - 12 * s);
    g.quadraticCurveTo(x - lean * 0.5, y - 20 * s, x - lean * 1.1, y - 30 * s);
  };
  limbs();
  g.strokeStyle = INK;
  g.lineWidth = 11 * s;
  g.stroke();
  limbs();
  g.strokeStyle = "#7a5634";
  g.lineWidth = 7.5 * s;
  g.stroke();

  // Two tiers of foliage, the upper one pushed further by the wind
  const tiers = [
    { cx: x + lean * 0.4, cy: y - 42 * s, blobs: [[-44, 6, 15, 11], [-28, 0, 24, 16], [-4, -5, 28, 18], [22, 0, 24, 16], [40, 6, 16, 11]] },
    { cx: x + lean * 1.1, cy: y - 66 * s, blobs: [[-20, 2, 18, 12], [2, -4, 22, 14], [22, 2, 16, 11]] },
  ];
  const each = (fn) => tiers.forEach((tier) => tier.blobs.forEach(([dx, dy, rx, ry]) => {
    g.beginPath();
    g.ellipse(tier.cx + dx * s, tier.cy + dy * s, rx * s, ry * s, 0, 0, Math.PI * 2);
    fn();
  }));
  g.strokeStyle = INK;
  g.lineWidth = 3;
  each(() => g.stroke());
  g.fillStyle = "#35603a";
  each(() => g.fill());
  // Sunlit tops
  g.fillStyle = "#4f7f47";
  tiers.forEach((tier) => tier.blobs.forEach(([dx, dy, rx, ry]) => {
    g.beginPath();
    g.ellipse(tier.cx + (dx - 3) * s, tier.cy + (dy - ry * 0.35) * s, rx * 0.6 * s, ry * 0.42 * s, 0, 0, Math.PI * 2);
    g.fill();
  }));
}

// An old-fashioned lamp post with a warm lantern.
function drawLamp(g, x, y) {
  g.fillStyle = "rgba(60,40,20,0.2)";
  g.beginPath();
  g.ellipse(x + 2, y + 2, 9, 3, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  g.fillStyle = "#3b3f45";
  roundRect(g, x - 6, y - 6, 12, 7, 2);
  g.fill();
  g.stroke();
  roundRect(g, x - 2.5, y - 48, 5, 44, 2);
  g.fill();
  g.stroke();
  g.fillStyle = "rgba(255,214,140,0.28)";
  g.beginPath();
  g.arc(x, y - 56, 16, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffe3a3";
  roundRect(g, x - 7, y - 64, 14, 16, 3);
  g.fill();
  g.stroke();
  g.fillStyle = "#3b3f45";
  g.beginPath();
  g.moveTo(x - 10, y - 63);
  g.lineTo(x, y - 72);
  g.lineTo(x + 10, y - 63);
  g.closePath();
  g.fill();
  g.stroke();
}

// A tile of soft beach sand: pale gold with darker and lighter grains.
let sandTile = null;
function sandPattern(g) {
  if (!sandTile) {
    const SIZE = 100, RES = 2;
    const tile = document.createElement("canvas");
    tile.width = tile.height = SIZE * RES;
    const t = tile.getContext("2d");
    t.scale(RES, RES);
    t.fillStyle = COLORS.sand;
    t.fillRect(0, 0, SIZE, SIZE);
    let seed = 5;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      t.fillStyle = rand() < 0.5 ? "rgba(255,255,255,0.5)" : "rgba(170,140,90,0.35)";
      t.beginPath();
      t.arc(rand() * SIZE, rand() * SIZE, 0.6 + rand() * 0.8, 0, Math.PI * 2);
      t.fill();
    }
    sandTile = tile;
  }
  const pattern = g.createPattern(sandTile, "repeat");
  pattern.setTransform(new DOMMatrix().scale(0.5));
  return pattern;
}

// A cluster of little flowers on a leafy mound.
function drawFlowerBed(g, x, y, seed) {
  const petals = ["#e8889a", "#f2cf5b", "#a58ad0", "#e0664f", "#f6f1e7"];
  let n = seed * 13 + 5;
  const rand = () => ((n = (n * 16807) % 2147483647) / 2147483647);
  drawBush(g, x, y, seed, "#5e8f3e", "#6f9f48", 0.9);
  for (let i = 0; i < 9; i++) {
    const fx = x + (rand() - 0.5) * 60;
    const fy = y - 8 + (rand() - 0.5) * 30;
    const color = petals[Math.floor(rand() * petals.length)];
    g.fillStyle = color;
    g.strokeStyle = INK;
    g.lineWidth = 1;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      g.beginPath();
      g.arc(fx + Math.cos(a) * 3.2, fy + Math.sin(a) * 3.2, 2.6, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    g.fillStyle = "#f7d774";
    g.beginPath();
    g.arc(fx, fy, 1.8, 0, Math.PI * 2);
    g.fill();
  }
}

// A round, puffy bush: outline every blob first, then fill, so the ink
// traces the outside of the whole shape.
function drawBush(g, x, y, seed, dark = "#6aa04a", light = "#86b95a", size = 1) {
  const blobs = [[-16, 2, 13], [0, -6, 16], [16, 2, 13], [-6, 8, 12], [8, 8, 12]];
  g.fillStyle = "rgba(60,40,20,0.18)";
  g.beginPath();
  g.ellipse(x + 2, y + 16 * size, 30 * size, 8 * size, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 3;
  blobs.forEach(([dx, dy, r]) => {
    g.beginPath();
    g.arc(x + dx * size, y + dy * size, r * size, 0, Math.PI * 2);
    g.stroke();
  });
  blobs.forEach(([dx, dy, r], i) => {
    g.fillStyle = i === 1 ? light : dark;
    g.beginPath();
    g.arc(x + dx * size, y + dy * size, r * size, 0, Math.PI * 2);
    g.fill();
  });
  // Leafy highlights
  g.fillStyle = "rgba(255,255,255,0.18)";
  g.beginPath();
  g.arc(x - 3 * size, y - 10 * size, 5 * size, 0, Math.PI * 2);
  g.fill();
}

// A tile of soft, hand-drawn grass: tufts and specks over bright green.
let grassTile = null;
function grassPattern(g) {
  if (!grassTile) {
    const SIZE = 120, RES = 2;
    const tile = document.createElement("canvas");
    tile.width = tile.height = SIZE * RES;
    const t = tile.getContext("2d");
    t.scale(RES, RES);
    t.fillStyle = COLORS.grass;
    t.fillRect(0, 0, SIZE, SIZE);
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // Soft lighter patches
    for (let i = 0; i < 6; i++) {
      const x = rand() * SIZE, y = rand() * SIZE, r = 14 + rand() * 18;
      [0, -SIZE, SIZE].forEach((ox) => [0, -SIZE, SIZE].forEach((oy) => {
        t.fillStyle = "rgba(180,220,130,0.25)";
        t.beginPath();
        t.ellipse(x + ox, y + oy, r, r * 0.6, 0, 0, Math.PI * 2);
        t.fill();
      }));
    }
    // Little grass tufts
    t.lineCap = "round";
    for (let i = 0; i < 26; i++) {
      const x = 6 + rand() * (SIZE - 12), y = 6 + rand() * (SIZE - 12);
      t.strokeStyle = rand() < 0.5 ? "#6f9f48" : "#5e8f3e";
      t.lineWidth = 1.2;
      t.beginPath();
      t.moveTo(x - 3, y - 4);
      t.lineTo(x - 1, y);
      t.lineTo(x, y - 5);
      t.lineTo(x + 1, y);
      t.lineTo(x + 3, y - 4);
      t.stroke();
    }
    // Specks
    for (let i = 0; i < 30; i++) {
      t.fillStyle = rand() < 0.5 ? "rgba(255,255,255,0.35)" : "rgba(80,120,50,0.35)";
      t.beginPath();
      t.arc(rand() * SIZE, rand() * SIZE, 0.9, 0, Math.PI * 2);
      t.fill();
    }
    grassTile = tile;
  }
  const pattern = g.createPattern(grassTile, "repeat");
  pattern.setTransform(new DOMMatrix().scale(0.5));
  return pattern;
}

// A repeating tile of rounded cobblestones, drawn once at 2x resolution so it
// stays crisp when zoomed in. Light brown stones in a few shades, set in
// darker grout.
let cobbleTile = null;
function cobblePattern(g) {
  if (!cobbleTile) {
    const TILE_W = 132, TILE_H = 108, ROW_H = 18, RES = 2;
    const tile = document.createElement("canvas");
    tile.width = TILE_W * RES;
    tile.height = TILE_H * RES;
    const t = tile.getContext("2d");
    t.scale(RES, RES);
    t.fillStyle = "#b8a48c"; // grout
    t.fillRect(0, 0, TILE_W, TILE_H);

    const stones = ["#dccab3", "#d4c0a7", "#e2d2bd", "#cfbaa0", "#d8c5ad", "#e6d8c5", "#cdb89d", "#decdb7"];
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    for (let row = 0; row * ROW_H < TILE_H; row++) {
      const y = row * ROW_H;
      // Stone widths that exactly fill the tile's width, so it repeats seamlessly.
      const widths = [];
      let total = 0;
      while (total < TILE_W - 30) {
        const w = 18 + Math.floor(rand() * 10);
        widths.push(w);
        total += w;
      }
      widths.push(TILE_W - total);
      let x = row % 2 ? -10 : 0; // stagger alternate rows
      widths.forEach((w) => {
        const color = stones[Math.floor(rand() * stones.length)];
        [x, x + TILE_W].forEach((sx) => {
          t.fillStyle = color;
          roundRect(t, sx + 1.5, y + 1.5, w - 3, ROW_H - 3, 6);
          t.fill();
          t.strokeStyle = "rgba(92,70,48,0.35)";
          t.lineWidth = 0.8;
          t.stroke();
          t.fillStyle = "rgba(255,255,255,0.28)"; // worn, rounded tops
          roundRect(t, sx + 4, y + 3.5, w - 10, 4, 2);
          t.fill();
        });
        x += w;
      });
    }
    cobbleTile = tile;
  }
  const pattern = g.createPattern(cobbleTile, "repeat");
  pattern.setTransform(new DOMMatrix().scale(0.5));
  return pattern;
}

// A green street sign: a metal pole with the name on an enamel blade.
function drawStreetSign(g, sign) {
  const k = labelScale();
  g.save();
  g.translate(sign.x, sign.y);
  g.scale(k, k);

  g.font = "700 15px Inter, sans-serif";
  g.letterSpacing = "2px";
  const text = sign.text.toUpperCase();
  const w = g.measureText(text).width + 28;
  const h = 30;
  const top = -84;

  // Shadow and pole
  g.fillStyle = "rgba(60,40,20,0.22)";
  g.beginPath();
  g.ellipse(2, 2, 12, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  g.fillStyle = "#8b939b";
  roundRect(g, -3, top - 4, 6, -top + 6, 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(0, top - 7, 4.5, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  // The blade, with its white enamel border
  g.fillStyle = "rgba(30,40,30,0.25)";
  roundRect(g, -w / 2 + 2, top + 4, w, h, 5);
  g.fill();
  g.fillStyle = "#2f6b4f";
  roundRect(g, -w / 2, top, w, h, 5);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 1.5;
  roundRect(g, -w / 2 + 3.5, top + 3.5, w - 7, h - 7, 3);
  g.stroke();

  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#ffffff";
  g.fillText(text, 1, top + h / 2 + 1);
  g.letterSpacing = "0px";
  g.restore();
}

/* ---------------------------------------------------------------------- */
/* Where is Anna? Areas, entrances, and the HUD                         */
/* ---------------------------------------------------------------------- */

function areaAt(x, y) {
  if (y < sandY(x)) return SHORE;
  let nearest = LEGS[0], best = Infinity;
  LEGS.forEach((leg) => {
    const d = distToSegment(x, y, leg.a, leg.b);
    if (d < best) {
      best = d;
      nearest = leg;
    }
  });
  return nearest;
}

function doorOf(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h };
}

function entranceNear(ch) {
  return buildings.find((b) => {
    if (!b.enter) return false;
    const door = doorOf(b);
    const dx = ch.x - door.x;
    const dy = ch.y - (door.y + CHAR_RADIUS + 6);
    return dx * dx + dy * dy < 46 * 46;
  });
}

function enterBuilding(b) {
  if (b.enter === "cafe") enterCafe();
  else if (b.enter === "lab") enterLab();
  else if (b.enter === "subtitles") enterSubs();
}

function worldPointAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return { x: (clientX - rect.left) / zoom + cameraX, y: (clientY - rect.top) / zoom + cameraY };
}

function buildingAtScreenPoint(clientX, clientY) {
  const { x: wx, y: wy } = worldPointAt(clientX, clientY);
  return buildings.find(
    (b) => b.enter && wx >= b.x && wx <= b.x + b.w && wy >= b.y - 22 && wy <= b.y + b.h
  );
}

/* For now, Anna can also be moved with the mouse: drag her anywhere, or  */
/* click an open spot on the map to put her there.                         */

let draggingAnna = false;
let suppressClick = false;

function annaAtScreenPoint(clientX, clientY) {
  const p = worldPointAt(clientX, clientY);
  const s = 1.4 * labelScale(2, 0.55); // the scale she's drawn at
  return Math.abs(p.x - anna.x) < 20 * s && p.y > anna.y - 52 * s && p.y < anna.y + 8 * s;
}

// The nearest spot to (x, y) where she isn't inside a building, tree or the sea.
function openSpotNear(x, y) {
  const fits = (px, py) => !worldObstacles.some((o) => circleRectCollides(px, py, CHAR_RADIUS, o));
  for (let r = 0; r < 600; r += 8) {
    const steps = r ? 24 : 1;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const px = clamp(x + Math.cos(a) * r, CHAR_RADIUS, WORLD.width - CHAR_RADIUS);
      const py = clamp(y + Math.sin(a) * r, CHAR_RADIUS, WORLD.height - CHAR_RADIUS);
      if (fits(px, py)) return { x: px, y: py };
    }
  }
  return { x, y };
}

function placeAnna(clientX, clientY) {
  const p = worldPointAt(clientX, clientY);
  Object.assign(anna, openSpotNear(p.x, p.y));
  anna.moving = false;
  seedCompanion(-34, 4);
}

canvas.addEventListener("pointerdown", (e) => {
  suppressClick = false;
  if (currentScene !== "world" || !annaAtScreenPoint(e.clientX, e.clientY)) return;
  draggingAnna = true;
  try {
    canvas.setPointerCapture(e.pointerId); // keep the drag going if the cursor leaves the window
  } catch (err) {}
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("pointerup", (e) => {
  if (!draggingAnna) return;
  draggingAnna = false;
  suppressClick = true; // the click that ends a drag shouldn't also place her or enter a shop
  placeAnna(e.clientX, e.clientY);
  canvas.style.cursor = "grab";
});

canvas.addEventListener("click", (e) => {
  if (currentScene !== "world") return;
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const b = buildingAtScreenPoint(e.clientX, e.clientY);
  if (b) enterBuilding(b);
  else placeAnna(e.clientX, e.clientY);
});

canvas.addEventListener("pointermove", (e) => {
  if (currentScene !== "world") return;
  if (draggingAnna) {
    const p = worldPointAt(e.clientX, e.clientY);
    anna.x = clamp(p.x, CHAR_RADIUS, WORLD.width - CHAR_RADIUS);
    anna.y = clamp(p.y, CHAR_RADIUS, WORLD.height - CHAR_RADIUS);
    return;
  }
  canvas.style.cursor = annaAtScreenPoint(e.clientX, e.clientY)
    ? "grab"
    : buildingAtScreenPoint(e.clientX, e.clientY) ? "pointer" : "default";
});

const areaBannerEl = document.getElementById("areaBanner");
const minimapDotEl = document.getElementById("minimapDot");

const minimapMapEl = document.getElementById("minimapMap");

// A tiny copy of the map: the sea, the beach, and the Z path, with each
// stretch lit up in its colour while Anna walks it.
function buildMinimap() {
  const W = WORLD.width, H = WORLD.height;
  const line = (pts, leg) =>
    `<polyline points="${pts.map((p) => `${p.x},${p.y}`).join(" ")}" class="minimap-leg"
      data-area="${leg.id}" style="--leg-accent: ${leg.accent}" />`;
  minimapMapEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
  minimapMapEl.innerHTML = `
    <rect width="${W}" height="${H}" fill="${COLORS.grass}" />
    <rect width="${W}" height="${SAND}" fill="${COLORS.sand}" />
    <rect width="${W}" height="${SEA}" fill="#6fb3cc" />
    ${line([ROUTE[0], ROUTE[1]], LEGS[0])}
    ${LEGS.map((leg) => line([leg.a, leg.b], leg)).join("")}
    ${buildings
      .filter((b) => b.enter)
      .map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="24" class="minimap-shop" />`)
      .join("")}
  `;
  if (currentArea) highlightMinimap(currentArea);
}

function highlightMinimap(area) {
  minimapMapEl.querySelectorAll(".minimap-leg").forEach((el) => {
    el.classList.toggle("active", el.dataset.area === area.id);
  });
}

let currentArea = null;
let bannerTimer = null;
buildMinimap();
window.addEventListener("resize", buildMinimap);

function updateArea() {
  const area = areaAt(anna.x, anna.y);
  if (area === currentArea) return;
  currentArea = area;

  highlightMinimap(area);

  // Announce each new stretch as Anna walks onto it (not needed in the
  // overview, where the whole path is already on screen).
  if (followAmount() < 0.5) return;
  areaBannerEl.innerHTML = `
    <p class="area-banner-kicker">${area.kicker}</p>
    <p class="area-banner-name">${area.name}</p>
  `;
  areaBannerEl.style.setProperty("--area-accent", area.accent);
  areaBannerEl.classList.add("show");
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => areaBannerEl.classList.remove("show"), 2400);
}

let shownEntrance = null;

function updateEnterPrompt() {
  const entrance = entranceNear(anna);
  if (entrance !== shownEntrance) {
    shownEntrance = entrance;
    enterPromptEl.hidden = !entrance;
    if (entrance) enterPromptEl.innerHTML = `Press <kbd>E</kbd> to ${entrance.enterLabel}`;
  }
  if (entrance) {
    const door = doorOf(entrance);
    enterPromptEl.style.left = `${(door.x - cameraX) * zoom}px`;
    enterPromptEl.style.top = `${(door.y - 50 - cameraY) * zoom - 6}px`;
  }
}

/* ---------------------------------------------------------------------- */
/* Lab scene: inside the Form Studio, a cozy, dimly lit lounge with      */
/* wearable ear gadgets on display. A fitter waits in the round sofa in   */
/* the middle to help Anna try hers on.                                 */
/* ---------------------------------------------------------------------- */

const LAB = { w: 900, h: 640, wall: 26, doorX: 450, doorW: 76 };
const LAB_BOUNDS = { width: LAB.w, height: LAB.h };
const LAB_MOVE_SPEED = 150;

// The lounge in the middle of the room: a round sofa, open toward the door,
// with the fitter waiting inside it.
const labPlatform = { x: 450, y: 300, r: 112 };
const LAB_SOFA = { inner: 96, outer: 124, from: Math.PI * 0.85, to: Math.PI * 2.15 };
const labFitter = {
  x: 450, y: 282, facing: "down",
  palette: { skin: "#b97a56", hair: "#2a211c", hairStyle: "medium", outfit: "#d9a441", outfitTrim: "#f4ecd8" },
};
const labTray = { x: 512, y: 300, r: 17 }; // the wearable waiting to be tried on
const FITTER_REACH = 86;
const PRODUCT_RENDERING_URL = "https://sunny.dabble.team/"; // what the fitter shows Anna
const COMPANION_APP_URL = "https://sunny-ears.replit.app"; // opens when Anna picks up her cuff

// The sofa's collision: a ring of small boxes along its arc.
const labSofaBoxes = [];
for (let a = LAB_SOFA.from; a <= LAB_SOFA.to + 0.01; a += 0.12) {
  const r = (LAB_SOFA.inner + LAB_SOFA.outer) / 2;
  labSofaBoxes.push({ x: labPlatform.x + Math.cos(a) * r - 13, y: labPlatform.y + Math.sin(a) * r - 13, w: 26, h: 26 });
}

// Gadgets on display: stone plinths along the side walls and lit niches along the top.
const GADGET_COLORS = ["#e07a2f", "#4f86b8", "#f2b36b", "#8fc1e3", "#c95f1f", "#23384d"];
const labPedestals = [180, 320, 460].flatMap((y, i) => [
  { x: 92, y, color: GADGET_COLORS[i] },
  { x: 808, y, color: GADGET_COLORS[i + 3] },
]);
// The one cuff Anna can take with her: the gold one on the top-right
// stand. Once picked up, she wears it on her ear everywhere she goes.
const labPickup = labPedestals.find((p) => p.x > LAB.w / 2 && p.y === 180);
const HEARING_AID_COLOR = "#d9ab4a"; // gold, like the cuff on sunny.dabble.team
labPickup.color = HEARING_AID_COLOR;
const PICKUP_REACH = 74;
const labShelf = { x: 250, y: 34, w: 400, h: 44 };
const labBasin = { x: 170, y: 548, r: 50 };
const labLoungers = [
  { x: 650, y: 510, w: 44, h: 86 },
  { x: 720, y: 510, w: 44, h: 86 },
];
const labTeaTable = { x: 707, y: 488, r: 15 };

// Two shoppers by the middle stand on the left wall, thinking about buying
// the cuff on it.
const labShopperStand = labPedestals.find((p) => p.x < LAB.w / 2 && p.y === 320);
const labShoppers = [
  {
    x: labShopperStand.x + 60, y: labShopperStand.y - 34, facing: "left",
    palette: { skin: "#e8b98a", hair: "#5a3a26", hairStyle: "bun", ears: true, outfit: "#c46a3f", outfitTrim: "#f4ecd8" },
  },
  {
    x: labShopperStand.x + 66, y: labShopperStand.y + 34, facing: "left",
    palette: { skin: "#8d5a3b", hair: "#1d1713", hairStyle: "short", ears: true, outfit: "#5f8b88", outfitTrim: "#e1efe9" },
  },
];
const labPlants = [{ x: 60, y: 60 }, { x: 840, y: 60 }, { x: 60, y: 590 }, { x: 840, y: 590 }];

const labObstacles = [
  { x: 0, y: 0, w: LAB.w, h: LAB.wall },
  { x: 0, y: 0, w: LAB.wall, h: LAB.h },
  { x: LAB.w - LAB.wall, y: 0, w: LAB.wall, h: LAB.h },
  { x: 0, y: LAB.h - LAB.wall, w: LAB.doorX - LAB.doorW / 2, h: LAB.wall },
  {
    x: LAB.doorX + LAB.doorW / 2, y: LAB.h - LAB.wall,
    w: LAB.w - (LAB.doorX + LAB.doorW / 2), h: LAB.wall,
  },
  labShelf, ...labLoungers, ...labSofaBoxes,
  circleBox(labTeaTable),
  { x: labFitter.x - 16, y: labFitter.y - 20, w: 32, h: 36 },
  circleBox(labTray),
  circleBox(labBasin),
  ...labPedestals.map((p) => ({ x: p.x - 28, y: p.y - 28, w: 56, h: 56 })),
  ...labPlants.map((p) => circleBox(p, 15)),
  ...labShoppers.map((p) => ({ x: p.x - 13, y: p.y - 10, w: 26, h: 26 })),
];

const labCanvas = document.getElementById("labCanvas");
const labCtx = labCanvas.getContext("2d");
const labPromptEl = document.getElementById("labPrompt");
const labView = { scale: 1, ox: 0, oy: 0 };
const labBuilding = buildings.find((b) => b.enter === "lab");

function resizeLabCanvas() {
  labCanvas.width = Math.round(viewW * dpr);
  labCanvas.height = Math.round(viewH * dpr);
  const top = 76, bottom = 64;
  const s = Math.min((viewW - 32) / LAB.w, (viewH - top - bottom) / LAB.h, 1.3);
  labView.scale = s;
  labView.ox = (viewW - LAB.w * s) / 2;
  labView.oy = top + (viewH - top - bottom - LAB.h * s) / 2;
}
window.addEventListener("resize", resizeLabCanvas);
resizeLabCanvas();

function enterLab() {
  anna.x = LAB.doorX;
  anna.y = LAB.h - LAB.wall - 26;
  anna.facing = "up";
  anna.moving = false;
  seedCompanion(-34, 4);
  setScene("lab");
}

function leaveLab() {
  const door = doorOf(labBuilding);
  anna.x = door.x;
  anna.y = door.y + CHAR_RADIUS + 18;
  anna.facing = "down";
  anna.moving = false;
  seedCompanion(32, 2);
  labPromptEl.hidden = true;
  // Walking out with her cuff on, the afternoon has turned to early evening.
  if (anna.hearingAid) eveningTarget = Math.max(eveningTarget, EARLY_EVENING);
  setScene("world");
}

// Opens one of the Sunny Ears sites in a new tab. Some browsers block tabs
// opened from a key press, so if this one's blocked, a button to open it
// with a click shows up instead (until the scene changes).
function openInNewTab(url, label) {
  const tab = window.open(url, "_blank");
  if (tab) {
    tab.opener = null;
    openLinkEl.hidden = true;
    return;
  }
  openLinkEl.href = url;
  openLinkEl.textContent = `${label} ↗`;
  openLinkEl.hidden = false;
}

openLinkEl.addEventListener("click", () => {
  openLinkEl.hidden = true;
});

function nearFitter() {
  return Math.hypot(anna.x - labFitter.x, anna.y - labFitter.y) < FITTER_REACH;
}

function nearPickup() {
  return !anna.hearingAid && !cuffFlight && Math.hypot(anna.x - labPickup.x, anna.y - labPickup.y) < PICKUP_REACH;
}

const labPromptTitleEl = labPromptEl.querySelector(".lab-prompt-title");
const labPromptKeyEl = labPromptEl.querySelector(".lab-prompt-key");

// Picking up the cuff: it lifts off the stand and floats in an arc onto
// Anna's ear (`t` runs 0 -> 1). Once it's on, a pop-up offers the app.
const CUFF_FLIGHT_SECONDS = 1.3;
let cuffFlight = null;
let appPromptShowing = false;

// Where the ear wearing the cuff is, in room coordinates, for a character
// drawn at `scale` (the same spot drawCharacter puts the cuff).
function cuffEarPoint(ch, scale) {
  const sideways = ch.facing === "left" || ch.facing === "right";
  const ex = sideways ? (ch.facing === "left" ? 7 : -7) : (ch.facing === "up" ? 10.2 : -10.2);
  return { x: ch.x + ex * scale, y: ch.y - 18.5 * scale };
}

document.getElementById("labBack").addEventListener("click", leaveLab);

function updateLab(dt) {
  stepCharacter(anna, dt, LAB_MOVE_SPEED, labObstacles, LAB_BOUNDS);
  updateCompanion(dt);
  if (anna.y > LAB.h - LAB.wall + 4) {
    leaveLab();
    return;
  }

  if (cuffFlight) {
    cuffFlight.t += dt / CUFF_FLIGHT_SECONDS;
    if (cuffFlight.t >= 1) {
      cuffFlight = null;
      anna.hearingAid = HEARING_AID_COLOR;
      appPromptShowing = true;
    }
  }

  // A prompt floating above whatever Anna is close to: the stand with her
  // gadget ("Pick up your new power gadget!"), or the fitter ("Try on your
  // new superpower"). Once the cuff is on, the pop-up for the app follows
  // Anna until she opens it.
  const spot = cuffFlight
    ? null
    : appPromptShowing
      ? { x: anna.x, y: anna.y - 62, title: "press E to check out the mobile app!", noKey: true }
      : nearPickup()
        ? { x: labPickup.x, y: labPickup.y - 34, title: "Pick up your new power gadget!" }
        : nearFitter()
          ? { x: labFitter.x, y: labFitter.y - 58, title: "Try on your new superpower" }
          : null;
  labPromptEl.hidden = !spot;
  if (spot) {
    const { scale: s, ox, oy } = labView;
    labPromptTitleEl.textContent = spot.title;
    labPromptKeyEl.hidden = !!spot.noKey;
    labPromptEl.style.left = `${ox + spot.x * s}px`;
    labPromptEl.style.top = `${oy + spot.y * s}px`;
  }
}

// A Sunny Ears cuff, on display: a thick, glossy C with two little buttons
// near one end and a dark sensor on the inside, and a thin wire from the
// other end to a white receiver tip. A glint slides slowly over the metal.
function drawGadget(g, x, y, color, size = 1, t = 0) {
  g.save();
  g.translate(x, y);
  g.scale(size, size);
  g.lineCap = "round";
  const from = Math.PI * 0.45, to = Math.PI * 1.8; // open toward the lower right
  const end = { x: Math.cos(from) * 8, y: Math.sin(from) * 8 };

  // Wire and receiver
  g.beginPath();
  g.moveTo(end.x, end.y);
  g.quadraticCurveTo(5, 11, 10, 7);
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.stroke();
  g.strokeStyle = "#9a958c";
  g.lineWidth = 1;
  g.stroke();
  g.beginPath();
  g.ellipse(12, 6, 3.2, 2.6, -0.5, 0, Math.PI * 2);
  g.fillStyle = "#fbf7ee";
  g.fill();
  ink(g, 1);

  // The cuff
  g.beginPath();
  g.arc(0, 0, 8, from, to);
  g.strokeStyle = INK;
  g.lineWidth = 7.4;
  g.stroke();
  g.strokeStyle = color;
  g.lineWidth = 5.4;
  g.stroke();
  g.beginPath();
  g.arc(0, 0, 9, Math.PI * 1.05, Math.PI * 1.55);
  g.strokeStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 1.5) * 0.2})`;
  g.lineWidth = 1.4;
  g.stroke();
  g.beginPath();
  g.arc(Math.cos(Math.PI * 1.3) * 5.6, Math.sin(Math.PI * 1.3) * 5.6, 1.2, 0, Math.PI * 2);
  g.fillStyle = "#24302c";
  g.fill();
  g.fillStyle = "rgba(255,240,210,0.95)";
  [1.62, 1.72].forEach((a) => {
    g.beginPath();
    g.arc(Math.cos(Math.PI * a) * 8, Math.sin(Math.PI * a) * 8, 0.9, 0, Math.PI * 2);
    g.fill();
  });
  g.restore();
}

function softGlow(g, x, y, r, color) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

// Strokes the current path with the town's hand-drawn ink outline.
function ink(g, width = 2) {
  g.strokeStyle = INK;
  g.lineWidth = width;
  g.lineJoin = "round";
  g.stroke();
}

// Floor planks, outlined walls, and the doorway with a mat: the shared
// storybook shell for every room. `style` sets each room's colours.
function drawRoomShell(g, room, style) {
  const { w, h, wall, doorX, doorW } = room;
  const plankH = 32;
  for (let row = 0, y = 0; y < h; row++, y += plankH) {
    g.fillStyle = row % 2 ? style.floorA : style.floorB;
    g.fillRect(0, y, w, Math.min(plankH, h - y));
    g.strokeStyle = style.seam;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    for (let x = (row * 83) % 170; x < w; x += 170) {
      g.moveTo(x, y);
      g.lineTo(x, Math.min(y + plankH, h));
    }
    g.stroke();
  }
  (style.rugs || []).forEach((draw) => draw());

  // Walls, with a lighter trim along their inner edge
  const walls = () => {
    g.beginPath();
    g.rect(0, 0, w, wall);
    g.rect(0, 0, wall, h);
    g.rect(w - wall, 0, wall, h);
    g.rect(0, h - wall, doorX - doorW / 2, wall);
    g.rect(doorX + doorW / 2, h - wall, w - (doorX + doorW / 2), wall);
  };
  walls();
  g.fillStyle = style.wall;
  g.fill();
  g.strokeStyle = style.wallTrim;
  g.lineWidth = 4;
  g.strokeRect(wall - 3, wall - 3, w - wall * 2 + 6, h - wall * 2 + 6);
  g.beginPath();
  g.rect(wall, wall, w - wall * 2, h - wall * 2);
  ink(g, 2.5);
  g.beginPath();
  g.rect(0, 0, w, h);
  ink(g, 3);

  // Doorway and mat
  g.fillStyle = style.doorway;
  g.fillRect(doorX - doorW / 2, h - wall - 1, doorW, wall + 2);
  g.beginPath();
  g.moveTo(doorX - doorW / 2, h - wall);
  g.lineTo(doorX - doorW / 2, h);
  g.moveTo(doorX + doorW / 2, h - wall);
  g.lineTo(doorX + doorW / 2, h);
  ink(g, 2.5);
  roundRect(g, doorX - 34, h - wall - 26, 68, 22, 5);
  g.fillStyle = style.mat;
  g.fill();
  ink(g, 1.8);
  g.strokeStyle = "rgba(62,50,38,0.3)";
  g.lineWidth = 1;
  roundRect(g, doorX - 29, h - wall - 21, 58, 12, 3);
  g.stroke();
}

// A terracotta pot with a puffy, ink-outlined plant in it.
function drawPottedPlant(g, p) {
  g.fillStyle = "rgba(60,40,20,0.2)";
  g.beginPath();
  g.ellipse(p.x + 2, p.y + 14, 17, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(p.x - 14, p.y - 2);
  g.lineTo(p.x + 14, p.y - 2);
  g.lineTo(p.x + 10, p.y + 14);
  g.lineTo(p.x - 10, p.y + 14);
  g.closePath();
  g.fillStyle = "#c9793a";
  g.fill();
  ink(g, 2);
  drawBush(g, p.x, p.y - 14, 0, "#5e8f3e", "#79ad4f", 0.62);
}

function drawLabRoom(g, t) {
  // A moody, cozy lounge: warm terrazzo floor, deep evergreen walls, a rust
  // rug under the round sofa in the middle, and pools of lamplight.
  drawRoomShell(g, LAB, {
    floorA: "#e9dcc8", floorB: "#e9dcc8", seam: "rgba(0,0,0,0)",
    wall: "#3d574b", wallTrim: "#557263", doorway: "#f3e6cf", mat: "#c46a3f",
    rugs: [
      () => {
        // Terrazzo flecks
        let seed = 7;
        const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const flecks = ["#c9a98a", "#b9c4ae", "#d8b48f", "#a99a8a"];
        for (let k = 0; k < 340; k++) {
          g.fillStyle = flecks[k % flecks.length];
          g.beginPath();
          g.ellipse(rand() * LAB.w, rand() * LAB.h, 1.5 + rand() * 2.5, 1 + rand() * 1.8, rand() * 3, 0, Math.PI * 2);
          g.fill();
        }
      },
      () => {
        // A round rust rug under the lounge
        g.beginPath();
        g.arc(labPlatform.x, labPlatform.y, labPlatform.r + 34, 0, Math.PI * 2);
        g.fillStyle = "#b8643f";
        g.fill();
        ink(g, 2.2);
        g.strokeStyle = "#d98b5f";
        g.lineWidth = 3;
        g.beginPath();
        g.arc(labPlatform.x, labPlatform.y, labPlatform.r + 22, 0, Math.PI * 2);
        g.stroke();
      },
    ],
  });

  // The back wall: walnut slats with arched niches, each lit from inside
  const sh = labShelf;
  roundRect(g, sh.x, sh.y, sh.w, sh.h, 6);
  g.fillStyle = "#6b4630";
  g.fill();
  ink(g, 2.5);
  g.fillStyle = "#58392a";
  for (let sx = sh.x + 4; sx < sh.x + sh.w - 4; sx += 9) g.fillRect(sx, sh.y + 3, 4, sh.h - 6);
  for (let i = 0; i < 6; i++) {
    const nx = sh.x + 40 + i * 64;
    softGlow(g, nx, sh.y + 24, 40, "rgba(255,206,140,0.45)");
    g.beginPath();
    g.moveTo(nx - 18, sh.y + 38);
    g.lineTo(nx - 18, sh.y + 22);
    g.arc(nx, sh.y + 22, 18, Math.PI, 0);
    g.lineTo(nx + 18, sh.y + 38);
    g.closePath();
    g.fillStyle = "#ffe4b8";
    g.fill();
    ink(g, 1.6);
    drawGadget(g, nx, sh.y + 24, GADGET_COLORS[i], 0.85, t + i);
  }

  // Stone plinths along the walls, each in its own pool of light. The one
  // Anna can pick up glows gold until she takes it, and is left empty after.
  labPedestals.forEach((p, i) => {
    const pickup = p === labPickup;
    const taken = pickup && (anna.hearingAid || cuffFlight);
    softGlow(g, p.x, p.y, 80, "rgba(255,206,140,0.4)");
    if (pickup && !taken) {
      softGlow(g, p.x, p.y, 92, `rgba(240,196,100,${0.3 + (0.5 + Math.sin(t * 2.4) * 0.5) * 0.35})`);
    }
    g.fillStyle = "rgba(40,30,20,0.2)";
    g.beginPath();
    g.ellipse(p.x + 3, p.y + 8, 28, 24, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(p.x, p.y, 27, 0, Math.PI * 2);
    g.fillStyle = "#d8cbb6";
    g.fill();
    ink(g, 2.5);
    g.beginPath();
    g.arc(p.x, p.y, 20, 0, Math.PI * 2);
    g.fillStyle = "#efe6d6";
    g.fill();
    ink(g, 1.2);
    g.strokeStyle = "rgba(160,140,115,0.35)"; // travertine veins
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(p.x - 16, p.y + 6);
    g.quadraticCurveTo(p.x, p.y + 2, p.x + 15, p.y + 9);
    g.stroke();
    if (!taken) drawGadget(g, p.x, p.y, p.color, 1.3, t + i * 0.7);
  });

  // A reflecting pool with candles floating on it
  const bs = labBasin;
  g.beginPath();
  g.arc(bs.x, bs.y, bs.r + 9, 0, Math.PI * 2);
  g.fillStyle = "#cfc4b3";
  g.fill();
  ink(g, 2.5);
  const water = g.createRadialGradient(bs.x, bs.y, 4, bs.x, bs.y, bs.r);
  water.addColorStop(0, "#5f8b88");
  water.addColorStop(1, "#3d6463");
  g.fillStyle = water;
  g.beginPath();
  g.arc(bs.x, bs.y, bs.r, 0, Math.PI * 2);
  g.fill();
  ink(g, 1.8);
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.3 + i / 3) % 1;
    g.strokeStyle = `rgba(255,236,200,${0.4 * (1 - phase)})`;
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(bs.x, bs.y, 6 + phase * (bs.r - 8), 0, Math.PI * 2);
    g.stroke();
  }
  [[-18, -10], [16, -16], [6, 18]].forEach(([cx, cy], i) => {
    const bob = Math.sin(t * 0.8 + i * 2) * 1.5;
    const px = bs.x + cx + bob, py = bs.y + cy;
    softGlow(g, px, py, 22, "rgba(255,200,120,0.5)");
    g.beginPath();
    g.arc(px, py, 5, 0, Math.PI * 2);
    g.fillStyle = "#f6efe2";
    g.fill();
    ink(g, 1);
    g.fillStyle = "#ffcf70";
    g.beginPath();
    g.ellipse(px, py, 1.6, 2.4, 0, 0, Math.PI * 2);
    g.fill();
  });

  // Deep lounge chairs in rust boucle, with a throw over one, and a pot of tea
  labLoungers.forEach((l, i) => {
    g.fillStyle = "rgba(40,30,20,0.2)";
    roundRect(g, l.x + 3, l.y + 5, l.w, l.h, 18);
    g.fill();
    roundRect(g, l.x, l.y, l.w, l.h, 18);
    g.fillStyle = "#c46a3f";
    g.fill();
    ink(g, 2.2);
    roundRect(g, l.x + 6, l.y + 22, l.w - 12, l.h - 28, 12);
    g.fillStyle = "#d98b5f";
    g.fill();
    ink(g, 1.4);
    if (i === 0) {
      roundRect(g, l.x + 4, l.y + l.h - 34, l.w - 8, 24, 6);
      g.fillStyle = "#efe2c8";
      g.fill();
      ink(g, 1.4);
      g.strokeStyle = "rgba(62,50,38,0.3)";
      g.lineWidth = 1;
      g.beginPath();
      [l.y + l.h - 26, l.y + l.h - 18].forEach((yy) => {
        g.moveTo(l.x + 8, yy);
        g.lineTo(l.x + l.w - 8, yy);
      });
      g.stroke();
    }
  });
  const tea = labTeaTable;
  g.beginPath();
  g.arc(tea.x, tea.y, 15, 0, Math.PI * 2);
  g.fillStyle = "#6b4630";
  g.fill();
  ink(g, 1.8);
  g.beginPath();
  g.arc(tea.x - 3, tea.y, 6, 0, Math.PI * 2);
  g.fillStyle = "#efe6d6";
  g.fill();
  ink(g, 1);
  g.beginPath();
  g.arc(tea.x + 7, tea.y + 5, 3, 0, Math.PI * 2);
  g.fill();
  ink(g, 1);

  labPlants.forEach((p) => drawPottedPlant(g, p));

  // The round lounge sofa in the middle, open toward the door
  const pl = labPlatform;
  const inner = LAB_SOFA.inner, outer = LAB_SOFA.outer;
  const a0 = LAB_SOFA.from, a1 = LAB_SOFA.to;
  g.fillStyle = "rgba(40,30,20,0.22)";
  g.beginPath();
  g.arc(pl.x + 3, pl.y + 7, outer, a0, a1);
  g.arc(pl.x + 3, pl.y + 7, inner, a1, a0, true);
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(pl.x, pl.y, outer, a0, a1);
  g.arc(pl.x, pl.y, inner, a1, a0, true);
  g.closePath();
  g.fillStyle = "#f1e7d6";
  g.fill();
  ink(g, 2.5);
  g.beginPath();
  g.arc(pl.x, pl.y, outer - 6, a0 + 0.03, a1 - 0.03);
  g.strokeStyle = "#ddd0bb";
  g.lineWidth = 9;
  g.lineCap = "round";
  g.stroke();
  // Seams between the cushions, and a few scatter cushions
  g.strokeStyle = "rgba(62,50,38,0.3)";
  g.lineWidth = 1.2;
  for (let a = a0 + 0.55; a < a1 - 0.2; a += 0.55) {
    g.beginPath();
    g.moveTo(pl.x + Math.cos(a) * inner, pl.y + Math.sin(a) * inner);
    g.lineTo(pl.x + Math.cos(a) * (outer - 10), pl.y + Math.sin(a) * (outer - 10));
    g.stroke();
  }
  [[a0 + 0.35, "#d9a441"], [Math.PI * 1.5, "#5f8b88"], [a1 - 0.35, "#c46a3f"]].forEach(([a, color]) => {
    const cx = pl.x + Math.cos(a) * (inner + 10), cy = pl.y + Math.sin(a) * (inner + 10);
    roundRect(g, cx - 8, cy - 8, 16, 16, 5);
    g.fillStyle = color;
    g.fill();
    ink(g, 1.3);
  });

  // Brass pendant lights hanging over the lounge
  const pulse = 0.5 + Math.sin(t * 1.2) * 0.5;
  [[pl.x - 70, pl.y - 40], [pl.x + 70, pl.y - 40], [pl.x, pl.y + 50]].forEach(([lx, ly]) => {
    softGlow(g, lx, ly, 90, `rgba(255,200,130,${0.18 + pulse * 0.08})`);
  });

  // The wearable, waiting on a little stone side table next to the fitter
  g.beginPath();
  g.arc(labTray.x, labTray.y, labTray.r, 0, Math.PI * 2);
  g.fillStyle = "#d8cbb6";
  g.fill();
  ink(g, 2);
  softGlow(g, labTray.x, labTray.y, 34, `rgba(246,178,110,${0.25 + pulse * 0.25})`);
  drawGadget(g, labTray.x, labTray.y, HEARING_AID_COLOR, 1, t);
}

// Warm, dim corners: a soft vignette over the room, drawn on top of
// everything so the light pools stand out.
function drawLabVignette(g) {
  const v = g.createRadialGradient(LAB.w / 2, LAB.h / 2, LAB.h * 0.35, LAB.w / 2, LAB.h / 2, LAB.w * 0.62);
  v.addColorStop(0, "rgba(30,24,18,0)");
  v.addColorStop(1, "rgba(30,24,18,0.3)");
  g.fillStyle = v;
  g.fillRect(0, 0, LAB.w, LAB.h);
}

function renderLab(now) {
  const t = now / 1000;
  const g = labCtx;
  const { scale: s, ox, oy } = labView;

  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, labCanvas.width, labCanvas.height);
  g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);

  g.save();
  g.shadowColor = "rgba(62,50,38,0.22)";
  g.shadowBlur = 40;
  g.fillStyle = "#3d574b";
  g.fillRect(0, 0, LAB.w, LAB.h);
  g.restore();

  drawLabRoom(g, t);

  // The shoppers mostly gaze at the cuff, now and then turning to each other
  // to talk it over; the first leans in for a closer look.
  const [first, second] = labShoppers;
  const beat = t % 8;
  first.facing = beat > 5.2 && beat < 6.6 ? "down" : "left";
  second.facing = beat > 2.4 && beat < 4 ? "up" : beat > 5.2 && beat < 6.6 ? "up" : "left";
  const lean = first.facing === "left" ? Math.max(0, Math.sin(t * 0.9)) * 4 : 0;

  // Fitter, the shoppers, Anna (and Jamie, if she's along), back-to-front
  [
    { y: labFitter.y, draw: () => drawCharacter(g, labFitter, labFitter.x, labFitter.y, 1.4, animPhase, false) },
    { y: first.y, draw: () => drawCharacter(g, first, first.x - lean, first.y, 1.4, animPhase + 1.1, false) },
    { y: second.y, draw: () => drawCharacter(g, second, second.x, second.y, 1.4, animPhase + 2.3, false) },
    { y: anna.y, draw: () => drawCharacter(g, anna, anna.x, anna.y, 1.4, animPhase, !!anna.moving) },
    ...(jamieJoined
      ? [{ y: jamie.y, draw: () => drawCharacter(g, jamie, jamie.x, jamie.y, 1.4, animPhase + 0.7, !!jamie.moving) }]
      : []),
  ]
    .sort((a, b) => a.y - b.y)
    .forEach((d) => d.draw());
  drawCuffFlight(g, t);
  drawShopperThought(g, t);
  drawLabVignette(g);
}

// Every so often, a little thought bubble over the first shopper, with the
// cuff in it: picturing herself wearing it.
function drawShopperThought(g, t) {
  const phase = (t + 3) % 8;
  if (phase > 3.2) return;
  const alpha = Math.min(1, phase * 3, (3.2 - phase) * 3);
  const p = labShoppers[0];
  const bx = p.x + 6, by = p.y - 76;
  g.save();
  g.globalAlpha = alpha;
  [[p.x - 2, p.y - 50, 2.5], [p.x + 2, p.y - 57, 3.5]].forEach(([cx, cy, r]) => {
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fillStyle = "#fdf7ea";
    g.fill();
    ink(g, 1.2);
  });
  g.beginPath();
  g.ellipse(bx, by, 20, 15, 0, 0, Math.PI * 2);
  g.fillStyle = "#fdf7ea";
  g.fill();
  ink(g, 1.6);
  drawGadget(g, bx - 1, by - 1, labShopperStand.color, 0.75, t);
  g.restore();
}

// The cuff on its way from the stand to Anna's ear: it rises, arcs over,
// and shrinks down to fit her ear, trailing a little golden shimmer.
function drawCuffFlight(g, t) {
  if (!cuffFlight) return;
  const k = cuffFlight.t;
  const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const from = labPickup, to = cuffEarPoint(anna, 1.4);
  const x = from.x + (to.x - from.x) * ease;
  const y = from.y + (to.y - from.y) * ease - Math.sin(k * Math.PI) * 70;
  const size = 1.3 + (0.25 - 1.3) * ease;
  for (let i = 1; i <= 5; i++) {
    const kk = Math.max(0, k - i * 0.04);
    const ee = kk < 0.5 ? 2 * kk * kk : 1 - Math.pow(-2 * kk + 2, 2) / 2;
    g.fillStyle = `rgba(255,214,130,${0.5 * (1 - i / 6)})`;
    g.beginPath();
    g.arc(from.x + (to.x - from.x) * ee, from.y + (to.y - from.y) * ee - Math.sin(kk * Math.PI) * 70, 3 - i * 0.4, 0, Math.PI * 2);
    g.fill();
  }
  softGlow(g, x, y, 40 * size + 10, "rgba(255,214,130,0.55)");
  drawGadget(g, x, y, HEARING_AID_COLOR, size, t);
}

/* ---------------------------------------------------------------------- */
/* Jamie's house: "Subtitles for the World"                               */
/*                                                                        */
/* Anna visits her friend Jamie, who is hard of hearing. Instead of a   */
/* gadget for every sound, Jamie has one captioning device in the middle  */
/* of the house, hooked up to her TV and her monitor. Jamie walks her     */
/* through what it does; E (or a click on the speech bubble) moves the    */
/* story along.                                                           */
/* ---------------------------------------------------------------------- */

const SUBS = { w: 900, h: 640, wall: 26, doorX: 450, doorW: 76 };
const SUBS_BOUNDS = { width: SUBS.w, height: SUBS.h };
const SUBS_MOVE_SPEED = 150;
const JAMIE_SPEED = 130;

// Furniture, in the room's own coordinates.
const subsScreen = { x: 240, y: 30, w: 420, h: 128 }; // the TV on the back wall
const subsSofa = { x: 330, y: 280, w: 240, h: 56 };
const subsCounter = { x: 40, y: 40, w: 170, h: 58 }; // the kitchen, with the oven
const subsDesk = { x: 690, y: 74, w: 180, h: 58 };
const subsMonitor = { x: 716, y: 34, w: 128, h: 74 };
const subsDeskChair = { x: 780, y: 160, r: 16 };
const subsHubTable = { x: 450, y: 412, r: 34 }; // the coffee table the captioner sits on
const subsAlarm = { x: 236, y: 13 }; // the smoke alarm, high on the back wall
const subsPlants = [{ x: 60, y: 590 }, { x: 840, y: 590 }];

const subsObstacles = [
  { x: 0, y: 0, w: SUBS.w, h: SUBS.wall },
  { x: 0, y: 0, w: SUBS.wall, h: SUBS.h },
  { x: SUBS.w - SUBS.wall, y: 0, w: SUBS.wall, h: SUBS.h },
  { x: 0, y: SUBS.h - SUBS.wall, w: SUBS.doorX - SUBS.doorW / 2, h: SUBS.wall },
  {
    x: SUBS.doorX + SUBS.doorW / 2, y: SUBS.h - SUBS.wall,
    w: SUBS.w - (SUBS.doorX + SUBS.doorW / 2), h: SUBS.wall,
  },
  subsScreen, subsSofa, subsCounter, subsDesk,
  circleBox(subsDeskChair), circleBox(subsHubTable),
  ...subsPlants.map((p) => circleBox(p, 15)),
];

const jamie = {
  name: "Jamie",
  x: 560, y: 500, facing: "down", path: [],
  hearingAid: "#e8833a", hearingAidPair: true, // a pair, like Anna's but orange
  palette: { skin: "#a86f4c", hair: "#2a1c14", hairStyle: "medium", ears: true, outfit: "#7aa874", outfitTrim: "#f4ecd8" },
};
const JAMIE_START = { x: 560, y: 500 };

// Where Jamie's link goes: the prototype of the captioner.
const SUBTITLES_PROTOTYPE_URL = "https://sunny.dabble.team/prototype2/";

// The roommate's colour: the captioner glows this when she calls for Jamie.
const ROOMMATE_COLOR = "#5fc7b8";

// The story, one speech bubble per step. Jamie walks `walk` (waypoints that
// keep her clear of the furniture) before she speaks, and the captioner does
// `device` for the step: "oven" (pushes a reminder to the screens), "name"
// (glows the roommate's colour) or "emergency" (flashes, rumbles, and takes
// over every screen).
const subsStory = [
  {
    who: "jamie",
    text: "anna! you made it. come on in!",
  },
  {
    who: "anna", device: "oven", delay: 1.6, // a moment to see the subtitle before she notices
    text: "wait, did your tv just tell you the oven's done?",
  },
  {
    who: "jamie", device: "oven", walk: [[528, 440]],
    text: "yep! that's my captioner. it's one device that connects to all my screens. it listens for everything i can't hear and puts it on my screens as subtitles.",
  },
  {
    who: "jamie", device: "name",
    text: "it glows in teal when someone calls my name...",
  },
  {
    who: "jamie", device: "emergency",
    text: "...and flashes red and rumbles if there's an emergency alarm.",
  },
  {
    who: "jamie",
    text: "these are my subtitles for the world! now it's just one device i can keep in my home and bring with me -- these days I feel like my hearing has gotten a lot better, but I think I just understand what's happening around me.",
  },
  {
    // E opens the link (in a new tab) as well as moving the story on.
    who: "jamie", link: SUBTITLES_PROTOTYPE_URL,
    text: "most of us here in Carmel have this -- you should grab one! check out this link!",
  },
  {
    who: "jamie",
    text: "so what're you doing tonight?",
  },
  {
    who: "anna",
    text: "hmm i don't typically go out on a friday night, i'm usually quite overwhelmed..",
  },
  {
    who: "jamie",
    text: "oh i've got to take you to a local favourite -- nights out are a beautiful ritual for us here in Carmel. let's go.",
  },
];

let storyStep = -1; // which step is playing; -1 once the story is over
let stepTime = 0; // seconds since the step began
let storyDevice = null; // the object that's currently doing its thing
let deviceTime = 0; // seconds since it started

const subsCanvas = document.getElementById("subsCanvas");
const subsCtx = subsCanvas.getContext("2d");
const storyBubbleEl = document.getElementById("storyBubble");
const subsView = { scale: 1, ox: 0, oy: 0 };
const subsBuilding = buildings.find((b) => b.enter === "subtitles");
let shownStoryStep = null;

function resizeSubsCanvas() {
  subsCanvas.width = Math.round(viewW * dpr);
  subsCanvas.height = Math.round(viewH * dpr);
  const top = 76, bottom = 64;
  const s = Math.min((viewW - 32) / SUBS.w, (viewH - top - bottom) / SUBS.h, 1.3);
  subsView.scale = s;
  subsView.ox = (viewW - SUBS.w * s) / 2;
  subsView.oy = top + (viewH - top - bottom - SUBS.h * s) / 2;
}
window.addEventListener("resize", resizeSubsCanvas);
resizeSubsCanvas();

function startStoryStep(i) {
  const step = subsStory[i];
  storyStep = i;
  stepTime = 0;
  jamie.path = (step.walk || []).map(([x, y]) => ({ x, y }));
  if ((step.device || null) !== storyDevice) {
    storyDevice = step.device || null;
    deviceTime = 0;
  }
}

// Ready once Jamie has finished walking and the step's pause has passed.
function storyStepReady() {
  return storyStep >= 0 && jamie.path.length === 0 && stepTime >= (subsStory[storyStep].delay || 0.35);
}

function advanceStory() {
  if (!storyStepReady()) return;
  const { link } = subsStory[storyStep];
  if (link) openInNewTab(link, "Open the link");
  if (storyStep + 1 < subsStory.length) {
    startStoryStep(storyStep + 1);
  } else {
    storyStep = -1;
    storyDevice = null;
    jamieJoins();
  }
}

/* Once the story's over, Jamie comes along to Cafe Lumen: from then on  */
/* she follows a few steps behind Anna wherever she goes, so steering   */
/* Anna walks them both.                                                */

let jamieJoined = false;
const companionTrail = []; // where Anna has walked, oldest first
const FOLLOW_GAP = 44; // how far behind her Jamie walks, along her path

function jamieJoins() {
  jamieJoined = true;
  jamie.path = [];
  companionTrail.length = 0;
  companionTrail.push({ x: jamie.x, y: jamie.y }, { x: anna.x, y: anna.y });
}

// Puts Jamie at (dx, dy) from Anna: on arriving somewhere new, or after
// Anna has been dragged or clicked into place.
function seedCompanion(dx, dy) {
  if (!jamieJoined) return;
  jamie.x = anna.x + dx;
  jamie.y = anna.y + dy;
  jamie.facing = anna.facing;
  jamie.moving = false;
  companionTrail.length = 0;
  companionTrail.push({ x: jamie.x, y: jamie.y }, { x: anna.x, y: anna.y });
}

// Jamie walks to the spot FOLLOW_GAP back along Anna's path, so she
// follows the way Anna went instead of cutting corners through walls.
function updateCompanion(dt) {
  if (!jamieJoined) return;
  const trail = companionTrail;
  const last = trail[trail.length - 1];
  if (!last || Math.hypot(anna.x - last.x, anna.y - last.y) > 2) trail.push({ x: anna.x, y: anna.y });

  let remaining = FOLLOW_GAP, px = anna.x, py = anna.y, target = null;
  for (let i = trail.length - 1; i >= 0; i--) {
    const q = trail[i];
    const d = Math.hypot(px - q.x, py - q.y);
    if (d >= remaining) {
      const f = remaining / d;
      target = { x: px + (q.x - px) * f, y: py + (q.y - py) * f };
      trail.splice(0, i); // everything older is behind her now
      break;
    }
    remaining -= d;
    px = q.x;
    py = q.y;
  }

  const dx = target ? target.x - jamie.x : 0, dy = target ? target.y - jamie.y : 0;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) {
    jamie.moving = false;
    return;
  }
  const stride = Math.min(dist, 280 * dt);
  jamie.x += (dx / dist) * stride;
  jamie.y += (dy / dist) * stride;
  jamie.moving = true;
  jamie.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
}

storyBubbleEl.addEventListener("click", advanceStory);

function enterSubs() {
  anna.x = SUBS.doorX;
  anna.y = SUBS.h - SUBS.wall - 26;
  anna.facing = "up";
  anna.moving = false;
  storyDevice = null;
  if (jamieJoined) {
    storyStep = -1;
    seedCompanion(-34, 4);
  } else {
    Object.assign(jamie, JAMIE_START, { facing: "down", path: [], moving: false });
    startStoryStep(0);
  }
  setScene("subtitles");
}

function leaveSubs() {
  const door = doorOf(subsBuilding);
  anna.x = door.x;
  anna.y = door.y + CHAR_RADIUS + 18;
  anna.facing = "down";
  anna.moving = false;
  seedCompanion(32, 2);
  storyStep = -1;
  storyDevice = null;
  shownStoryStep = null;
  storyBubbleEl.hidden = true;
  // Stepping out with Jamie, the day has turned to evening.
  if (jamieJoined) eveningTarget = 1;
  setScene("world");
}

document.getElementById("subsBack").addEventListener("click", leaveSubs);

// Jamie follows her waypoints, then turns to face Anna.
function updateJamie(dt) {
  const target = jamie.path[0];
  if (target) {
    const dx = target.x - jamie.x, dy = target.y - jamie.y;
    const dist = Math.hypot(dx, dy);
    const stride = JAMIE_SPEED * dt;
    if (dist <= stride) {
      jamie.x = target.x;
      jamie.y = target.y;
      jamie.path.shift();
    } else {
      jamie.x += (dx / dist) * stride;
      jamie.y += (dy / dist) * stride;
    }
    jamie.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    jamie.moving = true;
    return;
  }
  jamie.moving = false;
  const dx = anna.x - jamie.x, dy = anna.y - jamie.y;
  jamie.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
}

function updateSubs(dt) {
  // Jamie's in the way while she's showing Anna around, but not once she's following her.
  const jamieBox = { x: jamie.x - 12, y: jamie.y - 8, w: 24, h: 22 };
  stepCharacter(anna, dt, SUBS_MOVE_SPEED, jamieJoined ? subsObstacles : [...subsObstacles, jamieBox], SUBS_BOUNDS);
  if (anna.y > SUBS.h - SUBS.wall + 4) {
    leaveSubs();
    return;
  }
  if (jamieJoined) updateCompanion(dt);
  else updateJamie(dt);
  stepTime += dt;
  deviceTime += dt;
  updateStoryBubble();

}

// The speech bubble over whoever's talking, with a prompt to carry on.
function updateStoryBubble() {
  const step = storyStepReady() ? storyStep : null;
  if (step !== shownStoryStep) {
    shownStoryStep = step;
    storyBubbleEl.hidden = step === null;
    if (step !== null) {
      const { who, text } = subsStory[step];
      const last = step === subsStory.length - 1;
      storyBubbleEl.innerHTML = `
        <p class="quote-name">${who === "jamie" ? "Jamie" : "Anna"}</p>
        <p class="quote-text">${text}</p>
        <p class="story-next">Press <kbd>E</kbd> ${subsStory[step].link ? "to open the link" : last ? "to finish" : "to continue"}</p>
        <svg class="quote-tail" viewBox="0 0 30 24" aria-hidden="true">
          <path d="M3 0 Q 10 12 5 22 Q 17 14 27 0" />
        </svg>
      `;
    }
  }
  if (step === null) return;

  const { who, below } = subsStory[step];
  const speaker = who === "jamie" ? jamie : anna;
  const { scale: s, ox, oy } = subsView;
  const sx = ox + speaker.x * s;
  const half = storyBubbleEl.offsetWidth / 2;
  const left = clamp(sx, half + 12, viewW - half - 12);
  storyBubbleEl.classList.toggle("below", !!below);
  storyBubbleEl.style.left = `${left}px`;
  if (below) {
    // Under their feet, with the tail pointing up at them.
    const sy = oy + (speaker.y + 16) * s;
    storyBubbleEl.style.top = `${Math.min(sy + 22, viewH - storyBubbleEl.offsetHeight - 12)}px`;
  } else {
    const sy = oy + (speaker.y - 58) * s;
    storyBubbleEl.style.top = `${Math.max(sy - 22, storyBubbleEl.offsetHeight + 12)}px`;
  }
  storyBubbleEl.style.setProperty("--tail-x", `${clamp(sx - left + half, 20, half * 2 - 20)}px`);
}

// A caption strip: white text on a dark rounded bar, like subtitles.
function drawCaption(g, text, x, y, size, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  g.font = `600 ${size}px Inter, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const w = g.measureText(text).width + size * 1.2;
  const h = size * 1.8;
  g.fillStyle = "rgba(46,36,27,0.9)";
  roundRect(g, x - w / 2, y - h / 2, w, h, h / 2.6);
  g.fill();
  g.fillStyle = "#ffffff";
  g.fillText(text, x, y + 1);
  g.restore();
}

// A round wooden side table.
function drawSideTable(g, table) {
  g.fillStyle = "rgba(60,40,20,0.18)";
  g.beginPath();
  g.arc(table.x + 2, table.y + 5, table.r, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(table.x, table.y, table.r, 0, Math.PI * 2);
  g.fillStyle = "#cfae80";
  g.fill();
  ink(g, 2.2);
  g.beginPath();
  g.arc(table.x, table.y, table.r - 5, 0, Math.PI * 2);
  g.fillStyle = "#e6cfa9";
  g.fill();
}

// What a connected screen shows: its usual picture, a reminder from the
// captioner as a subtitle, or, in an emergency, a red alert over everything.
// `x`/`y`/`w`/`h` is the glass; `size` scales the text for smaller screens.
function drawScreenFeed(g, x, y, w, h, size, t, idle) {
  const glass = g.createLinearGradient(0, y, 0, y + h);
  glass.addColorStop(0, "#35536f");
  glass.addColorStop(1, "#1d2e40");
  g.fillStyle = glass;
  roundRect(g, x, y, w, h, 6);
  g.fill();
  g.save();
  roundRect(g, x, y, w, h, 6);
  g.clip();
  idle(x, y, w, h);

  if (storyDevice === "emergency") {
    const flash = Math.sin(t * 8) > 0;
    g.fillStyle = flash ? "rgba(214,58,46,0.94)" : "rgba(150,30,26,0.94)";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#ffffff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `800 ${Math.round(22 * size)}px Inter, sans-serif`;
    g.letterSpacing = `${Math.round(2 * size)}px`;
    g.fillText("SMOKE ALARM", x + w / 2, y + h * 0.4);
    g.letterSpacing = "0px";
    g.font = `600 ${Math.round(13 * size)}px Inter, sans-serif`;
    g.fillText("kitchen · test mode", x + w / 2, y + h * 0.7);
  }
  g.restore();
  roundRect(g, x, y, w, h, 6);
  ink(g, 1.8);

  if (storyDevice === "oven") {
    const fade = Math.min(1, deviceTime / 0.4);
    g.save();
    g.globalAlpha = fade;
    g.fillStyle = "#f2b36b";
    g.font = `700 ${Math.round(11 * size)}px Inter, sans-serif`;
    g.letterSpacing = "2px";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("[ KITCHEN ]", x + w / 2, y + h * 0.5);
    g.letterSpacing = "0px";
    g.restore();
    drawCaption(g, "the oven is done", x + w / 2, y + h * 0.78, Math.round(20 * size), fade);
  }
}

// The captioner: a speaker-like tube lying on its side on the coffee table,
// with rings of light round its ends and a wide screen along its front. It breathes
// a warm white while it listens, glows the caller's colour when it hears
// Jamie's name, and flashes red and rumbles in an emergency, and its screen
// says what it heard. When it sends something to the TV and the monitor,
// little pulses run along to each of them.
function drawCaptioner(g, t) {
  const hub = subsHubTable;
  const emergency = storyDevice === "emergency";
  const flash = emergency && Math.sin(t * 8) > 0;
  const shake = emergency ? Math.sin(t * 55) * 1.6 : 0;

  // Pulses travelling out to the TV and the monitor
  if (storyDevice === "oven" || emergency) {
    const color = emergency ? "255,90,70" : "242,179,107";
    const targets = [
      { x: subsScreen.x + subsScreen.w / 2, y: subsScreen.y + subsScreen.h },
      { x: subsMonitor.x + subsMonitor.w / 2, y: subsMonitor.y + subsMonitor.h + 26 },
    ];
    targets.forEach((to, k) => {
      g.save();
      g.setLineDash([3, 7]);
      g.strokeStyle = `rgba(${color},0.35)`;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(hub.x, hub.y - 23);
      g.lineTo(to.x, to.y);
      g.stroke();
      g.restore();
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.7 + i / 3 + k * 0.17) % 1;
        g.fillStyle = `rgba(${color},${0.9 * Math.min(1, (1 - ph) * 3)})`;
        g.beginPath();
        g.arc(hub.x + (to.x - hub.x) * ph, hub.y - 23 + (to.y - hub.y + 23) * ph, 3.2, 0, Math.PI * 2);
        g.fill();
      }
    });
  }

  // Rumble: red rings spreading across the floor from the coffee table
  if (emergency) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.9 + i / 3) % 1;
      g.strokeStyle = `rgba(214,58,46,${0.55 * (1 - ph)})`;
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(hub.x, hub.y, 40 + ph * 150, (40 + ph * 150) * 0.55, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }

  drawSideTable(g, hub);

  const ringColor = emergency ? (flash ? "#ff5a46" : "#9b2a22")
    : storyDevice === "name" ? ROOMMATE_COLOR
      : storyDevice === "oven" ? "#f2b36b"
        : "#fff1d6";
  const breathe = 0.5 + Math.sin(t * 1.6) * 0.5;
  const glow = emergency ? (flash ? "rgba(255,80,60,0.75)" : "rgba(255,80,60,0.2)")
    : storyDevice === "name" ? `rgba(95,199,184,${0.45 + breathe * 0.3})`
      : storyDevice === "oven" ? "rgba(242,179,107,0.5)"
        : `rgba(255,236,200,${0.25 + breathe * 0.2})`;
  softGlow(g, hub.x, hub.y - 20, storyDevice ? 120 : 70, glow);

  // The tube: a fabric-covered cylinder, lying on its side on the table
  const half = 30, r = 13, cy = hub.y - 10, capRx = 6;
  const left = hub.x - half, right = hub.x + half, top = cy - r;
  g.save();
  g.translate(shake, 0);
  g.fillStyle = "rgba(60,40,20,0.25)";
  g.beginPath();
  g.ellipse(hub.x + 3, cy + r + 1, half + 4, 5, 0, 0, Math.PI * 2);
  g.fill();
  const body = () => {
    g.beginPath();
    g.moveTo(left, top);
    g.lineTo(right, top);
    g.ellipse(right, cy, capRx, r, 0, -Math.PI / 2, Math.PI / 2);
    g.lineTo(left, cy + r);
    g.ellipse(left, cy, capRx, r, 0, Math.PI / 2, Math.PI * 1.5);
    g.closePath();
  };
  const shade = g.createLinearGradient(0, top, 0, cy + r);
  shade.addColorStop(0, "#f6efe2");
  shade.addColorStop(0.5, "#e9dfcc");
  shade.addColorStop(1, "#c9bca4");
  body();
  g.fillStyle = shade;
  g.fill();
  // Speaker fabric: rows of tiny dots
  g.save();
  body();
  g.clip();
  g.fillStyle = "rgba(90,70,50,0.18)";
  for (let yy = top + 2; yy < cy + r; yy += 3) {
    for (let xx = left - capRx + ((yy - top) % 6 ? 1.5 : 0); xx < right + capRx; xx += 3) {
      g.fillRect(xx, yy, 1, 1);
    }
  }
  g.restore();
  body();
  ink(g, 2);

  // The near end, with its ring of light (and the far end's, peeking round)
  g.beginPath();
  g.ellipse(right, cy, capRx, r, 0, 0, Math.PI * 2);
  g.fillStyle = "#efe6d6";
  g.fill();
  ink(g, 1.6);
  g.beginPath();
  g.ellipse(right, cy, capRx - 1.8, r - 3, 0, 0, Math.PI * 2);
  g.strokeStyle = ringColor;
  g.lineWidth = 2.4;
  g.stroke();
  g.beginPath();
  g.ellipse(left, cy, capRx - 1.8, r - 3, 0, Math.PI / 2, Math.PI * 1.5);
  g.stroke();
  if (storyDevice === "oven") {
    // A bright arc sweeping round while it sends the reminder
    g.strokeStyle = "#ffffff";
    g.lineCap = "round";
    g.beginPath();
    g.ellipse(right, cy, capRx - 1.8, r - 3, 0, t * 4, t * 4 + 1.2);
    g.stroke();
  }

  // The wide screen along its front
  const sw = half * 2 - 6, sh = 14, sx = hub.x - sw / 2 - 2, sy = cy - sh / 2 + 1;
  roundRect(g, sx, sy, sw, sh, 3.5);
  g.fillStyle = emergency ? (flash ? "#d63a2e" : "#7a1f1a") : "#1f2b36";
  g.fill();
  ink(g, 1.2);
  g.save();
  roundRect(g, sx, sy, sw, sh, 3.5);
  g.clip();
  g.textAlign = "center";
  g.textBaseline = "middle";
  const mid = { x: sx + sw / 2, y: sy + sh / 2 + 0.5 };
  if (emergency) {
    g.fillStyle = "#ffffff";
    g.font = "800 6.2px Inter, sans-serif";
    g.fillText("! SMOKE ALARM !", mid.x, mid.y);
  } else if (storyDevice === "name") {
    g.fillStyle = ROOMMATE_COLOR;
    g.font = "700 8px Inter, sans-serif";
    g.fillText("“jamie!”", mid.x, mid.y);
  } else if (storyDevice === "oven") {
    g.fillStyle = "#f2b36b";
    g.font = "700 6.2px Inter, sans-serif";
    g.fillText("the oven is done", mid.x, mid.y);
  } else {
    // Listening: a little sound wave across the screen
    g.fillStyle = "rgba(255,236,200,0.85)";
    for (let k = 0; k < 14; k++) {
      const h = 2 + Math.abs(Math.sin(t * 3 + k * 0.7)) * 7;
      g.fillRect(sx + 5 + k * 3.6, mid.y - h / 2, 1.6, h);
    }
  }
  g.restore();
  g.restore();

  if (storyDevice === "name") {
    const ph = (deviceTime * 0.5) % 1;
    drawCaption(g, "“jamie!”", hub.x, top - 22 - ph * 18, 13, Math.min(1, (1 - ph) * 2));
  }
}

function drawSubsRoom(g, t) {
  // Quaint but modern, and kept simple: pale oak floor, warm white walls,
  // and a soft oatmeal rug under the sofa and the coffee table
  drawRoomShell(g, SUBS, {
    floorA: "#f1e4cf", floorB: "#ecdcc3", seam: "rgba(150,115,75,0.16)",
    wall: "#f1e8d9", wallTrim: "#faf5ec", doorway: "#f7efe0", mat: "#c9a27a",
    rugs: [() => {
      g.beginPath();
      g.ellipse(450, 360, 225, 120, 0, 0, Math.PI * 2);
      g.fillStyle = "#e6d8c0";
      g.fill();
      ink(g, 2);
      g.strokeStyle = "#c98a5f";
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(450, 360, 208, 105, 0, 0, Math.PI * 2);
      g.stroke();
    }],
  });

  // The kitchen, in the top left corner: a short run of sage cabinets under
  // a pale counter, with the oven built in. When the oven's done, its
  // display blinks, its window glows and a little heat shimmers off the top.
  const c = subsCounter;
  const ovenDone = storyDevice === "oven";
  const top = 9; // the counter top
  g.fillStyle = "rgba(60,40,20,0.14)";
  roundRect(g, c.x + 3, c.y + 5, c.w, c.h, 5);
  g.fill();
  roundRect(g, c.x, c.y, c.w, c.h, 5);
  g.fillStyle = "#a9bfa3";
  g.fill();
  ink(g, 2.2);
  roundRect(g, c.x - 2, c.y, c.w + 4, top, 3);
  g.fillStyle = "#f7f2e9";
  g.fill();
  ink(g, 1.6);
  // Cabinet doors either side of the oven, with slim brass pulls
  const ovenX = c.x + 58, ovenW = 56;
  [[c.x + 6, 46], [ovenX + ovenW + 6, c.x + c.w - 6 - (ovenX + ovenW + 6)]].forEach(([cx, cw]) => {
    roundRect(g, cx, c.y + top + 4, cw, c.h - top - 9, 3);
    g.strokeStyle = "rgba(62,50,38,0.35)";
    g.lineWidth = 1.2;
    g.stroke();
    g.fillStyle = "#c9a45a";
    roundRect(g, cx + cw / 2 - 6, c.y + top + 9, 12, 2.5, 1);
    g.fill();
  });
  // The oven
  roundRect(g, ovenX, c.y + top + 3, ovenW, c.h - top - 7, 3);
  g.fillStyle = "#3a3632";
  g.fill();
  ink(g, 1.6);
  g.fillStyle = "#c9a45a";
  roundRect(g, ovenX + 8, c.y + top + 7, ovenW - 16, 2.5, 1); // handle
  g.fill();
  roundRect(g, ovenX + 7, c.y + top + 14, ovenW - 14, c.h - top - 25, 3); // window
  g.fillStyle = ovenDone ? "#f2a55a" : "#5a524a";
  g.fill();
  roundRect(g, ovenX + ovenW / 2 - 7, c.y + c.h - 8, 14, 4, 1.5); // display
  g.fillStyle = ovenDone && Math.sin(t * 6) > 0 ? "#ffcf7a" : "#1f1c19";
  g.fill();
  if (ovenDone) {
    softGlow(g, ovenX + ovenW / 2, c.y + c.h / 2 + 4, 40, "rgba(255,170,80,0.35)");
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.6 + i / 3) % 1;
      g.strokeStyle = `rgba(230,150,80,${0.55 * (1 - ph)})`;
      g.lineWidth = 2;
      const hx = ovenX + 12 + i * 16, hy = c.y - 4 - ph * 26;
      g.beginPath();
      g.moveTo(hx, hy + 8);
      g.quadraticCurveTo(hx + 4, hy + 4, hx, hy);
      g.quadraticCurveTo(hx - 4, hy - 4, hx, hy - 8);
      g.stroke();
    }
  }
  // A little pot of herbs on the counter
  const hx = c.x + c.w - 22;
  roundRect(g, hx - 6, c.y - 6, 12, 10, 2);
  g.fillStyle = "#c98a5f";
  g.fill();
  ink(g, 1.2);
  [[-3, -10], [0, -13], [3, -10]].forEach(([lx, ly]) => {
    g.beginPath();
    g.ellipse(hx + lx, c.y + ly, 2.6, 4, lx * 0.15, 0, Math.PI * 2);
    g.fillStyle = "#7fa36a";
    g.fill();
  });

  // The smoke alarm, which flashes along with the captioner in an emergency
  const al = subsAlarm;
  const alarmOn = storyDevice === "emergency" && Math.sin(t * 8) > 0;
  if (alarmOn) softGlow(g, al.x, al.y + 6, 40, "rgba(255,80,60,0.45)");
  g.beginPath();
  g.arc(al.x, al.y, 9, 0, Math.PI * 2);
  g.fillStyle = "#f6f3ea";
  g.fill();
  ink(g, 1.6);
  g.beginPath();
  g.arc(al.x, al.y, 2.6, 0, Math.PI * 2);
  g.fillStyle = alarmOn ? "#ff4d3d" : "#b9a58c";
  g.fill();

  // The TV on the back wall: a calm picture, unless the captioner has
  // something to say
  const sc = subsScreen;
  softGlow(g, sc.x + sc.w / 2, sc.y + sc.h, 280, "rgba(255,220,160,0.25)");
  roundRect(g, sc.x, sc.y, sc.w, sc.h, 6);
  g.fillStyle = "#2b2724";
  g.fill();
  ink(g, 2.2);
  drawScreenFeed(g, sc.x + 5, sc.y + 5, sc.w - 10, sc.h - 10, 1, t, (x, y, w, h) => {
    g.fillStyle = "rgba(246,178,110,0.55)";
    g.beginPath();
    g.arc(x + w - 82, y + 36, 18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(143,193,227,0.35)";
    g.beginPath();
    g.moveTo(x, y + 84);
    g.quadraticCurveTo(x + 132, y + 42, x + 252, y + 78);
    g.quadraticCurveTo(x + 332, y + 54, x + w, y + 76);
    g.lineTo(x + w, y + h);
    g.lineTo(x, y + h);
    g.closePath();
    g.fill();
  });

  // Jamie's desk, with the monitor on it and a chair pulled up
  const d = subsDesk;
  g.fillStyle = "rgba(60,40,20,0.18)";
  roundRect(g, d.x + 3, d.y + 6, d.w, d.h, 6);
  g.fill();
  roundRect(g, d.x, d.y, d.w, d.h, 6);
  g.fillStyle = "#d9bb8f";
  g.fill();
  ink(g, 2.2);
  roundRect(g, d.x + 26, d.y + 38, 56, 12, 3); // keyboard
  g.fillStyle = "#f4ead8";
  g.fill();
  ink(g, 1.2);
  g.beginPath();
  g.arc(d.x + 140, d.y + 42, 8, 0, Math.PI * 2); // a mug
  g.fillStyle = "#f7f2e9";
  g.fill();
  ink(g, 1.2);
  const m = subsMonitor;
  roundRect(g, m.x + m.w / 2 - 12, m.y + m.h - 2, 24, 10, 2); // stand
  g.fillStyle = "#4a4038";
  g.fill();
  ink(g, 1.2);
  roundRect(g, m.x, m.y, m.w, m.h, 6);
  g.fillStyle = "#3e3226";
  g.fill();
  ink(g, 2.2);
  drawScreenFeed(g, m.x + 5, m.y + 5, m.w - 10, m.h - 10, 0.58, t, (x, y, w) => {
    // A document Jamie was working on
    g.fillStyle = "rgba(246,239,226,0.85)";
    roundRect(g, x + 14, y + 6, w - 28, 54, 3);
    g.fill();
    g.fillStyle = "rgba(62,50,38,0.35)";
    [0, 1, 2, 3].forEach((k) => g.fillRect(x + 22, y + 14 + k * 10, (w - 44) * [1, 0.8, 0.9, 0.5][k], 3));
  });
  const ch = subsDeskChair;
  g.beginPath();
  g.arc(ch.x, ch.y, ch.r, 0, Math.PI * 2);
  g.fillStyle = "#a9bfa3";
  g.fill();
  ink(g, 2);
  roundRect(g, ch.x - 14, ch.y + 8, 28, 8, 3);
  g.fillStyle = "#8ea889";
  g.fill();
  ink(g, 1.4);

  // Sofa facing the TV
  g.fillStyle = "rgba(60,40,20,0.18)";
  roundRect(g, subsSofa.x + 3, subsSofa.y + 6, subsSofa.w, subsSofa.h, 14);
  g.fill();
  roundRect(g, subsSofa.x, subsSofa.y, subsSofa.w, subsSofa.h, 14);
  g.fillStyle = "#d8c7ad";
  g.fill();
  ink(g, 2.2);
  for (let i = 0; i < 2; i++) {
    roundRect(g, subsSofa.x + 12 + i * 110, subsSofa.y + 8, 106, 26, 9);
    g.fillStyle = "#e8dcc8";
    g.fill();
    ink(g, 1.4);
  }
  [subsSofa.x + 26, subsSofa.x + subsSofa.w - 26].forEach((px) => {
    roundRect(g, px - 10, subsSofa.y + 6, 20, 16, 5);
    g.fillStyle = "#c98a5f";
    g.fill();
    ink(g, 1.3);
  });

  drawCaptioner(g, t);

  subsPlants.forEach((p) => drawPottedPlant(g, p));
}

function renderSubs(now) {
  const t = now / 1000;
  const g = subsCtx;
  const { scale: s, ox, oy } = subsView;

  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, subsCanvas.width, subsCanvas.height);
  g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);

  g.save();
  g.shadowColor = "rgba(62,50,38,0.22)";
  g.shadowBlur = 40;
  g.fillStyle = "#f1e8d9";
  g.fillRect(0, 0, SUBS.w, SUBS.h);
  g.restore();

  drawSubsRoom(g, t);
  [jamie, anna]
    .sort((a, b) => a.y - b.y)
    .forEach((ch) => drawCharacter(g, ch, ch.x, ch.y, 1.4, animPhase, !!ch.moving));
}

/* ---------------------------------------------------------------------- */
/* Cafe scene: inside Cafe Lumen, in the evening                          */
/* ---------------------------------------------------------------------- */

// Room layout, in the cafe's own coordinate space. The front door is a gap
// in the bottom wall; walking out through it returns you to the city.
const CAFE = { w: 900, h: 640, wall: 26, doorX: 450, doorW: 76 };
const CAFE_BOUNDS = { width: CAFE.w, height: CAFE.h };
const CAFE_MOVE_SPEED = 150;

const cafeCounter = { x: 56, y: 26, w: 320, h: 78 };
const cafeStools = [110, 180, 250, 320].map((x) => ({ x, y: 128 }));

// The friends' table in the top right corner, and three smaller tables to
// hang out at, spread well apart with the middle of the room left open.
// Every table has a 360° caption screen at its centre, and is round, so
// everyone can see everyone else's face, and every one sits in a high-backed
// booth that blocks noise from behind.
const cafeFriendsTable = { x: 730, y: 220, r: 52 };
const cafeRoundTables = [{ x: 500, y: 200, r: 40 }, { x: 560, y: 470, r: 40 }, { x: 760, y: 480, r: 40 }];
const cafeBoothTables = [cafeFriendsTable, ...cafeRoundTables];

// The table nearest the door, where Anna and Jamie can sit down and chat:
// Anna on the chair, Jamie across from her on the booth.
const cafeChatTable = cafeRoundTables[1];
const CAFE_ANNA_SEAT = { x: cafeChatTable.x - 58, y: cafeChatTable.y, facing: "right" };
const CAFE_JAMIE_SEAT = { x: cafeChatTable.x + 72, y: cafeChatTable.y - 18, facing: "left" };
const CAFE_SIT_REACH = 80;
const CAFE_CHAT_TURN = 2.2; // seconds each of them talks before the other jumps in
const CAFE_FRIENDS_CAPTION_SECONDS = 10; // how long the friends' captions show after you walk in
const CAFE_BOOTH_GAP = 46; // from a table's centre to the inside of its booth, past its edge

// The reading corner: a rug, a tall bookshelf on the wall and floor cushions.
const cafeReadingRug = { x: 150, y: 470, r: 112 };
const cafeBookshelf = { x: 30, y: 340, w: 30, h: 200 };
const cafePlants = [{ x: 62, y: 595 }, { x: 838, y: 595 }, { x: 640, y: 62 }];

// Felt and wood-slat panels on the walls, so voices are soaked up instead of
// bouncing around the room.
const cafeSoundPanels = [
  { x: 26, y: 150, w: 16, h: 170 },
  { x: 858, y: 140, w: 16, h: 120 },
  { x: 858, y: 300, w: 16, h: 120 },
  { x: 858, y: 440, w: 16, h: 110 },
  { x: 110, y: 598, w: 250, h: 16 },
  { x: 540, y: 598, w: 250, h: 16 },
];

// Chairs: `back` is the side the backrest sits on (away from the table).
// Every table has its booth on one side and chairs on the other.
const cafeChairs = [
  { x: 685, y: 166, back: "up" },
  { x: 685, y: 274, back: "down" },
  ...cafeRoundTables.map((t) => ({ x: t.x - 58, y: t.y, back: "left" })),
];

// Four friends hanging out, their conversation captioned on the table's screen.
const cafeFriends = [
  {
    name: "Maya", color: "#f2b36b", x: 685, y: 166, facing: "down",
    palette: { skin: "#d9a27a", hair: "#2b2320", hairStyle: "medium", outfit: "#6b5b8c", outfitTrim: "#e9e1f2" },
  },
  {
    name: "Theo", color: "#8fd3c7", x: 781, y: 159, facing: "down",
    palette: { skin: "#f2d0b0", hair: "#b5793f", hairStyle: "short", outfit: "#c9a24a", outfitTrim: "#f5ecd6" },
  },
  {
    name: "Priya", color: "#f0a3c4", x: 781, y: 281, facing: "up",
    palette: { skin: "#8d5a3b", hair: "#1d1713", hairStyle: "medium", outfit: "#4f7a78", outfitTrim: "#e1efe9" },
  },
  {
    name: "Sam", color: "#b7a6f0", x: 685, y: 274, facing: "up",
    palette: { skin: "#c98a55", hair: "#3a2419", hairStyle: "short", outfit: "#a6523f", outfitTrim: "#f7dfd2" },
  },
];

// What they're talking about: [which friend, what they said].
const cafeConversation = [
  [0, "wait, you went to the tide pools this morning?"],
  [1, "yeah! there was an octopus hiding under a rock"],
  [2, "no way. did you get a picture?"],
  [3, "he was too busy screaming, honestly"],
  [1, "it waved at me, okay? i panicked"],
  [0, "ok, we're all going back next weekend"],
];
const CAFE_LINE_SECONDS = 3.4;

// Readers on floor cushions in the reading corner.
const cafeReaders = [
  {
    x: 104, y: 420, facing: "right", book: "#a6523f",
    palette: { skin: "#f0c9a4", hair: "#a8a29a", hairStyle: "medium", outfit: "#5f7f86", outfitTrim: "#e1efe9" },
  },
  {
    x: 196, y: 470, facing: "down", book: "#5f7f86",
    palette: { skin: "#b97a56", hair: "#241c15", hairStyle: "short", outfit: "#c98f5a", outfitTrim: "#fbe9d6" },
  },
  {
    x: 118, y: 540, facing: "right", book: "#d9b56b",
    palette: { skin: "#e8b98a", hair: "#7a4a2a", hairStyle: "medium", outfit: "#8a6aa0", outfitTrim: "#efe6f6" },
  },
];

// Most of the regulars wear hearing aids, in all sorts of colours. One entry
// per person (friends, then readers): [colour, a pair?], or null for none.
const CAFE_HEARING_AIDS = [
  ["#e8889a", true], ["#5fc7b8", false], ["#f2cf5b", true], null,
  ["#c9ccd1", true], null, ["#b7a6f0", false],
];
[...cafeFriends, ...cafeReaders].forEach((p, i) => {
  p.palette.ears = true;
  const aid = CAFE_HEARING_AIDS[i];
  if (aid) [p.hearingAid, p.hearingAidPair] = aid;
});

// Hanging paper lanterns (and table candles): the room's only light.
const cafeLanterns = [
  { x: 640, y: 215, r: 200 },
  { x: 450, y: 145, r: 150 },
  { x: 520, y: 548, r: 150 },
  { x: 216, y: 170, r: 180 },
  { x: 710, y: 425, r: 150 },
  { x: 150, y: 470, r: 190 },
  { x: 400, y: 360, r: 150 },
];
const cafeCandles = cafeRoundTables.map((t) => ({ x: t.x + 18, y: t.y + 14, r: 70 }));

const cafeObstacles = [
  { x: 0, y: 0, w: CAFE.w, h: CAFE.wall },
  { x: 0, y: 0, w: CAFE.wall, h: CAFE.h },
  { x: CAFE.w - CAFE.wall, y: 0, w: CAFE.wall, h: CAFE.h },
  { x: 0, y: CAFE.h - CAFE.wall, w: CAFE.doorX - CAFE.doorW / 2, h: CAFE.wall },
  {
    x: CAFE.doorX + CAFE.doorW / 2, y: CAFE.h - CAFE.wall,
    w: CAFE.w - (CAFE.doorX + CAFE.doorW / 2), h: CAFE.wall,
  },
  cafeCounter, cafeBookshelf, ...cafeSoundPanels,
  circleBox(cafeFriendsTable),
  ...cafeRoundTables.map((t) => circleBox(t)),
  ...cafeBoothTables.map((t) => ({ x: t.x, y: t.y - t.r - CAFE_BOOTH_GAP, w: t.r + CAFE_BOOTH_GAP, h: (t.r + CAFE_BOOTH_GAP) * 2 })),
  ...[...cafeFriends, ...cafeReaders].map((p) => ({ x: p.x - 13, y: p.y - 10, w: 26, h: 26 })),
  ...cafePlants.map((p) => circleBox(p, 15)),
];

const cafeCanvas = document.getElementById("cafeCanvas");
const cafeCtx = cafeCanvas.getContext("2d");
// Offscreen layer for the evening darkness, with holes cut out by each light.
const cafeLight = document.createElement("canvas");
const cafeLightCtx = cafeLight.getContext("2d");
const cafeView = { scale: 1, ox: 0, oy: 0 };

function resizeCafeCanvas() {
  [cafeCanvas, cafeLight].forEach((c) => {
    c.width = Math.round(viewW * dpr);
    c.height = Math.round(viewH * dpr);
  });
  // Fit the room between the header and the cards along the bottom.
  const top = 76, bottom = 64;
  const s = Math.min((viewW - 32) / CAFE.w, (viewH - top - bottom) / CAFE.h, 1.3);
  cafeView.scale = s;
  cafeView.ox = (viewW - CAFE.w * s) / 2;
  cafeView.oy = top + (viewH - top - bottom - CAFE.h * s) / 2;
}
window.addEventListener("resize", resizeCafeCanvas);
resizeCafeCanvas();

// Seconds since Anna walked in, whether she's sitting down with Jamie, and
// how long they've been chatting.
let cafeTime = 0;
let cafeSeated = false;
let cafeChatTime = 0;
const cafePromptEl = document.getElementById("cafePrompt");

function enterCafe() {
  const ch = anna;
  cafeTime = 0;
  cafeSeated = false;
  ch.x = CAFE.doorX;
  ch.y = CAFE.h - CAFE.wall - 26;
  ch.facing = "up";
  ch.moving = false;
  seedCompanion(-34, 4);
  setScene("cafe");
  cafeMusic.start();
}

function leaveCafe() {
  const ch = anna;
  const door = doorOf(cafeBuilding);
  ch.x = door.x;
  ch.y = door.y + CHAR_RADIUS + 18;
  ch.facing = "down";
  ch.moving = false;
  seedCompanion(32, 2);
  cafeMusic.stop();
  cafeSeated = false;
  cafePromptEl.hidden = true;
  setScene("world");
}

function nearChatTable() {
  return Math.hypot(anna.x - CAFE_ANNA_SEAT.x, anna.y - CAFE_ANNA_SEAT.y) < CAFE_SIT_REACH;
}

// Anna takes the chair and Jamie (if she's along) slides into the booth.
function sitDownToChat() {
  cafeSeated = true;
  cafeChatTime = 0;
  keys.clear();
  Object.assign(anna, { x: CAFE_ANNA_SEAT.x, y: CAFE_ANNA_SEAT.y, facing: CAFE_ANNA_SEAT.facing, moving: false });
  if (jamieJoined) Object.assign(jamie, { x: CAFE_JAMIE_SEAT.x, y: CAFE_JAMIE_SEAT.y, facing: CAFE_JAMIE_SEAT.facing, moving: false });
  cafePromptEl.hidden = true;
}

function standUpFromChat() {
  cafeSeated = false;
  Object.assign(anna, { x: CAFE_ANNA_SEAT.x, y: CAFE_ANNA_SEAT.y + 56, facing: "down", moving: false });
  seedCompanion(36, 0);
}

document.getElementById("cafeBack").addEventListener("click", leaveCafe);

function updateCafe(dt) {
  const ch = anna;
  cafeTime += dt;
  if (cafeSeated) {
    cafeChatTime += dt;
    return;
  }
  stepCharacter(ch, dt, CAFE_MOVE_SPEED, cafeObstacles, CAFE_BOUNDS);
  updateCompanion(dt);
  // Stepping through the doorway takes you back outside.
  if (ch.y > CAFE.h - CAFE.wall + 4) {
    leaveCafe();
    return;
  }

  // Near the table by the door: offer to sit down.
  const near = nearChatTable();
  cafePromptEl.hidden = !near;
  if (near) {
    const { scale: s, ox, oy } = cafeView;
    cafePromptEl.style.left = `${ox + cafeChatTable.x * s}px`;
    cafePromptEl.style.top = `${oy + (cafeChatTable.y - cafeChatTable.r - 30) * s}px`;
  }
}

// Rug colours: [pile, border, pattern] for the friends' table, the three
// smaller tables and the reading corner.
const CAFE_RUG_COLORS = [
  ["#8a3f35", "#6a2c26", "#c27a5c"],
  ["#3f5f5a", "#2c4642", "#7fa59a"],
  ["#9a6c30", "#74501f", "#d9b06b"],
  ["#5e3f55", "#452d3f", "#9a7090"],
  ["#4f6b52", "#3a523d", "#7f9d7a"],
];

// A thick, plush round rug: a soft shadow under its raised edge, a darker
// bound border, a patterned ring, and little tufts all round the edge.
function drawThickRug(g, x, y, r, [pile, border, pattern]) {
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.beginPath();
  g.arc(x + 3, y + 6, r + 2, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = border;
  g.fill();
  ink(g, 2.5);
  g.beginPath();
  g.arc(x, y, r - 9, 0, Math.PI * 2);
  g.fillStyle = pile;
  g.fill();
  // The pile, catching the lantern light toward the top
  const sheen = g.createRadialGradient(x - r * 0.3, y - r * 0.35, 4, x, y, r);
  sheen.addColorStop(0, "rgba(255,230,190,0.14)");
  sheen.addColorStop(1, "rgba(0,0,0,0.12)");
  g.fillStyle = sheen;
  g.fill();
  g.strokeStyle = pattern;
  g.lineWidth = 3;
  g.setLineDash([10, 6]);
  g.beginPath();
  g.arc(x, y, r - 20, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(x, y, r - 28, 0, Math.PI * 2);
  g.stroke();
  // Tufts round the edge
  g.strokeStyle = pile;
  g.lineWidth = 2;
  g.lineCap = "round";
  const tufts = Math.round(r * 0.55);
  g.beginPath();
  for (let i = 0; i < tufts; i++) {
    const a = (i / tufts) * Math.PI * 2;
    g.moveTo(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2));
    g.lineTo(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3));
  }
  g.stroke();
  g.lineCap = "butt";
}

function drawCafeRoom(g) {
  const { wall } = CAFE;

  // Dark wooden floor, rugs, and walls, in the town's outlined storybook style
  drawRoomShell(g, CAFE, {
    floorA: "#6f4c37", floorB: "#664533", seam: "rgba(20,12,8,0.5)",
    wall: "#4a352b", wallTrim: "#5e4536", doorway: "#221c2b", mat: "#9a6b3f",
    rugs: [
      // A thick rug under every table (the friends' one in deep red), and
      // one in the reading corner: they soak up sound underfoot.
      () => drawThickRug(g, cafeFriendsTable.x, cafeFriendsTable.y, 125, CAFE_RUG_COLORS[0]),
      ...cafeRoundTables.map((t, i) => () => drawThickRug(g, t.x, t.y, 94, CAFE_RUG_COLORS[i + 1])),
      () => drawThickRug(g, cafeReadingRug.x, cafeReadingRug.y, cafeReadingRug.r, CAFE_RUG_COLORS[4]),
    ],
  });

  // Windows along the back wall, showing the evening sky
  [480, 620, 760].forEach((x, i) => {
    const sky = g.createLinearGradient(0, 3, 0, wall - 3);
    sky.addColorStop(0, "#2f2b4f");
    sky.addColorStop(1, "#b86b5e");
    g.fillStyle = sky;
    g.fillRect(x, 4, 90, wall - 8);
    g.fillStyle = "rgba(255,244,214,0.8)";
    g.fillRect(x + 18 + i * 21, 7, 1.5, 1.5);
    g.fillRect(x + 61 - i * 9, 9, 1.5, 1.5);
    g.beginPath();
    g.rect(x, 4, 90, wall - 8);
    g.moveTo(x + 45, 4);
    g.lineTo(x + 45, wall - 4);
    ink(g, 2);
  });

  drawCafeCounter(g);

  // Tall bookshelf on the wall of the reading corner
  const bs = cafeBookshelf;
  roundRect(g, bs.x, bs.y, bs.w, bs.h, 4);
  g.fillStyle = "#5a3d2c";
  g.fill();
  ink(g, 2);
  const spines = ["#a6523f", "#d9b56b", "#5f7f86", "#8a6aa0", "#6f915f", "#c98f5a"];
  for (let i = 0; i < 26; i++) {
    g.fillStyle = spines[(i * 5) % spines.length];
    g.fillRect(bs.x + 5, bs.y + 6 + i * 7.4, 18 + (i % 3) * 2, 5.5);
  }

  // Sound panels: soft felt, faced with wooden slats
  cafeSoundPanels.forEach((p) => {
    roundRect(g, p.x, p.y, p.w, p.h, 4);
    g.fillStyle = "#5b6b55";
    g.fill();
    ink(g, 2);
    g.fillStyle = "#9b6b46";
    const along = p.h > p.w;
    for (let k = 6; k < (along ? p.h : p.w) - 4; k += 9) {
      if (along) g.fillRect(p.x + 3, p.y + k, p.w - 6, 4);
      else g.fillRect(p.x + k, p.y + 3, 4, p.h - 6);
    }
  });

  cafePlants.forEach((p) => drawPottedPlant(g, p));
}

// A high-backed, padded booth curving round the far side of a small table.
function drawCafeBooth(g, t) {
  const inner = t.r + CAFE_BOOTH_GAP - 22, outer = t.r + CAFE_BOOTH_GAP;
  const a0 = -Math.PI * 0.55, a1 = Math.PI * 0.55;
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.beginPath();
  g.arc(t.x + 3, t.y + 6, outer, a0, a1);
  g.arc(t.x + 3, t.y + 6, inner, a1, a0, true);
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(t.x, t.y, outer, a0, a1);
  g.arc(t.x, t.y, inner, a1, a0, true);
  g.closePath();
  g.fillStyle = "#7a4a3e";
  g.fill();
  ink(g, 2.2);
  // The tall padded back, along the outside
  g.beginPath();
  g.arc(t.x, t.y, outer - 4, a0 + 0.05, a1 - 0.05);
  g.strokeStyle = "#5a3430";
  g.lineWidth = 7;
  g.lineCap = "round";
  g.stroke();
  // Buttoned upholstery
  g.fillStyle = "rgba(255,226,190,0.35)";
  for (let a = a0 + 0.25; a < a1 - 0.1; a += 0.32) {
    g.beginPath();
    g.arc(t.x + Math.cos(a) * (inner + 7), t.y + Math.sin(a) * (inner + 7), 1.6, 0, Math.PI * 2);
    g.fill();
  }
}

function drawCafeCounter(g) {
  const c = cafeCounter;
  g.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(g, c.x + 3, c.y + 6, c.w, c.h, 8);
  g.fill();
  roundRect(g, c.x, c.y, c.w, c.h, 8);
  g.fillStyle = "#5a3d2c";
  g.fill();
  ink(g, 2.5);
  roundRect(g, c.x + 4, c.y + 4, c.w - 8, c.h - 10, 6);
  g.fillStyle = "#9b6b46";
  g.fill();
  ink(g, 1.5);

  // Espresso machine
  roundRect(g, 84, 36, 58, 38, 6);
  g.fillStyle = "#d8d0c2";
  g.fill();
  ink(g, 2);
  g.fillStyle = "#3a332b";
  roundRect(g, 92, 42, 42, 12, 3);
  g.fill();
  g.fillStyle = "#fbf7f0";
  [100, 126].forEach((x) => {
    g.beginPath();
    g.arc(x, 66, 4.5, 0, Math.PI * 2);
    g.fill();
  });

  // Glowing pastry case
  roundRect(g, 168, 36, 112, 46, 6);
  g.fillStyle = "rgba(255,236,196,0.4)";
  g.fill();
  ink(g, 2);
  g.fillStyle = "#d9a45b";
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.arc(184 + i * 20, 52, 6, 0, Math.PI * 2);
    g.arc(184 + i * 20, 68, 5, 0, Math.PI * 2);
    g.fill();
  }

  // Register
  roundRect(g, 296, 42, 34, 28, 4);
  g.fillStyle = "#2e2622";
  g.fill();
  ink(g, 1.5);

  // Stools along the counter
  cafeStools.forEach((s) => {
    g.beginPath();
    g.arc(s.x, s.y, 12, 0, Math.PI * 2);
    g.fillStyle = "#3a2820";
    g.fill();
    ink(g, 2);
    g.beginPath();
    g.arc(s.x, s.y, 8.5, 0, Math.PI * 2);
    g.fillStyle = "#b07b4c";
    g.fill();
    ink(g, 1.2);
  });
}

function drawCafeCup(g, x, y) {
  g.fillStyle = "#efe6d8";
  g.beginPath();
  g.arc(x, y, 8, 0, Math.PI * 2);
  g.fill();
  ink(g, 1.2);
  g.fillStyle = "#fbf7f0";
  g.beginPath();
  g.arc(x, y, 5.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6b4428";
  g.beginPath();
  g.arc(x, y, 3.8, 0, Math.PI * 2);
  g.fill();
}

function drawCafeChair(g, c) {
  roundRect(g, c.x - 13, c.y - 12, 26, 24, 5);
  g.fillStyle = "#8a5a3c";
  g.fill();
  ink(g, 2);
  if (c.back === "up") roundRect(g, c.x - 14, c.y - 14, 28, 7, 3);
  if (c.back === "down") roundRect(g, c.x - 14, c.y + 7, 28, 7, 3);
  if (c.back === "left") roundRect(g, c.x - 14, c.y - 14, 7, 28, 3);
  if (c.back === "right") roundRect(g, c.x + 7, c.y - 14, 7, 28, 3);
  g.fillStyle = "#5e3c28";
  g.fill();
  ink(g, 1.6);
}

// A round wooden table with the 360° caption screen at its centre: a dark
// puck ringed with a band of screen. Its glow and captions go on after the
// lighting pass (drawCafeScreens).
function drawCafeRoundTable(g, t, cups) {
  g.fillStyle = "rgba(0,0,0,0.28)";
  g.beginPath();
  g.arc(t.x + 4, t.y + 8, t.r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#a8774f";
  g.beginPath();
  g.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  g.fill();
  ink(g, 2.8);
  cups.forEach(([dx, dy]) => drawCafeCup(g, t.x + dx, t.y + dy));
  const pr = t.r > 50 ? 22 : 15;
  g.beginPath();
  g.arc(t.x, t.y - 4, pr, 0, Math.PI * 2);
  g.fillStyle = "#231c22";
  g.fill();
  ink(g, 2);
  g.beginPath();
  g.arc(t.x, t.y - 4, pr - 6, 0, Math.PI * 2);
  g.fillStyle = "#3a3038";
  g.fill();
}

function drawCafeFriendsTable(g) {
  const t = cafeFriendsTable;
  drawCafeRoundTable(g, t, [[-24, -30], [24, -30], [24, 28], [-24, 28]]);
  // A plate of pastries to share
  g.fillStyle = "#efe6d8";
  g.beginPath();
  g.arc(t.x, t.y + 36, 11, 0, Math.PI * 2);
  g.fill();
  ink(g, 1.5);
  g.fillStyle = "#d9a45b";
  [[-3, -3], [4, -1], [0, 4]].forEach(([dx, dy]) => {
    g.beginPath();
    g.arc(t.x + dx, t.y + 36 + dy, 3.8, 0, Math.PI * 2);
    g.fill();
  });
}

// A reader sitting on a floor cushion, with an open book in their hands.
function drawCafeReader(g, r, i) {
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.beginPath();
  g.ellipse(r.x + 2, r.y + 14, 26, 12, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(r.x, r.y + 10, 25, 13, 0, 0, Math.PI * 2);
  g.fillStyle = ["#c27a5c", "#d9b56b", "#7f9d7a"][i % 3];
  g.fill();
  ink(g, 2);
  g.strokeStyle = "rgba(255,255,255,0.25)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(r.x, r.y + 8, 17, 7, 0, 0, Math.PI * 2);
  g.stroke();

  drawCharacter(g, r, r.x, r.y, 1.4, animPhase * 0.4 + i * 2.1, false);

  // The open book, held in front of them
  const side = r.facing === "left" ? -1 : r.facing === "right" ? 1 : 0;
  const bx = r.x + side * 14, by = r.y - 2;
  g.save();
  g.translate(bx, by);
  g.rotate(side * 0.25);
  roundRect(g, -13, -8, 26, 16, 2);
  g.fillStyle = r.book;
  g.fill();
  ink(g, 1.6);
  g.fillStyle = "#f6efe2";
  roundRect(g, -11, -6.5, 10, 13, 1.5);
  g.fill();
  roundRect(g, 1, -6.5, 10, 13, 1.5);
  g.fill();
  g.strokeStyle = "rgba(62,50,38,0.35)";
  g.lineWidth = 0.8;
  g.beginPath();
  [-3, 0, 3].forEach((dy) => {
    g.moveTo(-9, dy);
    g.lineTo(-3, dy);
    g.moveTo(3, dy);
    g.lineTo(9, dy);
  });
  g.stroke();
  g.restore();
}

// Glowing things that should shine through the evening darkness: the
// caption screens, and the friends' captions.
function drawCafeScreens(g, t) {
  const glowDisc = (x, y, r, color) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // Idle screens on the smaller tables: a slow, sleepy shimmer
  cafeRoundTables.forEach((tb, i) => {
    const pr = 15;
    glowDisc(tb.x, tb.y - 4, 34, "rgba(143,211,255,0.18)");
    g.strokeStyle = "rgba(143,211,255,0.55)";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(tb.x, tb.y - 4, pr - 3, 0, Math.PI * 2);
    g.stroke();
    const a = t * 0.8 + i * 2;
    g.strokeStyle = "rgba(220,240,255,0.9)";
    g.beginPath();
    g.arc(tb.x, tb.y - 4, pr - 3, a, a + 0.9);
    g.stroke();
  });

  // The friends' table: the ring lights up toward whoever's talking, and
  // their words appear as a caption with their name in their colour.
  const ft = cafeFriendsTable;
  const n = Math.floor(t / CAFE_LINE_SECONDS) % cafeConversation.length;
  const into = (t % CAFE_LINE_SECONDS) / CAFE_LINE_SECONDS;
  const [who, line] = cafeConversation[n];
  const friend = cafeFriends[who];
  const angle = Math.atan2(friend.y - 20 - ft.y, friend.x - ft.x);
  glowDisc(ft.x, ft.y - 4, 60, "rgba(143,211,255,0.22)");
  g.lineCap = "round";
  g.strokeStyle = "rgba(143,211,255,0.6)";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(ft.x, ft.y - 4, 19, 0, Math.PI * 2);
  g.stroke();
  // Little lines of text running round the band, like a 360° screen
  g.strokeStyle = "rgba(230,245,255,0.55)";
  g.lineWidth = 1;
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2 + t * 0.2;
    g.beginPath();
    g.moveTo(ft.x + Math.cos(a) * 12, ft.y - 4 + Math.sin(a) * 12);
    g.lineTo(ft.x + Math.cos(a) * 15, ft.y - 4 + Math.sin(a) * 15);
    g.stroke();
  }
  g.strokeStyle = friend.color;
  g.lineWidth = 5;
  g.beginPath();
  g.arc(ft.x, ft.y - 4, 19, angle - 0.6, angle + 0.6);
  g.stroke();
  const fade = Math.min(1, into * 8, (1 - into) * 8);
  // The current speaker gets a small "talking" mark above their head
  g.save();
  g.globalAlpha = fade;
  g.strokeStyle = friend.color;
  g.lineWidth = 2;
  [0, 1].forEach((k) => {
    g.beginPath();
    g.arc(friend.x, friend.y - 50, 5 + k * 5, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  });
  g.restore();
}

// The words themselves, drawn last so no lantern hangs in front of them.
function drawCafeCaptions(g, t) {
  const ft = cafeFriendsTable;
  const n = Math.floor(t / CAFE_LINE_SECONDS) % cafeConversation.length;
  const into = (t % CAFE_LINE_SECONDS) / CAFE_LINE_SECONDS;
  const [who, line] = cafeConversation[n];
  const friend = cafeFriends[who];
  // Just below their table, kept clear of the wall, and only for the first
  // few seconds after Anna walks in.
  const showFor = Math.max(0, Math.min(1, (CAFE_FRIENDS_CAPTION_SECONDS - cafeTime) / 0.6));
  if (showFor === 0) return;
  drawSpeakerCaption(g, friend.name, friend.color, line, ft.x - 70, ft.y + ft.r + 64, Math.min(1, into * 8, (1 - into) * 8) * showFor);
}

// A caption with the speaker's name in their colour, on a dark pill.
function drawSpeakerCaption(g, name, color, text, x, y, alpha) {
  g.save();
  g.globalAlpha = alpha;
  g.font = "700 12px Inter, sans-serif";
  const nameW = g.measureText(name).width;
  g.font = "600 12px Inter, sans-serif";
  const textW = g.measureText(text).width;
  const w = nameW + textW + 30, h = 24;
  g.fillStyle = "rgba(20,14,16,0.9)";
  roundRect(g, x - w / 2, y - h / 2, w, h, 9);
  g.fill();
  g.strokeStyle = color;
  g.lineWidth = 1.5;
  g.stroke();
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.font = "700 12px Inter, sans-serif";
  g.fillStyle = color;
  g.fillText(name, x - w / 2 + 11, y + 1);
  g.font = "600 12px Inter, sans-serif";
  g.fillStyle = "#ffffff";
  g.fillText(text, x - w / 2 + 19 + nameW, y + 1);
  g.restore();
}

function lightFlicker(t, i) {
  return 1 + Math.sin(t * 2.3 + i * 1.7) * 0.03 + Math.sin(t * 6.1 + i * 2.9) * 0.02;
}

function drawCafeLantern(g, l, t, i) {
  const x = l.x + Math.sin(t * 0.7 + i * 1.3) * 1.2; // gentle sway
  const y = l.y;
  const body = g.createRadialGradient(x - 3, y - 3, 1, x, y, 14);
  body.addColorStop(0, "#fff6d8");
  body.addColorStop(0.5, "#f7c26b");
  body.addColorStop(1, "#d27a3a");
  g.fillStyle = body;
  g.beginPath();
  g.arc(x, y, 13, 0, Math.PI * 2);
  g.fill();
  ink(g, 2);
  g.strokeStyle = "rgba(140,70,30,0.45)";
  g.lineWidth = 1;
  [5, 9].forEach((rx) => {
    g.beginPath();
    g.ellipse(x, y, rx, 13, 0, 0, Math.PI * 2);
    g.stroke();
  });
  g.fillStyle = "#5a3a28";
  g.beginPath();
  g.arc(x, y, 3, 0, Math.PI * 2);
  g.fill();
}

function drawCafeCandle(g, c, t, i) {
  g.fillStyle = "#f3ead8";
  g.beginPath();
  g.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffd98a";
  g.beginPath();
  g.ellipse(c.x, c.y, 2.2, 3.2 * lightFlicker(t * 3, i), 0, 0, Math.PI * 2);
  g.fill();
}

function drawCafeLighting(t) {
  const { scale: s, ox, oy } = cafeView;
  const lights = [...cafeLanterns, ...cafeCandles];

  // Evening darkness over the whole room, with each light cutting through it.
  const lg = cafeLightCtx;
  lg.setTransform(1, 0, 0, 1, 0, 0);
  lg.clearRect(0, 0, cafeLight.width, cafeLight.height);
  lg.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
  lg.globalCompositeOperation = "source-over";
  lg.fillStyle = "rgba(14,9,24,0.62)";
  lg.fillRect(0, 0, CAFE.w, CAFE.h);
  lg.globalCompositeOperation = "destination-out";
  lights.forEach((l, i) => {
    const r = l.r * lightFlicker(t, i);
    const grad = lg.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    grad.addColorStop(0, "rgba(0,0,0,0.95)");
    grad.addColorStop(0.45, "rgba(0,0,0,0.5)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    lg.fillStyle = grad;
    lg.fillRect(l.x - r, l.y - r, r * 2, r * 2);
  });

  const g = cafeCtx;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(cafeLight, 0, 0);
  g.restore();

  // Warm amber glow added on top
  g.save();
  g.globalCompositeOperation = "lighter";
  lights.forEach((l, i) => {
    const r = l.r * 0.7 * lightFlicker(t, i + 3);
    const grad = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    grad.addColorStop(0, "rgba(255,170,80,0.16)");
    grad.addColorStop(1, "rgba(255,170,80,0)");
    g.fillStyle = grad;
    g.fillRect(l.x - r, l.y - r, r * 2, r * 2);
  });
  g.restore();
}

function renderCafe(now) {
  const t = now / 1000;
  const g = cafeCtx;
  const { scale: s, ox, oy } = cafeView;

  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, cafeCanvas.width, cafeCanvas.height);
  g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);

  // Soft shadow so the room sits on the page
  g.save();
  g.shadowColor = "rgba(0,0,0,0.5)";
  g.shadowBlur = 40;
  g.fillStyle = "#3a2a24";
  g.fillRect(0, 0, CAFE.w, CAFE.h);
  g.restore();

  drawCafeRoom(g);
  cafeChairs.forEach((c) => drawCafeChair(g, c));
  cafeBoothTables.forEach((bt) => drawCafeBooth(g, bt));

  // Tables and people, drawn back-to-front so seated friends tuck behind the table.
  const player = anna;
  const drawables = [
    { y: cafeFriendsTable.y, draw: () => drawCafeFriendsTable(g) },
    ...cafeRoundTables.map((rt) => ({ y: rt.y, draw: () => drawCafeRoundTable(g, rt, [[-20, 14]]) })),
    ...cafeFriends.map((p, i) => ({
      y: p.y,
      draw: () => drawCharacter(g, p, p.x, p.y, 1.4, animPhase + i * 1.9, false),
    })),
    ...cafeReaders.map((r, i) => ({ y: r.y, draw: () => drawCafeReader(g, r, i) })),
    // While they chat, whoever's talking bobs along a little more.
    { y: player.y, draw: () => drawCharacter(g, player, player.x, player.y, 1.4, chatPhase(player, animPhase), !!player.moving) },
    ...(jamieJoined
      ? [{ y: jamie.y, draw: () => drawCharacter(g, jamie, jamie.x, jamie.y, 1.4, chatPhase(jamie, animPhase + 0.7), !!jamie.moving) }]
      : []),
  ];
  drawables.sort((a, b) => a.y - b.y).forEach((d) => d.draw());

  drawCafeLighting(t);
  drawCafeScreens(g, t);
  drawCafeChat(g, t);
  cafeCandles.forEach((c, i) => drawCafeCandle(g, c, t, i));
  cafeLanterns.forEach((l, i) => drawCafeLantern(g, l, t, i));
  drawCafeCaptions(g, t);
}

// Who's talking at Anna and Jamie's table: they take turns, now and then
// cutting in early.
function cafeChatTalker() {
  const turn = Math.floor(cafeChatTime / CAFE_CHAT_TURN);
  return (turn + (turn % 3 === 2 ? 1 : 0)) % 2 ? jamie : anna;
}

function chatPhase(ch, phase) {
  if (!cafeSeated) return phase;
  return cafeChatTalker() === ch ? phase * 2.6 : phase * 1.3;
}

// Anna and Jamie having a great time: the table's screen lights toward
// whoever's talking, little "talking" marks bounce over their heads, and
// every so often they both crack up, with sparkles floating up. No words.
function drawCafeChat(g, t) {
  if (!cafeSeated || !jamieJoined) return;
  const tb = cafeChatTable;
  const talker = cafeChatTalker();
  const color = talker === anna ? HEARING_AID_COLOR : jamie.hearingAid;
  const angle = Math.atan2(talker.y - 20 - tb.y, talker.x - tb.x);
  g.save();
  g.lineCap = "round";
  g.strokeStyle = color;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(tb.x, tb.y - 4, 12, angle - 0.7, angle + 0.7);
  g.stroke();

  const into = (cafeChatTime % CAFE_CHAT_TURN) / CAFE_CHAT_TURN;
  g.globalAlpha = Math.min(1, into * 8, (1 - into) * 8);
  g.lineWidth = 2;
  [0, 1].forEach((k) => {
    const pop = Math.sin(t * 9 + k) * 1.5;
    g.beginPath();
    g.arc(talker.x, talker.y - 50 - pop, 5 + k * 5, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  });
  g.restore();

  // Laughing together, every few seconds
  const laugh = cafeChatTime % 5.5;
  if (laugh > 3.6) {
    const k = (laugh - 3.6) / 1.9;
    [anna, jamie].forEach((ch, n) => {
      for (let i = 0; i < 3; i++) {
        const sx = ch.x + (i - 1) * 12 + Math.sin(t * 3 + i + n) * 3;
        const sy = ch.y - 52 - k * 30 - i * 5;
        drawSparkle(g, sx, sy, 3.2 - i * 0.6, `rgba(255,226,150,${Math.min(1, (1 - k) * 2)})`);
      }
    });
  }
}

// A little four-pointed star.
function drawSparkle(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.35 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

/* ---------------------------------------------------------------------- */
/* Cafe music: a soft, slow chord loop synthesized with Web Audio         */
/* ---------------------------------------------------------------------- */

const cafeMusic = (() => {
  const BEAT = 60 / 64;
  const BAR = BEAT * 4;
  // Fmaj7 – Em7 – Dm7 – Cmaj7, voiced low and close for a warm, unhurried loop
  const CHORDS = [
    [53, 57, 60, 64],
    [52, 55, 59, 62],
    [50, 53, 57, 60],
    [48, 52, 55, 59],
  ];
  const VOLUME = 0.55;

  let ac = null, bus = null, master = null;
  let timer = null, suspendTimer = null;
  let nextBar = 0, bar = 0, muted = false;

  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0;
    const tone = ac.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 1800;

    // A soft echo gives the room a little space.
    bus = ac.createGain();
    const delay = ac.createDelay(2);
    delay.delayTime.value = BEAT * 0.75;
    const feedback = ac.createGain();
    feedback.gain.value = 0.32;
    const wet = ac.createGain();
    wet.gain.value = 0.28;
    bus.connect(tone);
    bus.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(tone);
    tone.connect(master);
    master.connect(ac.destination);
  }

  function pad(m, t, dur, peak) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.value = freq(m);
    o.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 1.2);
    g.gain.setValueAtTime(peak, t + dur - 1.0);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.6);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.7);
  }

  function pluck(m, t, peak, decay) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = freq(m);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + decay + 0.05);
  }

  function scheduleBar(t, chord) {
    chord.forEach((n) => pad(n, t, BAR, 0.028));
    pluck(chord[0] - 12, t, 0.12, BAR * 0.6);
    pluck(chord[2] - 12, t + BEAT * 2, 0.07, BAR * 0.4);
    // A slow, gently wandering music-box line over the chord tones
    for (let i = 0; i < 8; i++) {
      if (Math.random() < (i % 2 === 0 ? 0.6 : 0.3)) {
        const n = chord[Math.floor(Math.random() * chord.length)] + 12 + (Math.random() < 0.25 ? 12 : 0);
        pluck(n, t + (i * BEAT) / 2 + Math.random() * 0.03, 0.045, 2.2);
      }
    }
  }

  function schedule() {
    while (nextBar < ac.currentTime + 1.5) {
      scheduleBar(nextBar, CHORDS[bar % CHORDS.length]);
      nextBar += BAR;
      bar++;
    }
  }

  function rampTo(value, secs) {
    const now = ac.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(value, now + secs);
  }

  return {
    // Must be called from a user gesture (key press / click) so audio can start.
    start() {
      if (!ac) init();
      clearTimeout(suspendTimer);
      ac.resume();
      if (!timer) {
        nextBar = Math.max(nextBar, ac.currentTime + 0.1);
        schedule();
        timer = setInterval(schedule, 300);
      }
      rampTo(muted ? 0 : VOLUME, 2.5);
    },
    stop() {
      if (!ac) return;
      rampTo(0, 0.8);
      clearInterval(timer);
      timer = null;
      suspendTimer = setTimeout(() => ac.suspend(), 900);
    },
    setMuted(value) {
      muted = value;
      if (ac && timer) rampTo(muted ? 0 : VOLUME, 0.4);
    },
    get muted() {
      return muted;
    },
  };
})();

const musicToggle = document.getElementById("musicToggle");
const musicLabel = document.getElementById("musicLabel");

musicToggle.addEventListener("click", () => {
  const muted = !cafeMusic.muted;
  cafeMusic.setMuted(muted);
  musicToggle.classList.toggle("muted", muted);
  musicToggle.setAttribute("aria-pressed", String(muted));
  musicToggle.setAttribute("aria-label", muted ? "Unmute music" : "Mute music");
  musicLabel.textContent = muted ? "Music muted" : "Soft music playing";
});

/* ---------------------------------------------------------------------- */
/* Quote bubbles                                                          */
/* ---------------------------------------------------------------------- */

const quoteBubbleEl = document.getElementById("quoteBubble");
let activeSpeaker = null;

// A small "..." bubble over each person's head, hinting they have something to say.
function drawSpeechHint(g, p, scale) {
  const x = p.x;
  const y = p.y - 44 * (scale / 1.4) + Math.sin(animPhase * 2 + p.x) * 1.5;
  const k = scale / 1.4;
  g.save();
  g.translate(x, y);
  g.scale(k, k);
  // Ink-outlined bubble with a little hooked tail
  roundRect(g, -14, -10, 28, 17, 8.5);
  g.fillStyle = "#ffffff";
  g.fill();
  ink(g, 1.8);
  g.beginPath();
  g.moveTo(-4, 6);
  g.quadraticCurveTo(-2, 10, -5, 14);
  g.quadraticCurveTo(2, 11, 4, 6);
  g.fill();
  ink(g, 1.8);
  g.fillRect(-3.2, 4.2, 6.6, 3); // hide the outline where the tail joins
  g.fillStyle = INK;
  [-6, 0, 6].forEach((dx) => {
    g.beginPath();
    g.arc(dx, -1, 1.8, 0, Math.PI * 2);
    g.fill();
  });
  g.restore();
}

function nearestSpeaker() {
  let best = null, bestDist = QUOTE_REACH;
  people.forEach((p) => {
    const d = Math.hypot(anna.x - p.x, anna.y - p.y);
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  });
  return best;
}

function updateQuoteBubble() {
  const speaker = nearestSpeaker();
  if (speaker !== activeSpeaker) {
    activeSpeaker = speaker;
    quoteBubbleEl.hidden = !speaker;
    if (speaker) {
      quoteBubbleEl.innerHTML = `
        ${speaker.name ? `<p class="quote-name">${speaker.name}</p>` : ""}
        <p class="quote-text">“${speaker.quote}”</p>
        <svg class="quote-tail" viewBox="0 0 30 24" aria-hidden="true">
          <path d="M3 0 Q 10 12 5 22 Q 17 14 27 0" />
        </svg>
      `;
    }
  }
  if (!speaker) return;

  // Anchor above their head, kept on screen.
  const head = speaker.y - 46 * labelScale(2, 0.55);
  const sx = (speaker.x - cameraX) * zoom;
  const sy = (head - cameraY) * zoom;
  const half = quoteBubbleEl.offsetWidth / 2;
  const left = clamp(sx, half + 12, viewW - half - 12);
  quoteBubbleEl.style.left = `${left}px`;
  // Leave room for the tail, which hangs ~22px below the bubble.
  quoteBubbleEl.style.top = `${Math.max(sy - 22, quoteBubbleEl.offsetHeight + 12)}px`;
  quoteBubbleEl.style.setProperty("--tail-x", `${clamp(sx - left + half, 20, half * 2 - 20)}px`);
}

/* ---------------------------------------------------------------------- */
/* Main loop                                                              */
/* ---------------------------------------------------------------------- */

let lastTime = performance.now();
let animPhase = 0;

function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (currentScene === "world") {
    update(dt);
    render();
  } else if (currentScene === "cafe") {
    updateCafe(dt);
    renderCafe(now);
  } else if (currentScene === "lab") {
    updateLab(dt);
    renderLab(now);
  } else if (currentScene === "subtitles") {
    updateSubs(dt);
    renderSubs(now);
  }

  requestAnimationFrame(tick);
}

function update(dt) {
  stepCharacter(anna, dt, MOVE_SPEED);
  updateCompanion(dt);
  updateCamera(dt);
  updateArea();
  evening += Math.sign(eveningTarget - evening) * Math.min(Math.abs(eveningTarget - evening), dt / EVENING_FADE_SECONDS);
}

function render() {
  ctx.clearRect(0, 0, viewW, viewH);

  updateEnterPrompt();
  updateQuoteBubble();
  minimapDotEl.style.left = `${(anna.x / WORLD.width) * 100}%`;
  minimapDotEl.style.top = `${(anna.y / WORLD.height) * 100}%`;

  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-cameraX, -cameraY);

  drawGround(ctx);
  drawDecor(ctx);
  buildings.forEach((b) => drawBuilding(ctx, b));
  streetSigns().forEach((sign) => drawStreetSign(ctx, sign));

  // In the overview Anna is drawn larger, with a ring, so she's easy to spot.
  const spot = 1 - followAmount();
  if (spot > 0) {
    ctx.save();
    ctx.globalAlpha = 0.55 * spot;
    ctx.strokeStyle = "#5f7fa3";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(anna.x, anna.y - 8, 44 + Math.sin(animPhase * 3) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const scale = 1.4 * labelScale(2, 0.55);
  [...people, anna, ...(jamieJoined ? [jamie] : [])]
    .sort((a, b) => a.y - b.y)
    .forEach((ch, i) => {
      const moving = (ch === anna || ch === jamie) && !!ch.moving;
      drawCharacter(ctx, ch, ch.x, ch.y, scale, animPhase + i * 1.3, moving);
      if (ch !== anna && ch !== jamie && ch !== activeSpeaker) drawSpeechHint(ctx, ch, scale);
    });

  drawEvening(ctx);
  ctx.restore();
}

/* ---------------------------------------------------------------------- */
/* Evening: once Anna leaves Form Studio with her cuff on, it turns to    */
/* early evening, golden light with the sun low over the sea. Once she    */
/* and Jamie leave Jamie's house, the sun sets: the town takes on a warm, */
/* dusky light, and the street lamps and doorways glow.                   */
/* ---------------------------------------------------------------------- */

const EVENING_FADE_SECONDS = 3.5;
let evening = 0; // 0 is daytime, EARLY_EVENING is golden hour, 1 is sunset
const EARLY_EVENING = 0.45;
let eveningTarget = 0;

function drawEvening(g) {
  if (evening <= 0) return;
  // How far into early evening (golden hour) and then into sunset we are.
  const early = Math.min(1, evening / EARLY_EVENING);
  const e = Math.max(0, (evening - EARLY_EVENING) / (1 - EARLY_EVENING));
  const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * e)).join(",");
  const { width: W, height: H } = WORLD;
  g.save();

  // Light over everything: soft gold in early evening, then at sunset golden
  // by the sea, deepening to lavender further inland.
  g.globalCompositeOperation = "multiply";
  const dusk = g.createLinearGradient(0, 0, 0, H);
  dusk.addColorStop(0, `rgba(${mix([255, 205, 140], [255, 150, 90])},${0.35 * early + 0.35 * e})`);
  dusk.addColorStop(0.35, `rgba(${mix([250, 200, 150], [220, 125, 125])},${0.3 * early + 0.36 * e})`);
  dusk.addColorStop(1, `rgba(${mix([235, 195, 160], [95, 85, 160])},${0.3 * early + 0.38 * e})`);
  g.fillStyle = dusk;
  g.fillRect(0, 0, W, H);

  // The sun low over the sea (pale gold, turning orange as it sets), and
  // its glow across the water
  g.globalCompositeOperation = "screen";
  const sunX = W * 0.72, sunY = -18;
  const glow = g.createRadialGradient(sunX, sunY, 10, sunX, sunY, 520);
  glow.addColorStop(0, `rgba(${mix([255, 225, 150], [255, 190, 110])},${0.5 * early + 0.25 * e})`);
  glow.addColorStop(0.4, `rgba(${mix([255, 200, 130], [255, 140, 90])},${0.18 * early + 0.12 * e})`);
  glow.addColorStop(1, "rgba(255,120,90,0)");
  g.fillStyle = glow;
  g.fillRect(sunX - 520, 0, 1040, 520);
  g.fillStyle = `rgba(${mix([255, 228, 160], [255, 170, 80])},${0.95 * early})`;
  g.beginPath();
  g.arc(sunX, sunY, 54, 0, Math.PI * 2);
  g.fill();
  // Glints of sunlight on the waves, in a path toward the shore
  for (let i = 0; i < 26; i++) {
    const gy = 30 + i * 3.4;
    const spread = 20 + i * 4.5;
    const gx = sunX + Math.sin(i * 2.7 + animPhase * 1.5) * spread;
    const len = 10 + (i % 3) * 6;
    g.fillStyle = `rgba(255,220,150,${(0.55 + 0.35 * Math.sin(animPhase * 3 + i)) * early})`;
    g.fillRect(gx - len / 2, gy, len, 1.6);
  }

  // Warm light from every doorway
  buildings.forEach((b) => {
    if (!b.door) return;
    const d = doorOf(b);
    const pool = g.createRadialGradient(d.x, d.y, 4, d.x, d.y, 70);
    pool.addColorStop(0, `rgba(255,190,110,${0.45 * e})`);
    pool.addColorStop(1, "rgba(255,190,110,0)");
    g.fillStyle = pool;
    g.fillRect(d.x - 70, d.y - 70, 140, 140);
  });

  // The street lamps, switched on: a bright lantern, a halo round it and a
  // pool of light on the cobbles below
  lamps.forEach((l, i) => {
    const flicker = 1 + Math.sin(animPhase * 5 + i * 1.7) * 0.03;
    const pool = g.createRadialGradient(l.x, l.y, 4, l.x, l.y, 80 * flicker);
    pool.addColorStop(0, `rgba(255,200,120,${0.55 * e})`);
    pool.addColorStop(1, "rgba(255,200,120,0)");
    g.fillStyle = pool;
    g.beginPath();
    g.ellipse(l.x, l.y, 80 * flicker, 44 * flicker, 0, 0, Math.PI * 2);
    g.fill();
    const halo = g.createRadialGradient(l.x, l.y - 56, 2, l.x, l.y - 56, 46 * flicker);
    halo.addColorStop(0, `rgba(255,236,180,${0.9 * e})`);
    halo.addColorStop(0.3, `rgba(255,200,120,${0.45 * e})`);
    halo.addColorStop(1, "rgba(255,190,110,0)");
    g.fillStyle = halo;
    g.fillRect(l.x - 50, l.y - 106, 100, 100);
  });
  g.globalCompositeOperation = "source-over";
  lamps.forEach((l) => {
    g.fillStyle = `rgba(255,246,214,${e})`;
    roundRect(g, l.x - 5, l.y - 62, 10, 12, 2);
    g.fill();
  });
  g.restore();
}

requestAnimationFrame(tick);
