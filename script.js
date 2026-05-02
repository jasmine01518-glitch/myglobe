/* ============================================================
   GLOBE ARCHIVE — script.js
   3D Travel Photo Archive on an Interactive Globe
   ============================================================ */

// ── Constants ──────────────────────────────────────────────
const GLOBE_RADIUS = 2.2;
const CAMERA_DISTANCE = 6.2;
const MIN_ZOOM = 3.8;
const MAX_ZOOM = 10;
const STORAGE_KEY = 'globe-archive-v1';

// ── Location Dataset (30 major travel cities) ──────────────
const LOCATIONS = [
  { city: 'Seoul',         country: 'South Korea',   lat:  37.5665, lng:  126.9780 },
  { city: 'Tokyo',         country: 'Japan',          lat:  35.6762, lng:  139.6503 },
  { city: 'Paris',         country: 'France',         lat:  48.8566, lng:    2.3522 },
  { city: 'London',        country: 'United Kingdom', lat:  51.5074, lng:   -0.1278 },
  { city: 'New York',      country: 'United States',  lat:  40.7128, lng:  -74.0060 },
  { city: 'Shanghai',      country: 'China',          lat:  31.2304, lng:  121.4737 },
  { city: 'Beijing',       country: 'China',          lat:  39.9042, lng:  116.4074 },
  { city: 'Hong Kong',     country: 'China',          lat:  22.3193, lng:  114.1694 },
  { city: 'Taipei',        country: 'Taiwan',         lat:  25.0330, lng:  121.5654 },
  { city: 'Bangkok',       country: 'Thailand',       lat:  13.7563, lng:  100.5018 },
  { city: 'Singapore',     country: 'Singapore',      lat:   1.3521, lng:  103.8198 },
  { city: 'Sydney',        country: 'Australia',      lat: -33.8688, lng:  151.2093 },
  { city: 'Melbourne',     country: 'Australia',      lat: -37.8136, lng:  144.9631 },
  { city: 'Stockholm',     country: 'Sweden',         lat:  59.3293, lng:   18.0686 },
  { city: 'Copenhagen',    country: 'Denmark',        lat:  55.6761, lng:   12.5683 },
  { city: 'Malmö',         country: 'Sweden',         lat:  55.6050, lng:   13.0038 },
  { city: 'Berlin',        country: 'Germany',        lat:  52.5200, lng:   13.4050 },
  { city: 'Amsterdam',     country: 'Netherlands',    lat:  52.3676, lng:    4.9041 },
  { city: 'Rome',          country: 'Italy',          lat:  41.9028, lng:   12.4964 },
  { city: 'Milan',         country: 'Italy',          lat:  45.4654, lng:    9.1859 },
  { city: 'Barcelona',     country: 'Spain',          lat:  41.3851, lng:    2.1734 },
  { city: 'Madrid',        country: 'Spain',          lat:  40.4168, lng:   -3.7038 },
  { city: 'Vienna',        country: 'Austria',        lat:  48.2082, lng:   16.3738 },
  { city: 'Prague',        country: 'Czech Republic', lat:  50.0755, lng:   14.4378 },
  { city: 'Zurich',        country: 'Switzerland',    lat:  47.3769, lng:    8.5417 },
  { city: 'Reykjavik',     country: 'Iceland',        lat:  64.1466, lng:  -21.9426 },
  { city: 'Los Angeles',   country: 'United States',  lat:  34.0522, lng: -118.2437 },
  { city: 'San Francisco', country: 'United States',  lat:  37.7749, lng: -122.4194 },
  { city: 'Vancouver',     country: 'Canada',         lat:  49.2827, lng: -123.1207 },
  { city: 'Cape Town',     country: 'South Africa',   lat: -33.9249, lng:   18.4241 },
];

