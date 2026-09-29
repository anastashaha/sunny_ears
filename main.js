"use strict";

/* ---------------------------------------------------------------------- */
/* World setup: a 2 x 2 grid of city blocks                               */
/*                                                                        */
/*   x-axis (left -> right):  Repair  ->  Augmentation                    */
/*   y-axis (top -> bottom):  Product ->  Environment                     */
/*                                                                        */
/* The two axes are the streets that cross the map; where they meet is    */
/* the crossroads.                                                        */
/* ---------------------------------------------------------------------- */

// The map's height is fixed; its width follows the window's shape so the
// overview fills the whole page (see layoutWorld).
const WORLD = { width: 2000, height: 1500 };
const ORIGIN = { x: WORLD.width / 2, y: WORLD.height / 2 };
const STREET = 140; // width of each axis street
const EDGE = 70; // margin between the blocks and the edge of the map
const MIN_ASPECT = 1.15; // narrower than this and the buildings stop fitting in a block

// Light blues and oranges.
// Storybook palette: soft greens, warm wood and cream, all outlined in ink.
const INK = "#3e3226";
const COLORS = {
  ink: INK,
  grass: "#95c46a",
  curb: "#e8dcc6",
};

// One block per quadrant. `col` 0/1 = repair/augmentation, `row` 0/1 = product/environment.
// Building positions are relative to the block's top-left corner.
const QUADRANTS = [
  {
    id: "statusQuo",
    name: "Status Quo",
    col: 0, row: 0,
    ground: "#b7d892", accent: "#5f8a3c", fence: ["top", "left"],
    buildings: [],
  },
  {
    id: "superpower",
    name: "Superpower",
    col: 1, row: 0,
    ground: "#c4dd8c", accent: "#c0702c", fence: ["top", "right"],
    buildings: [
      {
        name: "Wearables Lab", x: 260, y: 230, w: 340, h: 190,
        wall: "#fbf1de", roof: "#d9824a", trim: "#f7e7cf", windows: 4, awning: true, windowColor: "#cfe6ee", doorColor: "#5b8fa8",
        door: true, enter: "lab", enterLabel: "enter the Wearables Lab",
      },
      {
        // Bottom-left corner of the block, facing the street toward A World Built for Me.
        name: "Subtitles for the World", x: 40, y: 450, w: 210, h: 118, anchor: "left",
        wall: "#f3ecf7", roof: "#6f95b5", trim: "#f7f1fb", windows: 2, awning: true, windowColor: "#fff1d6", doorColor: "#c9793a",
        door: true, enter: "subtitles", enterLabel: "enter Subtitles for the World",
      },
    ],
  },
  {
    id: "changingMyWorld",
    name: "Changing My World",
    col: 0, row: 1,
    ground: "#a9d18a", accent: "#7f8f2e", fence: ["bottom", "left"],
    buildings: [],
  },
  {
    id: "worldBuiltForMe",
    name: "A World Built for Me",
    col: 1, row: 1,
    ground: "#9ecf95", accent: "#3f7f6a", fence: ["bottom", "right"],
    buildings: [
      {
        name: "Cafe Lumen", x: 260, y: 230, w: 340, h: 190,
        wall: "#f6dcc0", roof: "#b85c3c", trim: "#fff4e8", windows: 4, awning: true,
        windowColor: "#ffe2b0", door: true, enter: "cafe", enterLabel: "enter Cafe Lumen",
      },
    ],
  },
];

const TOWN_SQUARE = {
  id: "townSquare",
  name: "The Crossroads",
};

QUADRANTS.forEach((q) => {
  q.axes = `${q.row ? "Environment" : "Product"} · ${q.col ? "Augmentation" : "Repair"}`;
});

// Buildings in world coordinates: simple boxes Alyssa can't walk through.
// Their `x` in QUADRANTS is laid out for an 860px-wide block, so they're
// kept centered as the block stretches, unless anchored to the block's left edge.
const buildings = QUADRANTS.flatMap((q) =>
  q.buildings.map((b) => ({
    ...b,
    quadrant: q,
    offsetX: b.anchor === "left" ? b.x : b.x - 430,
    offsetY: b.y,
  }))
);

/* ---------------------------------------------------------------------- */
/* People: residents of the map, each with a quote from our research.     */
/* They're scattered at random within their region on every visit, and    */
/* share their quote in a speech bubble when Alyssa walks up to them.     */
/*                                                                        */
/* Regions: a quadrant id, or one of the streets between two quadrants:   */
/*   "productStreet"      between Status Quo and Superpower               */
/*   "augmentationStreet" between Superpower and A World Built for Me     */
/* ---------------------------------------------------------------------- */

const people = [
  {
    name: null, // TBD
    region: "superpower",
    quote: "hearing better isn't actually hearing louder",
    palette: { skin: "#f1c9a5", hair: "#c7732f", hairStyle: "short", outfit: "#4f86b8", outfitTrim: "#e3eff8" },
  },
  {
    name: "Nathan",
    region: "statusQuo",
    quote:
      "at some point my friends started getting earplugs, it became normalized, and i ended up buying them too. the main driver for that was the social influence and not the ‘i care about my hearing’",
    palette: { skin: "#e8b98a", hair: "#3c2f22", hairStyle: "short", outfit: "#6b7f94", outfitTrim: "#dde9f4" },
  },
  {
    name: null, // TBD
    region: "productStreet",
    quote: "wearing airpods makes me feel closed to the world",
    palette: { skin: "#8d5a3b", hair: "#1d1713", hairStyle: "short", outfit: "#f2b36b", outfitTrim: "#fff4e8" },
  },
  {
    name: "Michael",
    region: "augmentationStreet",
    quote: "we don't hear sound, we hear meaning",
    palette: { skin: "#d9a27a", hair: "#2b2320", hairStyle: "short", outfit: "#23384d", outfitTrim: "#c6dbea" },
  },
  {
    name: "Laura",
    region: "productStreet",
    quote:
      "Loop made themselves so popular... it became an accessory, like jewelry... you're cool if you're wearing loops.",
    palette: { skin: "#f2d0b0", hair: "#b5793f", hairStyle: "medium", outfit: "#e07a2f", outfitTrim: "#fde2c6" },
  },
  {
    name: "Megan",
    region: "statusQuo",
    quote:
      "When your eyes go bad... you put readers on to read... whereas when your hearing goes, it has much more to do with your brain than with your ears... you have to wear them even when you're sitting at home reading a book, or else your brain doesn't get used to them.",
    palette: { skin: "#f0c9a4", hair: "#a8a29a", hairStyle: "medium", outfit: "#8fc1e3", outfitTrim: "#f4f8fb" },
  },
  {
    name: "Josephine",
    region: "superpower",
    quote:
      "If you're in your 40s, you're like, ‘I'm not 70, I'm not ready for that’. And when I was told I needed them, I was very honest. I was like, is there anything else? Can I wait?",
    palette: { skin: "#c98a55", hair: "#241c15", hairStyle: "short", outfit: "#c95f1f", outfitTrim: "#fbd7b5" },
  },
  {
    name: "Arya",
    region: "worldBuiltForMe",
    // Placeholder quote, not from research: replace before sharing.
    quote:
      "if there was a cool place to hangout on a friday night that was made to be easy on the ears, i'd go there all the time",
    palette: { skin: "#b97a56", hair: "#3a2419", hairStyle: "medium", outfit: "#3f7cb0", outfitTrim: "#e3eff8" },
  },
];
people.forEach((p) => (p.facing = "down"));

const QUOTE_REACH = 80; // how close Alyssa gets before a quote pops up
const PERSON_SPACING = 130; // minimum distance between people in the same region

// Maps a person's random (u, v) in 0..1 to a spot in their region, so they
// keep their place when the map stretches with the window.
function regionPoint(region, u, v) {
  if (region === "productStreet") {
    const top = EDGE + 200, bottom = ORIGIN.y - STREET / 2 - 40;
    return { x: ORIGIN.x + (u < 0.5 ? -50 : 50), y: top + v * (bottom - top) };
  }
  if (region === "augmentationStreet") {
    const left = ORIGIN.x + STREET / 2 + 60, right = WORLD.width - EDGE - 560;
    return { x: left + u * (right - left), y: ORIGIN.y + (v < 0.5 ? -50 : 50) };
  }
  const b = QUADRANTS.find((q) => q.id === region).block;
  return { x: b.x + 70 + u * (b.w - 140), y: b.y + 210 + v * (b.h - 260) };
}

