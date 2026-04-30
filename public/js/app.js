// ======================
// GLOBAL VARIABLES
// ======================
let tiles = [];
let modalMap;
let marker;
let tileResizeTimer;

const STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];
const TOTAL_BG_IMAGES = 23;

// ======================
// DOM CONTENT LOADED
// ======================
document.addEventListener('DOMContentLoaded', () => {
  loadBackgroundGrid();
  init();
});

// ======================
// BACKGROUND GRID
// ======================
function loadBackgroundGrid() {
  const container = document.querySelector('.bg-grid');
  if (!container) return;

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  const cols = Math.ceil(window.innerWidth / 250);
  const rows = Math.ceil(window.innerHeight / 180);
  const totalTiles = cols * rows;

  for (let i = 0; i < totalTiles; i++) {
    const tile = document.createElement('div');
    tile.className = 'bg-tile';
    tile.style.backgroundImage = `url(/images/bar-${(i % TOTAL_BG_IMAGES) + 1}.jpg)`;
    tile.style.filter = `brightness(${0.65 + Math.random() * 0.15}) saturate(${0.9 + Math.random() * 0.2})`;
    tile.style.animationDelay = `${(i * 0.05) % 2}s`;
    fragment.appendChild(tile);
  }

  container.appendChild(fragment);
  tiles = container.querySelectorAll('.bg-tile');
}

window.addEventListener('resize', () => {
  clearTimeout(tileResizeTimer);
  tileResizeTimer = setTimeout(loadBackgroundGrid, 120);
});

// ======================
// INIT
// ======================
function init() {
  const form = document.querySelector('#search-form');
  if (form) form.addEventListener('submit', handleSearch);

  setupCustomSelect();
  setupAuthForms();
  setupPasswordToggles();
  setupLogout();
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('keydown', handleEscape);

  const mapModal = document.getElementById('map-modal');
  if (mapModal)
    mapModal.addEventListener('click', (e) => {
      if (e.target.id === 'map-modal') closeModal();
    });

  const closeSavedMapBtn = document.getElementById('close-mypubs-map');
  if (closeSavedMapBtn) closeSavedMapBtn.addEventListener('click', closeSavedMap);

  const closeMapBtn = document.getElementById('close-map');
  if (closeMapBtn) closeMapBtn.addEventListener('click', closeModal);

  // Comment submit button
  const commentBtn = document.querySelector('#pubcommentsubmit');
  if (commentBtn) commentBtn.addEventListener('click', submitComment);

  // Single brewery delete button
  const deleteBtn = document.querySelector('#deletebrewery');
  if (deleteBtn) deleteBtn.addEventListener('click', deleteBreweryById);
}

async function parseApiError(res, fallbackMessage) {
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await res.json();
    return data?.message || fallbackMessage;
  }

  const text = await res.text();
  return text || fallbackMessage;
}

// ======================
// ESCAPE KEY HANDLER
// ======================
function handleEscape(e) {
  if (e.key === 'Escape') {
    closeModal();
    closeSavedMap();
  }
}

// ======================
// SEARCH
// ======================
function handleSearch(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const name = form.querySelector('[name="name"]')?.value.trim() || '';
  const city = form.querySelector('[name="city"]')?.value.trim() || '';
  // prefer the hidden selected value, fall back to the visible input text
  const stateHidden = form.querySelector('[name="state"]')?.value.trim() || '';
  const stateInputText =
    form.querySelector('#state-select .custom-select-input')?.value.trim() || '';
  const state = stateHidden || stateInputText;

  if (!name && !city && !state) return alert('Please enter a brewery name, city, or state');

  const params = new URLSearchParams();
  if (name) params.set('name', name);
  if (city) params.set('city', city);
  if (state) params.set('state', state);

  window.location.href = `/search?${params.toString()}`;
}