// ── Land Polygon Data ──────────────────────────────────────
// Simplified continental outlines as [lng, lat] arrays.
// Embedded directly so the texture works offline / file:// with zero CDN deps.
const LAND_POLYGONS = [
  // Africa
  [[-6,36],[10,37],[25,32],[35,30],[38,22],[43,12],[51,11],
   [43,-2],[40,-5],[38,-18],[36,-25],[28,-35],[18,-35],[12,-34],
   [18,-30],[12,-18],[9,-5],[9,4],[3,5],[-5,5],[-16,12],[-17,14],[-6,36]],
  // Europe + Scandinavia
  [[-5,36],[5,36],[10,37],[18,38],[22,38],[26,40],[30,44],[30,48],
   [24,56],[14,57],[10,57],[10,58],[14,58],[20,60],[22,64],[26,70],[28,71],
   [14,71],[5,68],[-2,62],[-6,58],[-8,52],[-5,48],[-2,48],[2,52],
   [-4,44],[-9,44],[-9,38],[-5,36]],
  // Asia (main body + Arabia + Siberia)
  [[26,41],[40,42],[50,43],[60,37],[65,38],[72,42],[80,44],[90,50],
   [100,55],[110,62],[105,72],[120,72],[140,72],[150,68],[160,60],
   [168,54],[155,52],[148,44],[145,35],[140,42],[130,32],[125,22],
   [118,22],[115,8],[110,2],[105,5],[100,10],[97,3],[98,20],[96,25],
   [80,25],[72,22],[62,22],[55,24],[50,24],[44,16],[40,36],[36,36],[26,41]],
  // Indian Subcontinent
  [[66,22],[80,20],[88,22],[96,25],[96,22],[85,20],[80,14],
   [76,8],[72,8],[66,14],[60,22],[66,22]],
  // North America
  [[-168,64],[-163,71],[-155,75],[-130,70],[-100,74],[-80,73],
   [-65,68],[-52,47],[-65,44],[-70,44],[-82,42],[-82,30],[-80,25],
   [-88,16],[-83,10],[-77,8],[-95,20],[-110,24],[-117,33],
   [-124,48],[-132,55],[-140,60],[-150,60],[-160,60],[-168,64]],
  // South America
  [[-62,12],[-52,4],[-44,-3],[-35,-8],[-40,-20],[-43,-23],
   [-52,-33],[-65,-55],[-72,-50],[-72,-38],[-70,-20],[-75,-10],
   [-80,-2],[-78,2],[-72,12],[-62,12]],
  // Australia
  [[114,-22],[122,-14],[128,-14],[136,-12],[140,-18],[148,-22],
   [154,-26],[153,-34],[148,-38],[144,-40],[138,-36],[130,-32],[116,-34],[114,-22]],
  // Greenland
  [[-73,83],[-20,83],[-18,76],[-22,70],[-44,60],[-56,62],[-58,70],[-68,80],[-73,83]],
  // Antarctica
  [[-180,-65],[-150,-68],[-100,-65],[-60,-70],[0,-68],
   [60,-70],[100,-65],[150,-68],[180,-65],[180,-90],[-180,-90]],
  // Great Britain
  [[-6,50],[2,51],[2,54],[0,58],[-3,60],[-5,58],[-8,52],[-6,50]],
  // Ireland
  [[-10,52],[-6,51],[-6,54],[-8,55],[-10,54],[-10,52]],
  // Iceland
  [[-24,64],[-13,64],[-14,66],[-22,66],[-24,64]],
  // Japan (Honshu + Kyushu)
  [[130,31],[132,34],[136,36],[138,36],[141,38],[141,40],
   [140,42],[141,44],[140,44],[139,36],[136,35],[132,33],[130,31]],
  // Hokkaido
  [[140,42],[142,44],[144,44],[145,44],[144,42],[141,42],[140,42]],
  // Sumatra
  [[95,5],[100,4],[105,2],[106,0],[105,-2],[103,-4],[100,-2],[98,2],[95,5]],
  // Borneo
  [[108,2],[112,2],[116,4],[118,2],[118,0],[116,-2],[114,-4],[110,-4],[108,-2],[108,2]],
  // Papua New Guinea
  [[132,-2],[135,-6],[140,-6],[145,-5],[150,-10],[148,-10],[143,-8],[138,-6],[132,-2]],
  // New Zealand (South Island)
  [[166,-46],[168,-44],[172,-43],[174,-40],[172,-44],[170,-46],[166,-46]],
  // Madagascar
  [[44,-13],[50,-16],[50,-24],[44,-25],[44,-16],[44,-13]],
  // Philippines
  [[118,18],[122,18],[124,12],[126,8],[124,8],[120,10],[118,14],[118,18]],
  // Sri Lanka
  [[80,10],[81,9],[82,7],[80,6],[80,10]],
  // Taiwan
  [[120,25],[121,22],[120,22],[121,25]],
  // Cuba
  [[-84,22],[-77,20],[-74,20],[-74,22],[-78,23],[-84,23],[-84,22]],
];

