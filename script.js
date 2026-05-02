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

// ── State ──────────────────────────────────────────────────
let scene, camera, renderer, cssRenderer, globeGroup;
let isDragging = false;
let previousMouse = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };          // for inertia
let photos = [];                          // all stored photo objects
let photoObjects = [];                    // THREE.CSS2DObject refs
let pendingFiles = [];                    // files selected but not saved
let lightboxPhotoId = null;              // currently open photo id

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

  // Attempt to load a grayscale Earth bump map for subtle continent detail.
  // Falls back to a flat-shaded gray sphere if the texture can't be fetched.
  const loader = new THREE.TextureLoader();
  const mat = new THREE.MeshPhongMaterial({
    color: 0xcfcfcc,
    specular: 0x787870,
    shininess: 6,
  });

  loader.load(
    'https://unpkg.com/three@0.128.0/examples/textures/planets/earth_normal_2048.jpg',
    (tex) => {
      mat.bumpMap = tex;
      mat.bumpScale = 0.018;
      mat.needsUpdate = true;
    },
    undefined,
    () => { /* texture load failed — use flat gray, that's fine */ }
  );

  const sphere = new THREE.Mesh(geo, mat);
  globeGroup.add(sphere);

  // Thin atmosphere halo: a slightly larger back-face sphere, semi-transparent
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

// ── Geocoding ──────────────────────────────────────────────
// Uses OpenStreetMap Nominatim — free, no API key required.
async function geocode(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=en`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.length > 0) {
      return {
        lat:         parseFloat(data[0].lat),
        lng:         parseFloat(data[0].lon),
        displayName: data[0].display_name.split(',')[0].trim(),
      };
    }
  } catch (_) { /* network error — handled by caller */ }
  return null;
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
  const locationInput = document.getElementById('location-input');
  const query = locationInput.value.trim();

  if (!query)             return showToast('도시 또는 나라 이름을 입력해주세요');
  if (!pendingFiles.length) return showToast('사진을 선택해주세요');

  const btn = document.getElementById('save-btn');
  btn.textContent = '위치 검색 중…';
  btn.disabled = true;

  const geo = await geocode(query);
  if (!geo) {
    showToast('위치를 찾을 수 없어요. 다른 이름으로 시도해보세요');
    btn.textContent = '저장'; btn.disabled = false;
    return;
  }

  btn.textContent = '저장 중…';

  // Count how many photos already exist near this location (for cluster offset)
  const existingCount = photos.filter(p =>
    Math.abs(p.lat - geo.lat) < 1.5 && Math.abs(p.lng - geo.lng) < 1.5
  ).length;

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  for (let i = 0; i < pendingFiles.length; i++) {
    const raw      = await readFile(pendingFiles[i]);
    const imageData = await resizeImage(raw);
    const offset   = clusterOffset(existingCount + i);

    const photo = {
      id:       `${Date.now()}-${i}`,
      location: query,
      displayName: geo.displayName,
      lat: geo.lat,
      lng: geo.lng,
      imageData,
      date: today,
      offLat: offset.offLat,
      offLng: offset.offLng,
    };

    photos.push(photo);
    addPhotoToGlobe(photo);
  }

  saveToStorage();
  updateCounter();
  flyTo(geo.lat, geo.lng);
  showToast(`${query}에 ${pendingFiles.length}장 저장됨`);

  // Reset form
  locationInput.value = '';
  pendingFiles = [];
  document.getElementById('file-input').value = '';
  document.getElementById('preview-container').innerHTML = '';
  btn.textContent = '저장'; btn.disabled = false;
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