// ======================
// CUSTOM SELECT
// ======================
function setupCustomSelect() {
  const container = document.getElementById('state-select');
  if (!container) return;

  const input = container.querySelector('.custom-select-input');
  const hiddenInput = container.querySelector("input[type='hidden']");

  // create a global dropdown appended to body so it isn't clipped by parent overflow
  let dropdown = document.getElementById('global-state-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'global-state-dropdown';
    dropdown.className = 'custom-select-dropdown hidden';
    document.body.appendChild(dropdown);
  }

  let options = [];
  let highlighted = -1;

  function positionDropdown() {
    const rect = input.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY + 6}px`;
    dropdown.style.width = `${rect.width}px`;
  }

  function renderOptions(filter = '') {
    const filtered = STATES.filter((s) => s.toLowerCase().includes(filter.toLowerCase()));
    dropdown.innerHTML = filtered
      .map((s, i) => `<div class="option" data-index="${i}">${s}</div>`)
      .join('');
    options = Array.from(dropdown.querySelectorAll('.option'));
    highlighted = -1;
    if (options.length === 0) dropdown.classList.add('hidden');
    else {
      dropdown.classList.remove('hidden');
      positionDropdown();
    }
  }

  function highlight(idx) {
    if (!options.length) return;
    if (highlighted >= 0 && options[highlighted])
      options[highlighted].classList.remove('highlight');
    highlighted = Math.max(-1, Math.min(idx, options.length - 1));
    if (highlighted >= 0 && options[highlighted]) {
      options[highlighted].classList.add('highlight');
      options[highlighted].scrollIntoView({ block: 'nearest' });
    }
  }

  function selectOptionByIndex(idx) {
    if (!options.length || idx < 0 || idx >= options.length) return;
    const val = options[idx].textContent;
    input.value = hiddenInput.value = val;
    dropdown.classList.add('hidden');
    input.focus();
  }

  input.addEventListener('focus', () => renderOptions(''));

  input.addEventListener('input', (e) => {
    hiddenInput.value = '';
    renderOptions(e.target.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (options.length === 0) renderOptions(input.value);
      highlight(highlighted + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlight(highlighted - 1);
      return;
    }
    if (e.key === 'Enter') {
      if (!dropdown.classList.contains('hidden') && highlighted >= 0) {
        e.preventDefault();
        selectOptionByIndex(highlighted);
      }
      return;
    }
    if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
      return;
    }
  });

  dropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.option');
    if (!option) return;
    const idx = parseInt(option.dataset.index, 10);
    if (!Number.isNaN(idx)) selectOptionByIndex(idx);
  });

  // hide when clicking outside input or dropdown
  document.addEventListener('click', (e) => {
    if (e.target === input || dropdown.contains(e.target) || container.contains(e.target)) return;
    dropdown.classList.add('hidden');
  });

  // reposition on scroll/resize
  window.addEventListener(
    'scroll',
    () => {
      if (!dropdown.classList.contains('hidden')) positionDropdown();
    },
    { passive: true }
  );
  window.addEventListener('resize', () => {
    if (!dropdown.classList.contains('hidden')) positionDropdown();
  });
}

// ======================
// AUTH
// ======================
function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-pass');
  if (!toggleButtons.length) return;

  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = btn.closest('form');
      const input =
        (form && btn.dataset.target ? form.querySelector(btn.dataset.target) : null) ||
        (btn.dataset.target ? document.querySelector(btn.dataset.target) : null);

      if (!input) return;

      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? 'Show' : 'Hide';
    });
  });
}

function setupAuthForms() {
  const loginForm = document.querySelector('.login-form');
  const signupForm = document.querySelector('.signup-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = loginForm.querySelector('[name="email"]')?.value.trim() || '';
      const password = loginForm.querySelector('[name="password"]')?.value.trim() || '';
      const errorEl = loginForm.querySelector('.login-error');
      if (errorEl) errorEl.textContent = '';

      if (!email || !password) {
        if (errorEl) errorEl.textContent = 'Please fill in both fields.';
        return;
      }

      try {
        const res = await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const message = await parseApiError(res, 'Login failed');
          throw new Error(message);
        }

        window.location.href = '/';
      } catch (err) {
        if (errorEl) errorEl.textContent = err.message;
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = signupForm.querySelector('[name="username"]')?.value.trim() || '';
      const email = signupForm.querySelector('[name="email"]')?.value.trim() || '';
      const password = signupForm.querySelector('[name="password"]')?.value.trim() || '';
      const errorEl = signupForm.querySelector('.signup-error');
      if (errorEl) errorEl.textContent = '';

      if (!name || !email || !password) {
        if (errorEl) errorEl.textContent = 'All fields are required.';
        return;
      }

      try {
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const message = await parseApiError(res, 'Signup failed');
          throw new Error(message);
        }

        window.location.href = '/';
      } catch (err) {
        if (errorEl) errorEl.textContent = err.message;
      }
    });
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/user/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        document.location.replace('/');
      } else {
        showToast('Failed to logout');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to logout');
    }
  });
}

// ======================
// GLOBAL CLICK HANDLER
// ======================
function handleGlobalClick(e) {
  const btn = e.target.closest('button, a');
  if (!btn) return;

  if (btn.classList.contains('btn-save-brewery')) handleSave(btn);
  if (btn.classList.contains('btn-map-brewery')) handleMap(btn);
  if (btn.classList.contains('location-link')) handleMap(btn);
  if (btn.classList.contains('btn-map-saved')) openSavedMap(btn);
  if (btn.classList.contains('btn-delete-brewery') && !btn.id) deleteBrewery(btn.dataset.id);
}

// ======================
// SAVE BREWERY
// ======================
async function handleSave(btn) {
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const brewery = {
    refid: btn.dataset.id,
    brewname: btn.dataset.name,
    address: btn.dataset.address || '',
    city: btn.dataset.city,
    state: btn.dataset.state,
    zipcode: btn.dataset.zip || '',
    phone: btn.dataset.phone || '',
    website: btn.dataset.website || '',
    latitude: btn.dataset.lat || '',
    longitude: btn.dataset.lng || '',
    remark: btn.dataset.type,
    comment: '',
    currentDate: new Date().toDateString(),
  };

  try {
    const res = await fetch('/api/breweries/addbrewery/', {
      method: 'POST',
      body: JSON.stringify(brewery),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 401) {
      showToast('Please log in first');
      btn.disabled = false;
      btn.textContent = originalLabel;
      setTimeout(() => (window.location.href = '/login'), 1500);
      return;
    }

    if (!res.ok) {
      showToast('Already saved or error');
      btn.disabled = false;
      btn.textContent = originalLabel;
      return;
    }

    const savedBrewery = await res.json();
    btn.textContent = 'Saved ✓';
    btn.disabled = true;
    btn.style.opacity = '0.6';

    showToast('✅ Brewery saved!', async () => {
      if (!savedBrewery?.id) return showToast('Undo not available');
      const undoRes = await fetch(`/api/breweries/${savedBrewery.id}`, { method: 'DELETE' });
      if (!undoRes.ok) return showToast('Unable to undo save');

      btn.textContent = originalLabel;
      btn.disabled = false;
      btn.style.opacity = '1';
      showToast('Save undone');
    });
  } catch (err) {
    console.error(err);
    btn.textContent = originalLabel;
    btn.disabled = false;
    showToast('❌ Failed to save brewery');
  }
}

// ======================
// DELETE BREWERY
// ======================
async function deleteBrewery(id) {
  if (!id) return;
  const res = await fetch(`/api/breweries/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.ok) window.location.replace('/api/breweries');
  else showToast('Failed to delete brewery');
}