// ── State ──────────────────────────────────────────────────
let scene, camera, renderer, cssRenderer, globeGroup;
let isDragging = false;
let previousMouse = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };          // for inertia
let photos = [];                          // all stored photo objects
let photoObjects = [];                    // THREE.CSS2DObject refs
let pendingFiles = [];                    // files selected but not saved
let lightboxPhotoId = null;              // currently open photo id
let selectedLocation = null;             // confirmed location from dropdown
let globeMaterial  = null;               // ref so async texture can update it

// ── Entry Point ────────────────────────────────────────────
function init() {
  setupScene();
  createGlobe();
  setupLighting();
  setupControls();

  loadFromStorage();

  // Populate with demo data if the archive is empty
  if (photos.length === 0) loadSampleData();

  rebuildPhotoLayer();
  updateCounter();
  animate();
}

// ── Scene Setup ────────────────────────────────────────────
function setupScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    42, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.set(0, 0, CAMERA_DISTANCE);

  // WebGL renderer (canvas element defined in HTML)
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('globe-canvas'),
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparent — body bg shows through

  // CSS2DRenderer overlays HTML thumbnails in 3D space
  cssRenderer = new THREE.CSS2DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.top = '0';
  cssRenderer.domElement.style.pointerEvents = 'none';
  document.getElementById('globe-container').appendChild(cssRenderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Globe group: rotating this rotates sphere + all photo cards together
  globeGroup = new THREE.Group();
  // Initial tilt — shows Atlantic/Europe region on first load
  globeGroup.rotation.set(0.18, -1.8, 0);
  scene.add(globeGroup);
}

// ── Globe Geometry ─────────────────────────────────────────
function createGlobe() {
  const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 72, 72);

  // Build map texture synchronously from embedded polygon data — no network needed.
  globeMaterial = new THREE.MeshPhongMaterial({
    color:    0xffffff, // neutral white so texture colors render as-is
    specular: 0x686864,
    shininess: 5,
    map: buildMapTexture(),
  });

  globeGroup.add(new THREE.Mesh(geo, globeMaterial));

  // Atmosphere halo
  const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.045, 64, 64);
  const haloMat = new THREE.MeshPhongMaterial({
    color: 0xddddd8,
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide,
    depthWrite: false,
  });
  globeGroup.add(new THREE.Mesh(haloGeo, haloMat));
}

// Draws ocean + continents + lat/lng grid onto a 2048×1024 canvas and returns
// a THREE.CanvasTexture. Fully synchronous — works offline and from file://.
function buildMapTexture() {
  const W = 2048, H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // ── Ocean base ──
  ctx.fillStyle = '#eceae7';
  ctx.fillRect(0, 0, W, H);

  // ── Continents: trace all polygons in one batched fill ──
  ctx.fillStyle = '#bebcb8';
  ctx.beginPath();
  for (const poly of LAND_POLYGONS) {
    poly.forEach(([lng, lat], i) => {
      const x = ((lng + 180) / 360) * W;
      const y = ((90  - lat) / 180) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
  ctx.fill('evenodd');

  // ── Latitude / longitude grid ──
  ctx.strokeStyle = 'rgba(148, 145, 140, 0.30)';
  ctx.lineWidth   = 1.0;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * H;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let lng = -160; lng <= 160; lng += 20) {
    const x = ((lng + 180) / 360) * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  // Anti-meridian lines at ±180
  [0, W].forEach(x => {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

// (Dead code kept as stub so nothing breaks if called externally)
function traceGeoPath(ctx, geom, W, H) {
  function ring(coords) {
    coords.forEach(([lng, lat], i) => {
      const x = ((lng + 180) / 360) * W;
      const y = ((90 - lat)  / 180) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
  if      (geom.type === 'Polygon')      geom.coordinates.forEach(ring);
  else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(p => p.forEach(ring));
}

// ── Lighting ───────────────────────────────────────────────
function setupLighting() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.72));

  const sun = new THREE.DirectionalLight(0xffffff, 0.78);
  sun.position.set(6, 5, 4);
  scene.add(sun);

  // Soft fill from opposite side to prevent fully dark hemisphere
  const fill = new THREE.DirectionalLight(0xffffff, 0.18);
  fill.position.set(-4, -3, -5);
  scene.add(fill);
}

// ── Mouse & Touch Controls ──────────────────────────────────
function setupControls() {
  const el = document.getElementById('globe-container');

  el.addEventListener('mousedown', (e) => {
    if (e.target.closest('.photo-card') || e.target.closest('#upload-panel')) return;
    isDragging = true;
    velocity = { x: 0, y: 0 };
    previousMouse = { x: e.clientX, y: e.clientY };
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - previousMouse.x;
    const dy = e.clientY - previousMouse.y;
    velocity.x = dx * 0.0028;
    velocity.y = dy * 0.0028;
    globeGroup.rotation.y += dx * 0.0042;
    globeGroup.rotation.x += dy * 0.0042;
    clampXRotation();
    previousMouse = { x: e.clientX, y: e.clientY };
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  // Scroll wheel zoom
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const d = camera.position.length();
    camera.position.setLength(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, d + e.deltaY * 0.008)));
  }, { passive: false });

  // Touch drag & pinch-zoom
  let lastTouchDist = 0;
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      velocity = { x: 0, y: 0 };
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging = false;
      lastTouchDist = pinchDist(e);
    }
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - previousMouse.x;
      const dy = e.touches[0].clientY - previousMouse.y;
      velocity.x = dx * 0.003;
      velocity.y = dy * 0.003;
      globeGroup.rotation.y += dx * 0.0045;
      globeGroup.rotation.x += dy * 0.0045;
      clampXRotation();
      previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dist = pinchDist(e);
      const d = camera.position.length();
      camera.position.setLength(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, d - (dist - lastTouchDist) * 0.03)));
      lastTouchDist = dist;
    }
  }, { passive: false });

  el.addEventListener('touchend', () => { isDragging = false; });

  // Keyboard shortcut: Escape closes lightbox
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // UI event listeners
  document.getElementById('save-btn').addEventListener('click', handleSave);
  document.getElementById('file-input').addEventListener('change', handleFileSelect);
  document.getElementById('lightbox-overlay').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-delete').addEventListener('click', handleDelete);

  initLocationSearch();
}