// Collision boxes for everything on the map, rebuilt whenever it's laid out.
const worldObstacles = [];

function rebuildWorldObstacles() {
  worldObstacles.length = 0;
  worldObstacles.push(...buildings);
  signposts().forEach((sign) => worldObstacles.push({ x: sign.x - 7, y: sign.y - 6, w: 14, h: 10 }));
  people.forEach((p) => {
    if (p.u !== undefined) worldObstacles.push({ x: p.x - 12, y: p.y - 8, w: 24, h: 22 });
  });
}

function layoutWorld(aspect) {
  WORLD.width = Math.round(WORLD.height * Math.max(aspect, MIN_ASPECT));
  ORIGIN.x = WORLD.width / 2;
  ORIGIN.y = WORLD.height / 2;
  const w = ORIGIN.x - STREET / 2 - EDGE;
  const h = ORIGIN.y - STREET / 2 - EDGE;
  QUADRANTS.forEach((q) => {
    q.block = {
      x: q.col ? ORIGIN.x + STREET / 2 : EDGE,
      y: q.row ? ORIGIN.y + STREET / 2 : EDGE,
      w,
      h,
    };
  });
  buildings.forEach((b) => {
    const block = b.quadrant.block;
    b.x = (b.anchor === "left" ? block.x : block.x + block.w / 2) + b.offsetX;
    b.y = b.quadrant.block.y + b.offsetY;
  });
  people.forEach((p) => {
    if (p.u !== undefined) Object.assign(p, regionPoint(p.region, p.u, p.v));
  });
  rebuildWorldObstacles();
}
layoutWorld(window.innerWidth / window.innerHeight);

const cafeBuilding = buildings.find((b) => b.enter === "cafe");

/* ---------------------------------------------------------------------- */
/* Alyssa: the one character we follow through the map                    */
/* ---------------------------------------------------------------------- */

const statusQuo = QUADRANTS.find((q) => q.id === "statusQuo");

const alyssa = {
  name: "Alyssa",
  x: statusQuo.block.x + statusQuo.block.w / 2,
  y: statusQuo.block.y + statusQuo.block.h / 2 + 40,
  facing: "down",
  palette: {
    skin: "#e3b48f",
    hair: "#4a2f23",
    hairStyle: "medium",
    outfit: "#5f7fa3",
    outfitTrim: "#eef1f3",
  },
};

const CHAR_RADIUS = 16;
const MOVE_SPEED = 210; // px/sec