// ======================
// SINGLE PAGE DELETE
// ======================
async function deleteBreweryById(e) {
  e.preventDefault();
  const brew_id = document.querySelector('#brewid')?.value;
  if (!brew_id) return;
  await deleteBrewery(brew_id);
}

// ======================
// COMMENT
// ======================
async function submitComment(e) {
  e.preventDefault();
  const brew_id = document.querySelector('#brewid')?.value;
  const comment = document.querySelector('#pubcomment')?.value.trim();
  if (!brew_id || !comment) return;

  const res = await fetch(`/api/breweries/${brew_id}`, {
    method: 'PUT',
    body: JSON.stringify({ comment }),
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.ok) window.location.replace('/api/breweries');
  else showToast('Failed to add comment');
}

// ======================
// MAP MODAL FOR SEARCH / SAVED
// ======================
function handleMap(btn) {
  openMap(btn.dataset.name, btn.dataset.lat, btn.dataset.lng, 'map-modal', 'modal-map');
}
function openSavedMap(btn) {
  openMap(
    btn.dataset.name,
    btn.dataset.lat,
    btn.dataset.lng,
    'mypubs-map-modal',
    'mypubs-modal-map'
  );
}

function openMap(name, latStr, lngStr, modalId, mapId) {
  const lat = parseFloat(latStr),
    lng = parseFloat(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return showToast('Location not available');

  const modal = document.getElementById(modalId);
  modal.classList.remove('hidden');
  requestAnimationFrame(() => modal.classList.add('active'));
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    if (!modalMap) {
      modalMap = L.map(mapId).setView([lat, lng], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(
        modalMap
      );
    } else {
      modalMap.invalidateSize();
      modalMap.flyTo([lat, lng], 13, { animate: true, duration: 1 });
    }

    if (marker) modalMap.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(modalMap).bindPopup(name).openPopup();
  }, 180);
}

function closeModal() {
  const modal = document.getElementById('map-modal');
  if (!modal || modal.classList.contains('hidden')) return;
  modal.classList.remove('active');
  modal.addEventListener('transitionend', () => modal.classList.add('hidden'), { once: true });
  document.body.style.overflow = '';
}

function closeSavedMap() {
  const modal = document.getElementById('mypubs-map-modal');
  if (!modal || modal.classList.contains('hidden')) return;
  modal.classList.remove('active');
  modal.addEventListener('transitionend', () => modal.classList.add('hidden'), { once: true });
  document.body.style.overflow = '';
}