function pinchDist(e) {
  return Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
  );
}

// Prevent the globe from flipping over at the poles
function clampXRotation() {
  globeGroup.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, globeGroup.rotation.x));
}

// ── Coordinate Conversion ──────────────────────────────────
// Converts geographic lat/lng to a 3D point on a sphere of radius r.
function latLngToVec3(lat, lng, r) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Photo Layer ────────────────────────────────────────────
// Remove all existing CSS2DObjects and re-add them from `photos`.
function rebuildPhotoLayer() {
  photoObjects.forEach(obj => globeGroup.remove(obj));
  photoObjects = [];
  photos.forEach(p => addPhotoToGlobe(p));
}

function addPhotoToGlobe(photo) {
  // Place thumbnail slightly above the sphere surface (×1.032)
  const pos = latLngToVec3(
    photo.lat + (photo.offLat || 0),
    photo.lng + (photo.offLng || 0),
    GLOBE_RADIUS * 1.032
  );

  // Build the DOM card
  const card = document.createElement('div');
  card.className = 'photo-card';
  card.dataset.id = photo.id;

  const img = document.createElement('img');
  img.src = photo.imageData;
  img.alt = photo.location;
  img.draggable = false;
  card.appendChild(img);

  const lbl = document.createElement('div');
  lbl.className = 'photo-label';
  lbl.textContent = photo.location;
  card.appendChild(lbl);

  card.addEventListener('click', (e) => {
    e.stopPropagation();
    openLightbox(photo);
  });

  const obj = new THREE.CSS2DObject(card);
  obj.position.copy(pos);
  obj._photoId = photo.id;
  globeGroup.add(obj);
  photoObjects.push(obj);
}

// ── Clustering ─────────────────────────────────────────────
// Each successive photo at the same location is offset by a golden-angle spiral
// so they fan out around the pinpoint without overlapping badly.
function clusterOffset(indexAtLocation) {
  if (indexAtLocation === 0) return { offLat: 0, offLng: 0 };
  const angle  = indexAtLocation * 137.508 * (Math.PI / 180); // golden angle
  const radius = 2.2 + indexAtLocation * 0.7;
  return {
    offLat: radius * Math.cos(angle) * 0.5,
    offLng: radius * Math.sin(angle),
  };
}