// Scatter everyone: pick random spots that stay clear of buildings (and their
// doors), of each other, and of where Alyssa starts.
function scatterPeople() {
  const placed = [];
  const clearOfBuildings = (x, y) =>
    !buildings.some((b) => x > b.x - 60 && x < b.x + b.w + 60 && y > b.y - 60 && y < b.y + b.h + 100);
  people.forEach((p) => {
    let best = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const u = Math.random(), v = Math.random();
      const pt = regionPoint(p.region, u, v);
      const ok =
        clearOfBuildings(pt.x, pt.y) &&
        Math.hypot(pt.x - alyssa.x, pt.y - alyssa.y) > 120 &&
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
/*                               -> lab (the Wearables Lab) -> render     */
/*                                  (the wearable's design rendering)     */
/* ---------------------------------------------------------------------- */

const appEl = document.getElementById("app");
const enterPromptEl = document.getElementById("enterPrompt");
let currentScene = "world";

function setScene(scene) {
  currentScene = scene;
  appEl.dataset.scene = scene;
  keys.clear();
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
  // Inside the cafe or lab Alyssa is in room coordinates; she's placed back
  // at the door on her way out, so only her position on the map is rescaled.
  if (currentScene === "world") {
    alyssa.x *= WORLD.width / oldWidth;
    const inside = buildings.find((b) => circleRectCollides(alyssa.x, alyssa.y, CHAR_RADIUS, b));
    if (inside) alyssa.y = inside.y + inside.h + CHAR_RADIUS + 20;
  }

  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  canvas.style.width = viewW + "px";
  canvas.style.height = viewH + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Zoom: the page opens on an overview of all four quadrants filling the
// window (`fitZoom`), and can zoom in to follow Alyssa up close.
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

// 0 in the full overview, 1 once zoomed in far enough to follow Alyssa.
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
  const fit = fitZoom();
  if (wantOverview) targetZoom = fit;
  targetZoom = clamp(targetZoom, fit, MAX_ZOOM);
  if (!zoomReady) {
    zoom = targetZoom;
    zoomReady = true;
  }
  const ease = 1 - Math.exp(-dt * 5);
  zoom = Math.exp(Math.log(zoom) + (Math.log(targetZoom) - Math.log(zoom)) * ease);

  // Blend between a camera that frames the whole map and one that follows Alyssa.
  const visW = viewW / zoom, visH = viewH / zoom;
  const overviewX = WORLD.width / 2 - visW / 2;
  const overviewY = WORLD.height / 2 - visH / 2;
  const followX = clamp(alyssa.x - visW / 2, 0, Math.max(0, WORLD.width - visW));
  const followY = clamp(alyssa.y - visH / 2, 0, Math.max(0, WORLD.height - visH));
  const t = followAmount();
  cameraX = overviewX + (followX - overviewX) * t;
  cameraY = overviewY + (followY - overviewY) * t;

  appEl.classList.toggle("overview", t < 0.5);
  const inOverview = wantOverview || targetZoom <= fit * 1.05;
  if (inOverview !== zoomToggleShowsOverview) {
    zoomToggleShowsOverview = inOverview;
    zoomToggleEl.textContent = inOverview ? "Zoom in on Alyssa" : "View all quadrants";
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
    else if (currentScene === "render") setScene("lab");
    return;
  }

  if (currentScene === "render") return;

  if (MOVE_KEYS.has(k)) {
    keys.add(k);
    e.preventDefault();
  }

  if (currentScene === "lab") {
    if ((k === "e" || k === "enter") && nearFitter()) {
      e.preventDefault();
      setScene("render");
    }
    return;
  }
  if (currentScene !== "world") return;

  if (k === "+" || k === "=") setZoom(targetZoom * 1.35);
  if (k === "-" || k === "_") setZoom(targetZoom / 1.35);

  const entrance = entranceNear(alyssa);
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

  // Head
  g.fillStyle = p.skin;
  g.beginPath();
  g.arc(0, -18, 10, 0, Math.PI * 2);
  g.fill();
  outline();

  // Hair on top: a short fringe for "medium", a close crop for "short".
  // Both stop above the face and are symmetrical.
  g.fillStyle = p.hair;
  g.beginPath();
  if (p.hairStyle === "medium") {
    g.arc(0, -19, 10.5, Math.PI * 1.08, Math.PI * 1.92);
  } else {
    g.arc(0, -20, 10.5, Math.PI * 1.0, Math.PI * 2.0);
  }
  g.closePath();
  g.fill();
  outline();

  // A simple, cute face: two dot eyes and rosy cheeks, turned the way they're
  // facing (nothing when facing away).
  const dir = ch.facing;
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

  // Name plate
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
  // One continuous cobblestone town: streets, squares and edges alike.
  g.fillStyle = cobblePattern(g);
  g.fillRect(0, 0, WORLD.width, WORLD.height);

  // The four blocks are cozy grass patches, edged with a stone curb.
  QUADRANTS.forEach((q) => {
    const b = q.block;
    g.fillStyle = "rgba(90,64,38,0.16)";
    roundRect(g, b.x + 2, b.y + 6, b.w, b.h, 26);
    g.fill();
    g.fillStyle = COLORS.curb;
    roundRect(g, b.x, b.y, b.w, b.h, 26);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.stroke();
    g.fillStyle = grassPattern(g);
    roundRect(g, b.x + 11, b.y + 11, b.w - 22, b.h - 22, 18);
    g.fill();
    g.strokeStyle = "rgba(62,50,38,0.6)";
    g.lineWidth = 1.5;
    g.stroke();

    drawBlockGarden(g, q);
  });

  buildings.forEach((b) => drawDoorPath(g, b));
}

// A pale stone path from each shop door out to the nearest street: straight
// down for the top row, and down then across for the bottom row.
function drawDoorPath(g, b) {
  if (!b.door) return;
  const block = b.quadrant.block;
  const door = doorOf(b);
  g.beginPath();
  g.moveTo(door.x, door.y);
  if (b.quadrant.row === 0) {
    g.lineTo(door.x, block.y + block.h);
  } else {
    const turnY = Math.min(door.y + 50, block.y + block.h - 40);
    const edgeX = b.quadrant.col ? block.x : block.x + block.w;
    g.lineTo(door.x, turnY - 20);
    g.quadraticCurveTo(door.x, turnY, door.x + (edgeX < door.x ? -20 : 20), turnY);
    g.lineTo(edgeX, turnY);
  }
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 38;
  g.stroke();
  g.strokeStyle = "#ecdfc7";
  g.lineWidth = 34;
  g.stroke();
  g.strokeStyle = "rgba(160,130,95,0.35)";
  g.lineWidth = 1.2;
  g.setLineDash([3, 9]);
  g.stroke();
  g.setLineDash([]);
}

// Fences along the town's outer edges, and flowers and bushes in the corners,
// kept to the edges so the middle of each patch stays clear.
function drawBlockGarden(g, q) {
  const b = q.block;
  const inset = 26;
  const left = b.x + inset, right = b.x + b.w - inset;
  const top = b.y + inset, bottom = b.y + b.h - inset;

  q.fence.forEach((side) => {
    if (side === "top") drawFence(g, left + 30, top, right - 30, top);
    if (side === "bottom") drawFence(g, left + 30, bottom, right - 30, bottom);
    if (side === "left") drawFence(g, left, top + 30, left, bottom - 30);
    if (side === "right") drawFence(g, right, top + 30, right, bottom - 30);
  });

  // Flower bed in the outer corner, bushes in the other two away from the plaque
  const outerX = q.fence.includes("left") ? left + 70 : right - 70;
  const innerX = q.fence.includes("left") ? right - 60 : left + 60;
  const outerY = q.fence.includes("top") ? top + 150 : bottom - 60;
  const otherY = q.fence.includes("top") ? bottom - 50 : top + 150;
  drawFlowerBed(g, outerX, outerY, q.id.length);
  drawBush(g, outerX, otherY, q.id.length + 1);
  drawBush(g, innerX, outerY, q.id.length + 2);
}

function drawFence(g, x1, y1, x2, y2) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const posts = Math.max(2, Math.round(len / 34));
  const horizontal = y1 === y2;
  g.lineCap = "round";
  // Two rails
  [[-8, "#b07b4c"], [-2, "#b07b4c"]].forEach(([off, color]) => {
    g.strokeStyle = INK;
    g.lineWidth = 5.5;
    g.beginPath();
    if (horizontal) {
      g.moveTo(x1, y1 + off);
      g.lineTo(x2, y2 + off);
    } else {
      g.moveTo(x1 + off / 2, y1);
      g.lineTo(x2 + off / 2, y2);
    }
    g.stroke();
    g.strokeStyle = color;
    g.lineWidth = 3;
    g.stroke();
  });
  // Posts
  for (let i = 0; i <= posts; i++) {
    const x = x1 + ((x2 - x1) * i) / posts;
    const y = y1 + ((y2 - y1) * i) / posts;
    g.fillStyle = "rgba(60,40,20,0.2)";
    g.beginPath();
    g.ellipse(x + 1, y + 4, 5, 2, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c08a58";
    roundRect(g, x - 3.5, y - 16, 7, 19, 2);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    g.stroke();
  }
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

// The axis names, on wooden signposts standing at each end of the two streets.
// REPAIR and AUGMENTATION point along the street; PRODUCT and ENVIRONMENT
// carry a carved arrow.
function signposts() {
  return [
    { text: "REPAIR", x: 175, y: ORIGIN.y + 28, point: -1 },
    { text: "AUGMENTATION", x: WORLD.width - 240, y: ORIGIN.y + 28, point: 1 },
    { text: "\u2191  PRODUCT", x: ORIGIN.x, y: 150, point: 0 },
    { text: "\u2193  ENVIRONMENT", x: ORIGIN.x, y: WORLD.height - 80, point: 0 },
  ];
}

function drawSignpost(g, sign) {
  const k = labelScale();
  g.save();
  g.translate(sign.x, sign.y);
  g.scale(k, k);

  g.font = "700 20px Inter, sans-serif";
  g.letterSpacing = "4px";
  const w = g.measureText(sign.text).width + 34;
  const h = 40;
  const top = -30 - h; // the board sits on top of a short post
  const tip = 18; // how far the pointed end sticks out

  // Shadow on the cobbles, and the post
  g.fillStyle = "rgba(60,40,20,0.22)";
  g.beginPath();
  g.ellipse(0, 2, 16, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6e4526";
  roundRect(g, -5, top + h - 4, 10, 36, 3);
  g.fill();

  // The board: arrow-shaped when it points along its street
  const board = () => {
    g.beginPath();
    const left = -w / 2, right = w / 2;
    if (sign.point < 0) {
      g.moveTo(left, top + h / 2);
      g.lineTo(left + tip, top);
      g.lineTo(right, top);
      g.lineTo(right, top + h);
      g.lineTo(left + tip, top + h);
    } else if (sign.point > 0) {
      g.moveTo(left, top);
      g.lineTo(right - tip, top);
      g.lineTo(right, top + h / 2);
      g.lineTo(right - tip, top + h);
      g.lineTo(left, top + h);
    } else {
      roundRect(g, left, top, w, h, 5);
      return;
    }
    g.closePath();
  };
  g.save();
  g.translate(2, 4);
  board();
  g.fillStyle = "rgba(60,40,20,0.25)";
  g.fill();
  g.restore();
  board();
  const wood = g.createLinearGradient(0, top, 0, top + h);
  wood.addColorStop(0, "#c89462");
  wood.addColorStop(1, "#ad774a");
  g.fillStyle = wood;
  g.fill();
  g.strokeStyle = "#7d5230";
  g.lineWidth = 2.5;
  g.lineJoin = "round";
  g.stroke();

  // Plank seam and wood grain
  g.save();
  board();
  g.clip();
  g.strokeStyle = "rgba(110,69,38,0.35)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-w / 2, top + h / 2);
  g.lineTo(w / 2, top + h / 2);
  g.stroke();
  g.strokeStyle = "rgba(255,236,210,0.18)";
  g.lineWidth = 1;
  g.beginPath();
  [0.22, 0.72].forEach((f) => {
    g.moveTo(-w / 2, top + h * f);
    g.bezierCurveTo(-w / 6, top + h * f - 3, w / 6, top + h * f + 3, w / 2, top + h * f);
  });
  g.stroke();
  g.restore();

  // Nails
  g.fillStyle = "#5a3a1e";
  [-1, 1].forEach((side) => {
    g.beginPath();
    g.arc(side * (w / 2 - (sign.point * side > 0 ? tip + 4 : 8)), top + 8, 1.8, 0, Math.PI * 2);
    g.fill();
  });

  // Carved lettering
  g.textAlign = "center";
  g.textBaseline = "middle";
  const cx = sign.point * (-tip / 4);
  g.fillStyle = "rgba(255,236,210,0.35)";
  g.fillText(sign.text, cx + 2, top + h / 2 + 2);
  g.fillStyle = "#4a2d17";
  g.fillText(sign.text, cx + 2, top + h / 2 + 1);
  g.restore();
}

// Each block's name, set into the ground like a plaza plaque.
function drawBlockTitle(g, q) {
  const w = 380, h = 84;
  g.save();
  g.translate(q.block.x + q.block.w / 2, q.block.y + 34);
  g.scale(labelScale(), labelScale());
  const cx = 0, top = 0;
  g.fillStyle = "rgba(60,40,20,0.18)";
  roundRect(g, cx - w / 2 + 3, top + 6, w, h, 14);
  g.fill();
  g.fillStyle = "#fdf7ea";
  roundRect(g, cx - w / 2, top, w, h, 14);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();
  g.strokeStyle = q.accent;
  g.lineWidth = 1.5;
  roundRect(g, cx - w / 2 + 6, top + 6, w - 12, h - 12, 10);
  g.stroke();

  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillStyle = q.accent;
  g.font = "600 11px Inter, sans-serif";
  g.letterSpacing = "3px";
  g.fillText(q.axes.toUpperCase(), cx, top + 28);
  g.letterSpacing = "0px";
  g.fillStyle = COLORS.ink;
  g.font = "600 32px 'Cormorant Garamond', Georgia, serif";
  g.fillText(q.name, cx, top + 64);
  g.restore();
}

/* ---------------------------------------------------------------------- */
/* Where is Alyssa? Areas, entrances, and the HUD                         */
/* ---------------------------------------------------------------------- */

function areaAt(x, y) {
  if (Math.abs(x - ORIGIN.x) < STREET / 2 && Math.abs(y - ORIGIN.y) < STREET / 2) return TOWN_SQUARE;
  return QUADRANTS.find((q) => (x >= ORIGIN.x) === !!q.col && (y >= ORIGIN.y) === !!q.row);
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

function buildingAtScreenPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const wx = (clientX - rect.left) / zoom + cameraX;
  const wy = (clientY - rect.top) / zoom + cameraY;
  return buildings.find(
    (b) => b.enter && wx >= b.x && wx <= b.x + b.w && wy >= b.y - 22 && wy <= b.y + b.h
  );
}

canvas.addEventListener("click", (e) => {
  if (currentScene !== "world") return;
  const b = buildingAtScreenPoint(e.clientX, e.clientY);
  if (b) enterBuilding(b);
});

canvas.addEventListener("mousemove", (e) => {
  if (currentScene !== "world") return;
  canvas.style.cursor = buildingAtScreenPoint(e.clientX, e.clientY) ? "pointer" : "default";
});

const areaBannerEl = document.getElementById("areaBanner");
const minimapGridEl = document.getElementById("minimapGrid");
const minimapDotEl = document.getElementById("minimapDot");

// Minimap cells, in reading order: product row first, repair column first.
[...QUADRANTS]
  .sort((a, b) => a.row - b.row || a.col - b.col)
  .forEach((q) => {
    const cell = document.createElement("div");
    cell.className = "minimap-cell";
    cell.dataset.area = q.id;
    cell.style.setProperty("--cell", q.ground);
    cell.style.setProperty("--cell-accent", q.accent);
    cell.textContent = q.name;
    minimapGridEl.insertBefore(cell, minimapDotEl);
  });

let currentArea = null;
let bannerTimer = null;

function updateArea() {
  const area = areaAt(alyssa.x, alyssa.y);
  if (area === currentArea) return;
  currentArea = area;

  [...minimapGridEl.querySelectorAll(".minimap-cell")].forEach((cell) => {
    cell.classList.toggle("active", cell.dataset.area === area.id);
  });

  // Announce each new block as Alyssa walks into it (not needed in the overview,
  // where every block is already on screen).
  if (area === TOWN_SQUARE || followAmount() < 0.5) return;
  areaBannerEl.innerHTML = `
    <p class="area-banner-kicker">${area.axes}</p>
    <p class="area-banner-name">${area.name}</p>
  `;
  areaBannerEl.style.setProperty("--area-accent", area.accent);
  areaBannerEl.classList.add("show");
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => areaBannerEl.classList.remove("show"), 2400);
}

let shownEntrance = null;

function updateEnterPrompt() {
  const entrance = entranceNear(alyssa);
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
/* Lab scene: inside the Wearables Lab, a calm spa-like showroom of       */
/* wearable ear gadgets. A fitter in the middle helps Alyssa try hers on. */
/* ---------------------------------------------------------------------- */

const LAB = { w: 900, h: 640, wall: 26, doorX: 450, doorW: 76 };
const LAB_BOUNDS = { width: LAB.w, height: LAB.h };
const LAB_MOVE_SPEED = 150;

// The fitting platform in the middle of the room, with the fitter on it.
const labPlatform = { x: 450, y: 300, r: 112 };
const labFitter = {
  x: 450, y: 282, facing: "down",
  palette: { skin: "#b97a56", hair: "#2a211c", hairStyle: "medium", outfit: "#9cc3e0", outfitTrim: "#e07a2f" },
};
const labTray = { x: 512, y: 300, r: 17 }; // the wearable waiting to be tried on
const labMirror = { x: 385, y: 164, w: 130, h: 14 };
const FITTER_REACH = 86;

// Gadgets on display: pedestals along the side walls and a backlit shelf along the top.
const GADGET_COLORS = ["#e07a2f", "#4f86b8", "#f2b36b", "#8fc1e3", "#c95f1f", "#23384d"];
const labPedestals = [180, 320, 460].flatMap((y, i) => [
  { x: 92, y, color: GADGET_COLORS[i] },
  { x: 808, y, color: GADGET_COLORS[i + 3] },
]);
const labShelf = { x: 250, y: 34, w: 400, h: 44 };
const labBasin = { x: 170, y: 548, r: 50 };
const labLoungers = [
  { x: 650, y: 510, w: 44, h: 86 },
  { x: 720, y: 510, w: 44, h: 86 },
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
  labShelf, labMirror, ...labLoungers,
  { x: labFitter.x - 16, y: labFitter.y - 20, w: 32, h: 36 },
  circleBox(labTray),
  circleBox(labBasin),
  ...labPedestals.map((p) => ({ x: p.x - 28, y: p.y - 28, w: 56, h: 56 })),
  ...labPlants.map((p) => circleBox(p, 15)),
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
  alyssa.x = LAB.doorX;
  alyssa.y = LAB.h - LAB.wall - 26;
  alyssa.facing = "up";
  alyssa.moving = false;
  setScene("lab");
}

function leaveLab() {
  const door = doorOf(labBuilding);
  alyssa.x = door.x;
  alyssa.y = door.y + CHAR_RADIUS + 18;
  alyssa.facing = "down";
  alyssa.moving = false;
  labPromptEl.hidden = true;
  setScene("world");
}

function nearFitter() {
  return Math.hypot(alyssa.x - labFitter.x, alyssa.y - labFitter.y) < FITTER_REACH;
}

document.getElementById("labBack").addEventListener("click", leaveLab);
document.getElementById("renderBack").addEventListener("click", () => setScene("lab"));

function updateLab(dt) {
  stepCharacter(alyssa, dt, LAB_MOVE_SPEED, labObstacles, LAB_BOUNDS);
  if (alyssa.y > LAB.h - LAB.wall + 4) {
    leaveLab();
    return;
  }

  // "Try on your new superpower", floating above the fitter when Alyssa is close.
  const near = nearFitter();
  labPromptEl.hidden = !near;
  if (near) {
    const { scale: s, ox, oy } = labView;
    labPromptEl.style.left = `${ox + labFitter.x * s}px`;
    labPromptEl.style.top = `${oy + (labFitter.y - 58) * s}px`;
  }
}

// A behind-the-ear wearable, seen from above: a curved body with a glowing sensor.
function drawGadget(g, x, y, color, size = 1, t = 0) {
  g.save();
  g.translate(x, y);
  g.scale(size, size);
  g.strokeStyle = color;
  g.lineWidth = 5;
  g.lineCap = "round";
  g.beginPath();
  g.arc(0, 0, 9, Math.PI * 0.75, Math.PI * 2.1);
  g.stroke();
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(-6, 7, 4, 6, 0.5, 0, Math.PI * 2);
  g.fill();
  ink(g, 1.2);
  g.fillStyle = `rgba(255,170,90,${0.65 + Math.sin(t * 2.2) * 0.3})`;
  g.beginPath();
  g.arc(7, -5, 2.2, 0, Math.PI * 2);
  g.fill();
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
  const { h, wall } = LAB;

  // A calm, sunlit spa: pale oak floor, sage walls, a soft runner to the platform
  drawRoomShell(g, LAB, {
    floorA: "#f4e8d4", floorB: "#efe1ca", seam: "rgba(120,90,55,0.22)",
    wall: "#cfdcbf", wallTrim: "#e3ecd6", doorway: "#f7efe0", mat: "#e9b27d",
    rugs: [() => {
      roundRect(g, LAB.doorX - 44, labPlatform.y + labPlatform.r - 10, 88, h - wall - labPlatform.y - labPlatform.r + 10, 10);
      g.fillStyle = "#f6dcc0";
      g.fill();
      ink(g, 1.8);
    }],
  });

  // Backlit display shelf along the back wall
  softGlow(g, labShelf.x + labShelf.w / 2, labShelf.y + 30, 240, "rgba(255,220,160,0.35)");
  roundRect(g, labShelf.x, labShelf.y, labShelf.w, labShelf.h, 10);
  g.fillStyle = "#c08a58";
  g.fill();
  ink(g, 2.5);
  roundRect(g, labShelf.x + 6, labShelf.y + 6, labShelf.w - 12, labShelf.h - 12, 6);
  g.fillStyle = "#fdf7ea";
  g.fill();
  ink(g, 1.5);
  for (let i = 0; i < 6; i++) {
    drawGadget(g, labShelf.x + 40 + i * 64, labShelf.y + 22, GADGET_COLORS[i], 0.9, t + i);
  }

  // Pedestals with gadgets on display
  labPedestals.forEach((p, i) => {
    softGlow(g, p.x, p.y, 70, "rgba(255,214,150,0.35)");
    g.fillStyle = "rgba(60,40,20,0.18)";
    roundRect(g, p.x - 26, p.y - 22, 56, 56, 12);
    g.fill();
    roundRect(g, p.x - 28, p.y - 28, 56, 56, 12);
    g.fillStyle = "#c08a58";
    g.fill();
    ink(g, 2.5);
    roundRect(g, p.x - 22, p.y - 22, 44, 44, 9);
    g.fillStyle = "#fdf7ea";
    g.fill();
    ink(g, 1.5);
    drawGadget(g, p.x, p.y, p.color, 1.3, t + i * 0.7);
  });

  // Still-water basin with slow ripples
  g.beginPath();
  g.arc(labBasin.x, labBasin.y, labBasin.r + 9, 0, Math.PI * 2);
  g.fillStyle = "#e8dcc6";
  g.fill();
  ink(g, 2.5);
  const water = g.createRadialGradient(labBasin.x, labBasin.y, 4, labBasin.x, labBasin.y, labBasin.r);
  water.addColorStop(0, "#cfeaf0");
  water.addColorStop(1, "#9fd0dc");
  g.fillStyle = water;
  g.beginPath();
  g.arc(labBasin.x, labBasin.y, labBasin.r, 0, Math.PI * 2);
  g.fill();
  ink(g, 1.8);
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.35 + i / 3) % 1;
    g.strokeStyle = `rgba(255,255,255,${0.6 * (1 - phase)})`;
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(labBasin.x, labBasin.y, 6 + phase * (labBasin.r - 8), 0, Math.PI * 2);
    g.stroke();
  }

  // Loungers for waiting and relaxing
  labLoungers.forEach((l) => {
    g.fillStyle = "rgba(60,40,20,0.18)";
    roundRect(g, l.x + 3, l.y + 5, l.w, l.h, 12);
    g.fill();
    roundRect(g, l.x, l.y, l.w, l.h, 12);
    g.fillStyle = "#fdf1dd";
    g.fill();
    ink(g, 2.2);
    roundRect(g, l.x + 6, l.y + 6, l.w - 12, 22, 8);
    g.fillStyle = "#e9a36b";
    g.fill();
    ink(g, 1.5);
  });

  labPlants.forEach((p) => drawPottedPlant(g, p));

  // Mirror behind the fitting platform, in a wooden frame
  roundRect(g, labMirror.x - 5, labMirror.y - 5, labMirror.w + 10, labMirror.h + 10, 8);
  g.fillStyle = "#c08a58";
  g.fill();
  ink(g, 2);
  const glass = g.createLinearGradient(labMirror.x, 0, labMirror.x + labMirror.w, 0);
  glass.addColorStop(0, "#eaf5fc");
  glass.addColorStop(0.5, "#ffffff");
  glass.addColorStop(1, "#cfe6f5");
  g.fillStyle = glass;
  roundRect(g, labMirror.x, labMirror.y, labMirror.w, labMirror.h, 5);
  g.fill();
  ink(g, 1.2);

  // Fitting platform, gently pulsing
  const pulse = 0.5 + Math.sin(t * 1.6) * 0.5;
  softGlow(g, labPlatform.x, labPlatform.y, labPlatform.r + 60, `rgba(246,190,120,${0.18 + pulse * 0.12})`);
  const disc = g.createRadialGradient(labPlatform.x, labPlatform.y, 10, labPlatform.x, labPlatform.y, labPlatform.r);
  disc.addColorStop(0, "#fffaf0");
  disc.addColorStop(1, "#f1e4cc");
  g.fillStyle = disc;
  g.beginPath();
  g.arc(labPlatform.x, labPlatform.y, labPlatform.r, 0, Math.PI * 2);
  g.fill();
  ink(g, 3);
  g.strokeStyle = `rgba(201,121,58,${0.35 + pulse * 0.3})`;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(labPlatform.x, labPlatform.y, labPlatform.r - 16, 0, Math.PI * 2);
  g.stroke();

  // The wearable, waiting on a small tray next to the fitter
  g.fillStyle = "#fdf7ea";
  g.beginPath();
  g.arc(labTray.x, labTray.y, labTray.r, 0, Math.PI * 2);
  g.fill();
  ink(g, 2);
  softGlow(g, labTray.x, labTray.y, 34, `rgba(246,178,110,${0.25 + pulse * 0.25})`);
  drawGadget(g, labTray.x, labTray.y, "#e07a2f", 1, t);
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
  g.fillStyle = "#cfdcbf";
  g.fillRect(0, 0, LAB.w, LAB.h);
  g.restore();

  drawLabRoom(g, t);

  // Fitter and Alyssa, back-to-front
  [
    { y: labFitter.y, draw: () => drawCharacter(g, labFitter, labFitter.x, labFitter.y, 1.4, animPhase, false) },
    { y: alyssa.y, draw: () => drawCharacter(g, alyssa, alyssa.x, alyssa.y, 1.4, animPhase, !!alyssa.moving) },
  ]
    .sort((a, b) => a.y - b.y)
    .forEach((d) => d.draw());
}

/* ---------------------------------------------------------------------- */
/* Subtitles scene: "Subtitles for the World", three options for what     */
/* captions for everyday sounds could look like, set around a cozy room.  */
/* ---------------------------------------------------------------------- */

const SUBS = { w: 900, h: 640, wall: 26, doorX: 450, doorW: 76 };
const SUBS_BOUNDS = { width: SUBS.w, height: SUBS.h };
const SUBS_MOVE_SPEED = 150;
const DEVICE_REACH = 110;

// The three options. `x`/`y` is where Alyssa has to stand near to learn about it.
// Options 2 and 3 are placeholders until the real concepts are ready.
const subsDevices = [
  {
    id: "screen",
    option: "Option 1",
    name: "The big screen",
    description: "A large shared screen that captions the sounds around your home, like the door alarm.",
    caption: "The door alarm is ringing!",
    x: 450, y: 210,
  },
  {
    id: "glasses",
    option: "Option 2 · Placeholder",
    name: "Caption glasses",
    description: "Live captions float in your view, right beside whoever or whatever is making the sound.",
    caption: "“Are you coming to dinner?”",
    x: 200, y: 450,
  },
  {
    id: "band",
    option: "Option 3 · Placeholder",
    name: "Caption wristband",
    description: "A quiet buzz on your wrist and a short caption, so you never miss a sound meant for you.",
    caption: "Someone is calling your name",
    x: 700, y: 450,
  },
];

const subsScreen = { x: 240, y: 30, w: 420, h: 128 };
const subsSofa = { x: 330, y: 280, w: 240, h: 56 };
const subsFrontDoor = { x: SUBS.wall, y: 190, h: 90 }; // the door whose alarm is ringing
const subsPedestals = subsDevices
  .filter((d) => d.id !== "screen")
  .map((d) => ({ device: d, x: d.x, y: d.y, r: 34 }));
const subsPlants = [{ x: 60, y: 60 }, { x: 840, y: 60 }, { x: 60, y: 590 }, { x: 840, y: 590 }];

const subsObstacles = [
  { x: 0, y: 0, w: SUBS.w, h: SUBS.wall },
  { x: 0, y: 0, w: SUBS.wall, h: SUBS.h },
  { x: SUBS.w - SUBS.wall, y: 0, w: SUBS.wall, h: SUBS.h },
  { x: 0, y: SUBS.h - SUBS.wall, w: SUBS.doorX - SUBS.doorW / 2, h: SUBS.wall },
  {
    x: SUBS.doorX + SUBS.doorW / 2, y: SUBS.h - SUBS.wall,
    w: SUBS.w - (SUBS.doorX + SUBS.doorW / 2), h: SUBS.wall,
  },
  subsScreen, subsSofa,
  ...subsPedestals.map((p) => circleBox(p)),
  ...subsPlants.map((p) => circleBox(p, 15)),
];

const subsCanvas = document.getElementById("subsCanvas");
const subsCtx = subsCanvas.getContext("2d");
const subsCardEl = document.getElementById("subsCard");
const subsView = { scale: 1, ox: 0, oy: 0 };
const subsBuilding = buildings.find((b) => b.enter === "subtitles");
let subsActiveDevice = null;

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

function enterSubs() {
  alyssa.x = SUBS.doorX;
  alyssa.y = SUBS.h - SUBS.wall - 26;
  alyssa.facing = "up";
  alyssa.moving = false;
  setScene("subtitles");
}

function leaveSubs() {
  const door = doorOf(subsBuilding);
  alyssa.x = door.x;
  alyssa.y = door.y + CHAR_RADIUS + 18;
  alyssa.facing = "down";
  alyssa.moving = false;
  subsCardEl.hidden = true;
  subsActiveDevice = null;
  setScene("world");
}

document.getElementById("subsBack").addEventListener("click", leaveSubs);

function updateSubs(dt) {
  stepCharacter(alyssa, dt, SUBS_MOVE_SPEED, subsObstacles, SUBS_BOUNDS);
  if (alyssa.y > SUBS.h - SUBS.wall + 4) {
    leaveSubs();
    return;
  }

  // Describe whichever option Alyssa is standing near.
  let near = null, nearDist = DEVICE_REACH;
  subsDevices.forEach((d) => {
    const dist = Math.hypot(alyssa.x - d.x, alyssa.y - d.y);
    if (dist < nearDist) {
      near = d;
      nearDist = dist;
    }
  });
  if (near !== subsActiveDevice) {
    subsActiveDevice = near;
    subsCardEl.hidden = !near;
    if (near) {
      subsCardEl.innerHTML = `
        <p class="subs-card-option">${near.option}</p>
        <p class="subs-card-name">${near.name}</p>
        <p class="subs-card-desc">${near.description}</p>
      `;
    }
  }
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

function drawSubsRoom(g, t) {
  const { wall } = SUBS;
  const blink = Math.sin(t * 6) > 0; // the door alarm's light

  // A cozy living room: honey-wood floor, cream walls, a sage rug by the screen
  drawRoomShell(g, SUBS, {
    floorA: "#ecd3b0", floorB: "#e6caa4", seam: "rgba(120,80,45,0.25)",
    wall: "#efe2c8", wallTrim: "#f8efdc", doorway: "#f7efe0", mat: "#e9b27d",
    rugs: [() => {
      g.beginPath();
      g.ellipse(450, 300, 220, 110, 0, 0, Math.PI * 2);
      g.fillStyle = "#c8dcaa";
      g.fill();
      ink(g, 2);
      g.strokeStyle = "#a9c485";
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(450, 300, 200, 94, 0, 0, Math.PI * 2);
      g.stroke();
    }],
  });
  // The front door on the left wall, its alarm light blinking
  const fd = subsFrontDoor;
  g.beginPath();
  g.rect(0, fd.y, wall + 8, fd.h);
  g.fillStyle = "#b8703f";
  g.fill();
  ink(g, 2.2);
  g.beginPath();
  g.rect(wall, fd.y + 6, 8, fd.h - 12);
  g.fillStyle = "#e0a06a";
  g.fill();
  ink(g, 1.4);
  if (blink) softGlow(g, wall + 14, fd.y - 16, 46, "rgba(255,120,60,0.45)");
  g.fillStyle = blink ? "#ff7a3c" : "#b8653a";
  g.beginPath();
  g.arc(wall + 14, fd.y - 16, 7, 0, Math.PI * 2);
  g.fill();
  ink(g, 1.6);

  // Option 1: the big screen on the back wall, captioning the door alarm
  const sc = subsScreen;
  softGlow(g, sc.x + sc.w / 2, sc.y + sc.h, 280, "rgba(255,220,160,0.3)");
  roundRect(g, sc.x, sc.y, sc.w, sc.h, 10);
  g.fillStyle = "#8a5a34"; // a wooden frame around the screen
  g.fill();
  ink(g, 2.5);
  const glass = g.createLinearGradient(0, sc.y, 0, sc.y + sc.h);
  glass.addColorStop(0, "#35536f");
  glass.addColorStop(1, "#1d2e40");
  g.fillStyle = glass;
  roundRect(g, sc.x + 8, sc.y + 8, sc.w - 16, sc.h - 16, 6);
  g.fill();
  ink(g, 1.8);
  // A calm picture on screen: a sun over soft hills
  g.fillStyle = "rgba(246,178,110,0.55)";
  g.beginPath();
  g.arc(sc.x + sc.w - 90, sc.y + 44, 18, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(143,193,227,0.35)";
  g.beginPath();
  g.moveTo(sc.x + 8, sc.y + 92);
  g.quadraticCurveTo(sc.x + 140, sc.y + 50, sc.x + 260, sc.y + 86);
  g.quadraticCurveTo(sc.x + 340, sc.y + 62, sc.x + sc.w - 8, sc.y + 84);
  g.lineTo(sc.x + sc.w - 8, sc.y + sc.h - 8);
  g.lineTo(sc.x + 8, sc.y + sc.h - 8);
  g.closePath();
  g.fill();
  g.fillStyle = "#e07a2f";
  g.font = "700 11px Inter, sans-serif";
  g.letterSpacing = "2px";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("[ DOOR ALARM ]", sc.x + sc.w / 2, sc.y + 72);
  g.letterSpacing = "0px";
  drawCaption(g, subsDevices[0].caption, sc.x + sc.w / 2, sc.y + 100, 20);

  // Sofa facing the screen
  g.fillStyle = "rgba(60,40,20,0.18)";
  roundRect(g, subsSofa.x + 3, subsSofa.y + 6, subsSofa.w, subsSofa.h, 14);
  g.fill();
  roundRect(g, subsSofa.x, subsSofa.y, subsSofa.w, subsSofa.h, 14);
  g.fillStyle = "#d98b5a";
  g.fill();
  ink(g, 2.5);
  for (let i = 0; i < 3; i++) {
    roundRect(g, subsSofa.x + 12 + i * 74, subsSofa.y + 8, 68, 26, 8);
    g.fillStyle = "#f1c39a";
    g.fill();
    ink(g, 1.5);
  }

  // Pedestals for options 2 and 3
  subsPedestals.forEach((p, i) => {
    softGlow(g, p.x, p.y, 90, "rgba(255,214,150,0.35)");
    g.fillStyle = "rgba(60,40,20,0.18)";
    g.beginPath();
    g.arc(p.x + 2, p.y + 5, p.r, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    g.fillStyle = "#c08a58";
    g.fill();
    ink(g, 2.5);
    g.beginPath();
    g.arc(p.x, p.y, p.r - 6, 0, Math.PI * 2);
    g.fillStyle = "#fdf7ea";
    g.fill();
    ink(g, 1.5);
  });

  // Option 2: caption glasses, with their caption floating above
  const gl = subsDevices[1];
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.fillStyle = "rgba(143,193,227,0.45)";
  [-11, 11].forEach((dx) => {
    roundRect(g, gl.x + dx - 9, gl.y - 6, 18, 13, 5);
    g.fill();
    g.stroke();
  });
  g.beginPath();
  g.moveTo(gl.x - 2, gl.y);
  g.lineTo(gl.x + 2, gl.y);
  g.moveTo(gl.x - 20, gl.y - 2);
  g.lineTo(gl.x - 26, gl.y + 12);
  g.moveTo(gl.x + 20, gl.y - 2);
  g.lineTo(gl.x + 26, gl.y + 12);
  g.stroke();
  drawCaption(g, gl.caption, gl.x, gl.y - 62 + Math.sin(t * 1.5) * 2, 13);

  // Option 3: caption wristband, with a short caption on its screen
  const band = subsDevices[2];
  roundRect(g, band.x - 7, band.y - 24, 14, 48, 6);
  g.fillStyle = "#5b8fa8";
  g.fill();
  ink(g, 1.8);
  roundRect(g, band.x - 14, band.y - 11, 28, 22, 6);
  g.fillStyle = "#3e3226";
  g.fill();
  ink(g, 1.8);
  g.fillStyle = `rgba(255,170,90,${0.6 + Math.sin(t * 3) * 0.3})`;
  g.beginPath();
  g.arc(band.x, band.y, 3, 0, Math.PI * 2);
  g.fill();
  drawCaption(g, band.caption, band.x, band.y - 62 + Math.sin(t * 1.5 + 1) * 2, 13);

  // Option numbers set into the floor
  g.fillStyle = "rgba(62,50,38,0.6)";
  g.font = "700 11px Inter, sans-serif";
  g.letterSpacing = "2px";
  g.textAlign = "center";
  g.fillText("OPTION 1", sc.x + sc.w / 2, sc.y + sc.h + 18);
  g.fillText("OPTION 2", gl.x, gl.y + 52);
  g.fillText("OPTION 3", band.x, band.y + 52);
  g.letterSpacing = "0px";

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
  g.fillStyle = "#efe2c8";
  g.fillRect(0, 0, SUBS.w, SUBS.h);
  g.restore();

  drawSubsRoom(g, t);
  drawCharacter(g, alyssa, alyssa.x, alyssa.y, 1.4, animPhase, !!alyssa.moving);
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
const cafeTable = { x: 300, y: 272, w: 300, h: 104 };
const cafeRoundTables = [{ x: 768, y: 250, r: 36 }, { x: 768, y: 470, r: 36 }];
const cafeSofa = { x: 30, y: 385, w: 54, h: 160 };
const cafeCoffeeTable = { x: 150, y: 465, r: 26 };
const cafeShelf = { x: 848, y: 330, w: 26, h: 96 };
const cafePlants = [{ x: 62, y: 590 }, { x: 838, y: 590 }, { x: 838, y: 130 }];
const cafeStools = [110, 180, 250, 320].map((x) => ({ x, y: 128 }));

// Chairs: `back` is the side the backrest sits on (away from the table).
const cafeChairs = [
  ...[370, 450, 530].map((x) => ({ x, y: 252, back: "up" })),
  ...[370, 450, 530].map((x) => ({ x, y: 396, back: "down" })),
  { x: 282, y: 324, back: "left" },
  { x: 618, y: 324, back: "right" },
  ...cafeRoundTables.flatMap((t) => [
    { x: t.x - 54, y: t.y, back: "left" },
    { x: t.x + 54, y: t.y, back: "right" },
  ]),
];

// People already gathered at the shared table.
const cafePatrons = [
  {
    x: 450, y: 250, facing: "down",
    palette: { skin: "#d9a27a", hair: "#2b2320", hairStyle: "short", outfit: "#6b5b8c", outfitTrim: "#e9e1f2" },
  },
  {
    x: 618, y: 322, facing: "left",
    palette: { skin: "#f2d0b0", hair: "#b5793f", hairStyle: "medium", outfit: "#c9a24a", outfitTrim: "#f5ecd6" },
  },
  {
    x: 370, y: 398, facing: "up",
    palette: { skin: "#8d5a3b", hair: "#1d1713", hairStyle: "short", outfit: "#4f7a78", outfitTrim: "#e1efe9" },
  },
];

// Hanging paper lanterns (and a couple of table candles) — the room's only light.
const cafeLanterns = [
  { x: 380, y: 324, r: 200 },
  { x: 520, y: 324, r: 200 },
  { x: 216, y: 170, r: 180 },
  { x: 768, y: 250, r: 150 },
  { x: 768, y: 470, r: 150 },
  { x: 150, y: 465, r: 160 },
  { x: 530, y: 560, r: 160 },
];
const cafeCandles = cafeRoundTables.map((t) => ({ x: t.x + 14, y: t.y - 10, r: 70 }));

const cafeObstacles = [
  { x: 0, y: 0, w: CAFE.w, h: CAFE.wall },
  { x: 0, y: 0, w: CAFE.wall, h: CAFE.h },
  { x: CAFE.w - CAFE.wall, y: 0, w: CAFE.wall, h: CAFE.h },
  { x: 0, y: CAFE.h - CAFE.wall, w: CAFE.doorX - CAFE.doorW / 2, h: CAFE.wall },
  {
    x: CAFE.doorX + CAFE.doorW / 2, y: CAFE.h - CAFE.wall,
    w: CAFE.w - (CAFE.doorX + CAFE.doorW / 2), h: CAFE.wall,
  },
  cafeCounter, cafeTable, cafeSofa, cafeShelf,
  ...cafeRoundTables.map((t) => circleBox(t)),
  circleBox(cafeCoffeeTable),
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
  // Fit the room between the header and the hint bar.
  const top = 76, bottom = 64;
  const s = Math.min((viewW - 32) / CAFE.w, (viewH - top - bottom) / CAFE.h, 1.3);
  cafeView.scale = s;
  cafeView.ox = (viewW - CAFE.w * s) / 2;
  cafeView.oy = top + (viewH - top - bottom - CAFE.h * s) / 2;
}
window.addEventListener("resize", resizeCafeCanvas);
resizeCafeCanvas();

function enterCafe() {
  const ch = alyssa;
  ch.x = CAFE.doorX;
  ch.y = CAFE.h - CAFE.wall - 26;
  ch.facing = "up";
  ch.moving = false;
  setScene("cafe");
  cafeMusic.start();
}

function leaveCafe() {
  const ch = alyssa;
  const door = doorOf(cafeBuilding);
  ch.x = door.x;
  ch.y = door.y + CHAR_RADIUS + 18;
  ch.facing = "down";
  ch.moving = false;
  cafeMusic.stop();
  setScene("world");
}

document.getElementById("cafeBack").addEventListener("click", leaveCafe);

function updateCafe(dt) {
  const ch = alyssa;
  stepCharacter(ch, dt, CAFE_MOVE_SPEED, cafeObstacles, CAFE_BOUNDS);
  // Stepping through the doorway takes you back outside.
  if (ch.y > CAFE.h - CAFE.wall + 4) leaveCafe();
}

function drawCafeRoom(g) {
  const { wall } = CAFE;

  // Dark wooden floor, rugs, and walls, in the town's outlined storybook style
  drawRoomShell(g, CAFE, {
    floorA: "#6f4c37", floorB: "#664533", seam: "rgba(20,12,8,0.5)",
    wall: "#4a352b", wallTrim: "#5e4536", doorway: "#221c2b", mat: "#9a6b3f",
    rugs: [
      () => {
        roundRect(g, 250, 222, 400, 206, 16);
        g.fillStyle = "#8a3f35";
        g.fill();
        ink(g, 2.5);
        g.strokeStyle = "#c27a5c";
        g.lineWidth = 3;
        roundRect(g, 262, 234, 376, 182, 10);
        g.stroke();
      },
      () => {
        g.beginPath();
        g.arc(cafeCoffeeTable.x - 10, cafeCoffeeTable.y, 100, 0, Math.PI * 2);
        g.fillStyle = "#4f6b52";
        g.fill();
        ink(g, 2.5);
        g.strokeStyle = "#7f9d7a";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(cafeCoffeeTable.x - 10, cafeCoffeeTable.y, 86, 0, Math.PI * 2);
        g.stroke();
      },
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
  drawCafeCorner(g);

  // Low bookshelf against the right wall
  roundRect(g, cafeShelf.x, cafeShelf.y, cafeShelf.w, cafeShelf.h, 4);
  g.fillStyle = "#5a3d2c";
  g.fill();
  ink(g, 2);
  const spines = ["#a6523f", "#d9b56b", "#5f7f86", "#8a6aa0", "#6f915f", "#c98f5a"];
  for (let i = 0; i < 12; i++) {
    g.fillStyle = spines[i % spines.length];
    g.fillRect(cafeShelf.x + 5, cafeShelf.y + 5 + i * 7.3, 16, 5.5);
  }

  cafePlants.forEach((p) => drawPottedPlant(g, p));
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
  roundRect(g, 304, 42, 36, 28, 4);
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

function drawCafeCorner(g) {
  // Sofa against the left wall
  const s = cafeSofa;
  g.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(g, s.x + 3, s.y + 6, s.w, s.h, 10);
  g.fill();
  roundRect(g, s.x, s.y, s.w, s.h, 10);
  g.fillStyle = "#7a4e5e";
  g.fill();
  ink(g, 2.5);
  for (let i = 0; i < 3; i++) {
    roundRect(g, s.x + 16, s.y + 12 + i * 46, s.w - 22, 42, 7);
    g.fillStyle = "#9a6a7a";
    g.fill();
    ink(g, 1.5);
  }

  // Coffee table with a book and a mug
  const t = cafeCoffeeTable;
  g.beginPath();
  g.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  g.fillStyle = "#9b6b46";
  g.fill();
  ink(g, 2.2);
  g.save();
  g.translate(t.x - 5, t.y + 3);
  g.rotate(-0.3);
  g.fillStyle = "#a6523f";
  g.fillRect(-10, -7, 20, 14);
  g.fillStyle = "#f1e6d2";
  g.fillRect(-9, -6, 1.5, 12);
  g.restore();
  drawCafeCup(g, t.x + 12, t.y - 10);
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

function drawCafeTable(g) {
  const T = cafeTable;
  g.fillStyle = "rgba(0,0,0,0.28)";
  roundRect(g, T.x + 4, T.y + 8, T.w, T.h, 14);
  g.fill();
  roundRect(g, T.x, T.y, T.w, T.h, 14);
  g.fillStyle = "#a8774f";
  g.fill();
  ink(g, 2.8);
  g.strokeStyle = "rgba(90,55,30,0.25)";
  g.lineWidth = 1;
  g.beginPath();
  for (let y = T.y + 20; y < T.y + T.h - 8; y += 16) {
    g.moveTo(T.x + 14, y);
    g.lineTo(T.x + T.w - 14, y);
  }
  g.stroke();

  // A place setting in front of every chair
  [370, 450, 530].forEach((x) => {
    drawCafeCup(g, x, T.y + 18);
    drawCafeCup(g, x, T.y + T.h - 18);
  });
  drawCafeCup(g, T.x + 18, T.y + T.h / 2);
  drawCafeCup(g, T.x + T.w - 18, T.y + T.h / 2);

  // Teapot to share
  g.fillStyle = "#5f7f86";
  g.beginPath();
  g.rect(460, 320, 10, 4);
  g.fill();
  ink(g, 1.2);
  g.beginPath();
  g.arc(450, 324, 12, 0, Math.PI * 2);
  g.fill();
  ink(g, 1.8);
  g.fillStyle = "#86a4aa";
  g.beginPath();
  g.arc(450, 324, 5, 0, Math.PI * 2);
  g.fill();

  // Plate of pastries
  g.fillStyle = "#efe6d8";
  g.beginPath();
  g.arc(418, 344, 13, 0, Math.PI * 2);
  g.fill();
  ink(g, 1.5);
  g.fillStyle = "#d9a45b";
  [[-4, -3], [5, -2], [0, 5]].forEach(([dx, dy]) => {
    g.beginPath();
    g.arc(418 + dx, 344 + dy, 4.5, 0, Math.PI * 2);
    g.fill();
  });

  // Little vase of flowers
  g.fillStyle = "#8fa6ac";
  g.beginPath();
  g.arc(484, 306, 5, 0, Math.PI * 2);
  g.fill();
  [["#e7a0a0", -5, -4], ["#f3d27a", 4, -5], ["#e7a0a0", 5, 4], ["#f6efe2", -4, 5]].forEach(
    ([color, dx, dy]) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc(484 + dx, 306 + dy, 3, 0, Math.PI * 2);
      g.fill();
    }
  );
}

function drawCafeRoundTable(g, t) {
  g.fillStyle = "rgba(0,0,0,0.28)";
  g.beginPath();
  g.arc(t.x + 3, t.y + 6, t.r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#a8774f";
  g.beginPath();
  g.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  g.fill();
  ink(g, 2.8);
  drawCafeCup(g, t.x - 14, t.y + 10);
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

  // Tables and people, drawn back-to-front so seated patrons tuck behind the table.
  const player = alyssa;
  const drawables = [
    { y: cafeTable.y + cafeTable.h / 2, draw: () => drawCafeTable(g) },
    ...cafeRoundTables.map((rt) => ({ y: rt.y, draw: () => drawCafeRoundTable(g, rt) })),
    ...cafePatrons.map((p, i) => ({
      y: p.y,
      draw: () => drawCharacter(g, p, p.x, p.y, 1.4, animPhase + i * 1.9, false),
    })),
    { y: player.y, draw: () => drawCharacter(g, player, player.x, player.y, 1.4, animPhase, !!player.moving) },
  ];
  drawables.sort((a, b) => a.y - b.y).forEach((d) => d.draw());

  drawCafeLighting(t);
  cafeCandles.forEach((c, i) => drawCafeCandle(g, c, t, i));
  cafeLanterns.forEach((l, i) => drawCafeLantern(g, l, t, i));
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
    const d = Math.hypot(alyssa.x - p.x, alyssa.y - p.y);
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
  stepCharacter(alyssa, dt, MOVE_SPEED);
  updateCamera(dt);
  updateArea();
}

function render() {
  ctx.clearRect(0, 0, viewW, viewH);

  updateEnterPrompt();
  updateQuoteBubble();
  minimapDotEl.style.left = `${(alyssa.x / WORLD.width) * 100}%`;
  minimapDotEl.style.top = `${(alyssa.y / WORLD.height) * 100}%`;

  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-cameraX, -cameraY);

  drawGround(ctx);
  QUADRANTS.forEach((q) => drawBlockTitle(ctx, q));
  buildings.forEach((b) => drawBuilding(ctx, b));
  signposts().forEach((sign) => drawSignpost(ctx, sign));

  // In the overview Alyssa is drawn larger, with a ring, so she's easy to spot.
  const spot = 1 - followAmount();
  if (spot > 0) {
    ctx.save();
    ctx.globalAlpha = 0.55 * spot;
    ctx.strokeStyle = "#5f7fa3";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(alyssa.x, alyssa.y - 8, 44 + Math.sin(animPhase * 3) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const scale = 1.4 * labelScale(2, 0.55);
  [...people, alyssa]
    .sort((a, b) => a.y - b.y)
    .forEach((ch, i) => {
      const moving = ch === alyssa && !!alyssa.moving;
      drawCharacter(ctx, ch, ch.x, ch.y, scale, animPhase + i * 1.3, moving);
      if (ch !== alyssa && ch !== activeSpeaker) drawSpeechHint(ctx, ch, scale);
    });

  ctx.restore();
}

requestAnimationFrame(tick);