// ── Location Search Dropdown ───────────────────────────────
function initLocationSearch() {
  const input    = document.getElementById('location-input');
  const dropdown = document.getElementById('location-dropdown');

  // Open dropdown on focus
  input.addEventListener('focus', () => {
    renderDropdown(input.value.trim());
    dropdown.classList.remove('hidden');
  });

  // Filter list as user types; typing clears any confirmed selection
  input.addEventListener('input', () => {
    if (selectedLocation) {
      selectedLocation = null;
      input.classList.remove('is-selected');
      document.getElementById('loc-check').classList.remove('visible');
    }
    renderDropdown(input.value.trim());
    dropdown.classList.remove('hidden');
  });

  // Arrow-key navigation + Enter to pick first result
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
      input.blur();
    }
    if (e.key === 'Enter') {
      const first = dropdown.querySelector('.dropdown-item');
      if (first) first.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const items = [...dropdown.querySelectorAll('.dropdown-item')];
      if (items.length) items[0].focus();
    }
  });

  // Close when clicking outside the panel
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#upload-panel')) {
      dropdown.classList.add('hidden');
    }
  });
}

// Build and inject dropdown content based on current query string.
function renderDropdown(query) {
  // ── Recent section ──
  // Unique cities the user has already added (matched against LOCATIONS)
  const recentSection = document.getElementById('recent-section');
  const recentList    = document.getElementById('recent-list');
  const seen = new Set();
  const recentLocs = [];
  [...photos].reverse().forEach(p => {
    const key = `${Math.round(p.lat)},${Math.round(p.lng)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const match = LOCATIONS.find(l =>
      Math.abs(l.lat - p.lat) < 1.2 && Math.abs(l.lng - p.lng) < 1.2
    );
    if (match && recentLocs.length < 4) recentLocs.push(match);
  });

  if (!query && recentLocs.length > 0) {
    recentSection.style.display = '';
    recentList.innerHTML = recentLocs.map(itemHTML).join('');
    attachItemListeners(recentList);
  } else {
    recentSection.style.display = 'none';
  }

  // ── Suggested / filtered section ──
  const sugSection = document.getElementById('suggested-section');
  const sugLabel   = sugSection.querySelector('.dropdown-section-label');
  const sugList    = document.getElementById('suggested-list');

  let results;
  if (!query) {
    sugLabel.textContent = 'SUGGESTED';
    results = LOCATIONS;
  } else {
    sugLabel.textContent = 'RESULTS';
    const q = query.toLowerCase();
    results = LOCATIONS.filter(l =>
      l.city.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
    );
  }

  if (results.length === 0) {
    sugList.innerHTML = '<div class="dropdown-empty">일치하는 도시가 없습니다</div>';
  } else {
    sugList.innerHTML = results.map(itemHTML).join('');
    attachItemListeners(sugList);
  }
}

function itemHTML(loc) {
  return `<div class="dropdown-item" tabindex="0"
    data-city="${loc.city}" data-country="${loc.country}">
    <span class="item-city">${loc.city}</span>
    <span class="item-country">${loc.country}</span>
  </div>`;
}

function attachItemListeners(container) {
  container.querySelectorAll('.dropdown-item').forEach(item => {
    // mousedown fires before the input's blur, preserving focus flow
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const loc = LOCATIONS.find(
        l => l.city === item.dataset.city && l.country === item.dataset.country
      );
      if (loc) confirmLocation(loc);
    });
    // keyboard: Enter / Space on focused item
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      }
    });
  });
}

function confirmLocation(loc) {
  selectedLocation = loc;
  const input = document.getElementById('location-input');
  input.value = `${loc.city}, ${loc.country}`;
  input.classList.add('is-selected');
  document.getElementById('loc-check').classList.add('visible');
  document.getElementById('location-dropdown').classList.add('hidden');
}

// ── Image Utilities ────────────────────────────────────────
// Resize + compress images before storing in localStorage to save space.
function resizeImage(dataUrl, maxW = 900, maxH = 700) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxW || h > maxH) {
        const r = Math.min(maxW / w, maxH / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(cv.toDataURL('image/jpeg', 0.78));
    };
    img.src = dataUrl;
  });
}

function readFile(file) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(file);
  });
}

// ── UI Handlers ────────────────────────────────────────────
function handleFileSelect(e) {
  pendingFiles = Array.from(e.target.files);
  const preview = document.getElementById('preview-container');
  preview.innerHTML = '';
  pendingFiles.forEach(file => {
    const r = new FileReader();
    r.onload = ev => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.className = 'preview-thumb';
      preview.appendChild(img);
    };
    r.readAsDataURL(file);
  });
}

async function handleSave() {
  if (!selectedLocation) {
    showToast('Please select a location from the list.');
    // Re-open the dropdown so the user can pick
    const input = document.getElementById('location-input');
    renderDropdown(input.value.trim());
    document.getElementById('location-dropdown').classList.remove('hidden');
    input.focus();
    return;
  }
  if (!pendingFiles.length) return showToast('사진을 선택해주세요');

  const btn = document.getElementById('save-btn');
  btn.textContent = 'Uploading…';
  btn.disabled = true;

  const locationLabel = `${selectedLocation.city}, ${selectedLocation.country}`;

  // Count existing photos near this location for the cluster spiral
  const existingCount = photos.filter(p =>
    Math.abs(p.lat - selectedLocation.lat) < 1.5 &&
    Math.abs(p.lng - selectedLocation.lng) < 1.5
  ).length;

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  for (let i = 0; i < pendingFiles.length; i++) {
    const raw       = await readFile(pendingFiles[i]);
    const imageData = await resizeImage(raw);
    const offset    = clusterOffset(existingCount + i);

    const photo = {
      id:          `${Date.now()}-${i}`,
      location:    locationLabel,
      displayName: selectedLocation.city,
      lat:         selectedLocation.lat,
      lng:         selectedLocation.lng,
      imageData,
      date:        today,
      offLat:      offset.offLat,
      offLng:      offset.offLng,
    };

    photos.push(photo);
    addPhotoToGlobe(photo);
  }

  saveToStorage();
  updateCounter();
  flyTo(selectedLocation.lat, selectedLocation.lng);
  showToast(`${locationLabel}에 ${pendingFiles.length}장 저장됨`);

  // Reset form state
  const input = document.getElementById('location-input');
  input.value = '';
  input.classList.remove('is-selected');
  document.getElementById('loc-check').classList.remove('visible');
  selectedLocation = null;
  pendingFiles = [];
  document.getElementById('file-input').value = '';
  document.getElementById('preview-container').innerHTML = '';
  btn.textContent = 'Upload'; btn.disabled = false;
}

function handleDelete() {
  if (!lightboxPhotoId) return;
  photos = photos.filter(p => p.id !== lightboxPhotoId);
  saveToStorage();
  rebuildPhotoLayer();
  updateCounter();
  closeLightbox();
  showToast('사진이 삭제되었습니다');
}

// ── Lightbox ───────────────────────────────────────────────
function openLightbox(photo) {
  lightboxPhotoId = photo.id;
  document.getElementById('lightbox-img').src      = photo.imageData;
  document.getElementById('lightbox-location').textContent = photo.location.toUpperCase();
  document.getElementById('lightbox-date').textContent     = photo.date;
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  lightboxPhotoId = null;
  document.getElementById('lightbox').classList.add('hidden');
  document.getElementById('lightbox-img').src = '';
}

// ── Globe Fly-To Animation ─────────────────────────────────
// Rotates the globe so a given lat/lng smoothly swings to face the camera.
function flyTo(lat, lng) {
  // Derive globe rotation angles that place this coordinate at the front.
  // Camera is at +Z; the formula accounts for our latLngToVec3 convention.
  const targetY = -(lng + 90) * (Math.PI / 180);
  const targetX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, -lat * (Math.PI / 180) * 0.55));

  const startY = globeGroup.rotation.y;
  const startX = globeGroup.rotation.x;

  // Pick shortest rotation path around Y axis
  let deltaY = ((targetY - startY) % (Math.PI * 2));
  if (deltaY >  Math.PI) deltaY -= Math.PI * 2;
  if (deltaY < -Math.PI) deltaY += Math.PI * 2;

  const duration = 1100;
  const t0 = performance.now();

  (function tick(now) {
    const t = Math.min(1, (now - t0) / duration);
    const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
    globeGroup.rotation.y = startY + deltaY * e;
    globeGroup.rotation.x = startX + (targetX - startX) * e;
    if (t < 1) requestAnimationFrame(tick);
  })(t0);
}

// ── localStorage ───────────────────────────────────────────
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {
    // QuotaExceededError — localStorage is full (large images)
    showToast('저장 용량이 부족합니다. 일부 사진은 새로고침 후 사라질 수 있어요');
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) photos = JSON.parse(raw);
  } catch (_) { photos = []; }
}

// ── Sample Data ────────────────────────────────────────────
// Generates simple placeholder images via canvas so no network needed.
function makePlaceholderImage(hue, label) {
  const cv = document.createElement('canvas');
  cv.width = 480; cv.height = 320;
  const ctx = cv.getContext('2d');

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, 210);
  sky.addColorStop(0, `hsl(${hue}, 32%, 74%)`);
  sky.addColorStop(1, `hsl(${hue}, 44%, 58%)`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 480, 210);

  // Ground
  const ground = ctx.createLinearGradient(0, 210, 0, 320);
  ground.addColorStop(0, `hsl(${(hue + 25) % 360}, 22%, 50%)`);
  ground.addColorStop(1, `hsl(${(hue + 25) % 360}, 22%, 38%)`);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 210, 480, 110);

  // Soft sun disc
  const grad = ctx.createRadialGradient(360, 60, 0, 360, 60, 40);
  grad.addColorStop(0, 'rgba(255,252,230,0.75)');
  grad.addColorStop(1, 'rgba(255,252,230,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(360, 60, 40, 0, Math.PI * 2);
  ctx.fill();

  // Horizon hill silhouette
  ctx.fillStyle = `hsla(${(hue + 15) % 360}, 28%, 42%, 0.55)`;
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.bezierCurveTo(120, 175, 260, 200, 480, 185);
  ctx.lineTo(480, 210); ctx.lineTo(0, 210);
  ctx.fill();

  // Location watermark
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = 'bold 28px -apple-system, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label.toUpperCase(), 24, 300);

  return cv.toDataURL('image/jpeg', 0.82);
}

function loadSampleData() {
  const samples = [
    { location: 'Paris',      lat:  48.856,  lng:   2.352, hue: 210 },
    { location: 'Tokyo',      lat:  35.676,  lng: 139.650, hue: 345 },
    { location: 'New York',   lat:  40.712,  lng: -74.006, hue: 195 },
    { location: 'Sydney',     lat: -33.869,  lng: 151.209, hue: 158 },
    { location: 'Reykjavik',  lat:  64.147,  lng: -21.942, hue: 225 },
    { location: 'Cape Town',  lat: -33.925,  lng:  18.424, hue: 28  },
  ];

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  samples.forEach((s, i) => {
    const offset = clusterOffset(0); // each city has one photo, no offset needed
    photos.push({
      id:          `sample-${i}`,
      location:    s.location,
      displayName: s.location,
      lat:         s.lat,
      lng:         s.lng,
      imageData:   makePlaceholderImage(s.hue, s.location),
      date:        today,
      offLat:      offset.offLat,
      offLng:      offset.offLng,
    });
  });

  saveToStorage();
}

// ── UI Helpers ─────────────────────────────────────────────
function updateCounter() {
  document.getElementById('count-number').textContent = photos.length;
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast') || createToast();
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function createToast() {
  const el = document.createElement('div');
  el.id = 'toast';
  document.body.appendChild(el);
  return el;
}

// ── Animation Loop ─────────────────────────────────────────
const _worldPos = new THREE.Vector3(); // reused each frame to avoid GC

function animate() {
  requestAnimationFrame(animate);

  // Gentle auto-rotation when the user isn't interacting
  if (!isDragging) {
    // Apply drag inertia
    if (Math.abs(velocity.x) > 0.00005 || Math.abs(velocity.y) > 0.00005) {
      globeGroup.rotation.y += velocity.x;
      globeGroup.rotation.x += velocity.y;
      clampXRotation();
      velocity.x *= 0.92;
      velocity.y *= 0.92;
    } else {
      // Slow ambient spin
      globeGroup.rotation.y += 0.0006;
    }
  }

  // Show / fade photo cards based on whether they face the camera.
  // A card is hidden when it's on the far side of the globe.
  const camDir = camera.position.clone().normalize();
  photoObjects.forEach(obj => {
    obj.getWorldPosition(_worldPos);
    const dot = _worldPos.normalize().dot(camDir);
    // Smooth fade: invisible when dot ≤ 0, fully visible when dot ≥ 0.25
    const opacity = Math.max(0, Math.min(1, (dot - 0.0) * 4));
    obj.element.style.opacity = opacity;
    obj.element.style.pointerEvents = opacity > 0.3 ? 'auto' : 'none';
  });

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

// ── Boot ───────────────────────────────────────────────────
init();
