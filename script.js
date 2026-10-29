const form = document.getElementById('calc-form');
const objectForm = document.getElementById('object-form');
const directionEl = document.getElementById('direction');
const bearingEl = document.getElementById('bearing');
const distanceEl = document.getElementById('distance');
const objectTypeEl = document.getElementById('object-type');
const objectColorEl = document.getElementById('object-color');
const teamColorEl = document.getElementById('team-color');
const targetColorWrapEl = document.getElementById('target-color-wrap');
const fromObjectsEl = document.getElementById('from-objects');
const targetObjectsEl = document.getElementById('target-objects');
const deleteAllButton = document.getElementById('delete-all-objects');
const clearAllButton = document.getElementById('clear-all');

const directions = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
];

const GRID_SIZE_METERS = 100;
let selectedFriendlyId = null;
let selectedTargetId = null;
let trackedObjects = [];

const friendlyColors = ['Red', 'Green', 'Blue'];
let lastTargetColor = 'Red';

const colorHex = {
  Red: '#ef4444',
  Green: '#22c55e',
  Blue: '#3b82f6'
};

function calculateDirection(dx, dy) {
  const angle = Math.atan2(dx, dy) * (180 / Math.PI);
  const normalized = (angle + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;

  return {
    label: directions[index],
    degrees: Math.round(normalized)
  };
}

function calculateMeters(dx, dy) {
  const mapDistance = Math.sqrt(dx * dx + dy * dy);
  return mapDistance * GRID_SIZE_METERS;
}

function refreshTeamColor() {
  const currentColor = teamColorEl.value;

  trackedObjects
    .filter((item) => item.type === 'Friendly')
    .forEach((item) => {
      item.color = currentColor;
    });

  renderPositionLists();
}

function getTargetColorOptions() {
  return friendlyColors.filter((color) => color !== teamColorEl.value);
}

function refreshColorOptions() {
  const type = objectTypeEl.value;

  if (type === 'Friendly') {
    targetColorWrapEl.classList.add('hidden');
    objectColorEl.innerHTML = '';
    return;
  }

  targetColorWrapEl.classList.remove('hidden');
  const options = getTargetColorOptions();
  objectColorEl.innerHTML = '';

  options.forEach((color) => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    objectColorEl.appendChild(option);
  });

  if (!options.includes(lastTargetColor)) {
    lastTargetColor = options[0];
  }

  objectColorEl.value = lastTargetColor;
}

function deleteTrackedObject(itemId) {
  const item = trackedObjects.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }

  const confirmed = window.confirm(`Delete ${item.name}?`);
  if (!confirmed) {
    return;
  }

  trackedObjects = trackedObjects.filter((entry) => entry.id !== itemId);

  if (selectedFriendlyId === itemId) {
    selectedFriendlyId = null;
  }

  if (selectedTargetId === itemId) {
    selectedTargetId = null;
  }

  renderPositionLists();
  calculate();
}

function renderPositionLists() {
  fromObjectsEl.innerHTML = '';
  targetObjectsEl.innerHTML = '';

  trackedObjects.forEach((item) => {
    const itemButton = document.createElement('button');
    itemButton.type = 'button';
    itemButton.className = 'mini-object';
    itemButton.innerHTML = `
      <span class="chip-label">${item.name}</span>
      <span class="chip-close" aria-label="Delete ${item.name}">×</span>
    `;
    itemButton.style.borderColor = colorHex[item.color] || '#94a3b8';
    itemButton.style.color = colorHex[item.color] || '#94a3b8';

    const isSelected =
      (item.type === 'Friendly' && selectedFriendlyId === item.id) ||
      (item.type === 'Target' && selectedTargetId === item.id);

    if (isSelected) {
      itemButton.style.background = 'rgba(255,255,255,0.08)';
      itemButton.style.boxShadow = `inset 0 0 0 2px ${colorHex[item.color] || '#94a3b8'}`;
    }

    itemButton.addEventListener('click', (event) => {
      const closeButton = event.target.closest('.chip-close');
      if (closeButton) {
        event.stopPropagation();
        deleteTrackedObject(item.id);
        return;
      }

      if (item.type === 'Friendly') {
        selectedFriendlyId = item.id;
        document.getElementById('from-x').value = item.x;
        document.getElementById('from-y').value = item.y;
      } else {
        selectedTargetId = item.id;
        document.getElementById('to-x').value = item.x;
        document.getElementById('to-y').value = item.y;
      }

      renderPositionLists();
      calculate();
    });

    if (item.type === 'Friendly') {
      fromObjectsEl.appendChild(itemButton);
    } else {
      targetObjectsEl.appendChild(itemButton);
    }
  });
}

function updateTrackedObjects() {
  renderPositionLists();
}

function calculate() {
  const fromX = Number(document.getElementById('from-x').value);
  const fromY = Number(document.getElementById('from-y').value);
  const toX = Number(document.getElementById('to-x').value);
  const toY = Number(document.getElementById('to-y').value);

  if (
    Number.isNaN(fromX) || Number.isNaN(fromY) ||
    Number.isNaN(toX) || Number.isNaN(toY)
  ) {
    directionEl.textContent = 'Invalid';
    bearingEl.textContent = 'Check values';
    distanceEl.textContent = 'Enter valid numbers';
    return;
  }

  const dx = toX - fromX;
  const dy = toY - fromY;
  const direction = calculateDirection(dx, dy);
  const distance = calculateMeters(dx, dy);

  directionEl.textContent = direction.label;
  bearingEl.textContent = `${direction.degrees}°`;
  distanceEl.textContent = `${Math.round(distance).toLocaleString()} m`;

  updateTrackedObjects();
}

function clearEverything() {
  document.getElementById('from-x').value = 0;
  document.getElementById('from-y').value = 0;
  document.getElementById('to-x').value = 0;
  document.getElementById('to-y').value = 0;
  selectedFriendlyId = null;
  selectedTargetId = null;
  trackedObjects = [];
  renderPositionLists();
  calculate();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  calculate();
});

objectTypeEl.addEventListener('change', () => {
  refreshColorOptions();
  calculate();
});

teamColorEl.addEventListener('change', () => {
  refreshTeamColor();
  refreshColorOptions();
  calculate();
});

objectColorEl.addEventListener('change', () => {
  if (objectTypeEl.value === 'Target') {
    lastTargetColor = objectColorEl.value;
  }

  calculate();
});

['from-x', 'from-y', 'to-x', 'to-y', 'object-x', 'object-y'].forEach((id) => {
  document.getElementById(id).addEventListener('input', () => {
    if (id === 'from-x' || id === 'from-y') {
      selectedFriendlyId = null;
    }

    if (id === 'to-x' || id === 'to-y') {
      selectedTargetId = null;
    }

    updateTrackedObjects();
    calculate();
  });
});

clearAllButton.addEventListener('click', () => {
  const confirmed = window.confirm('Clear all saved data and reset positions?');
  if (confirmed) {
    clearEverything();
  }
});

deleteAllButton.addEventListener('click', () => {
  const confirmed = window.confirm('Delete all saved objects?');
  if (confirmed) {
    trackedObjects = [];
    selectedFriendlyId = null;
    selectedTargetId = null;
    renderPositionLists();
    calculate();
  }
});

objectForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('object-name').value.trim();
  const type = objectTypeEl.value;
  const color = type === 'Friendly' ? teamColorEl.value : objectColorEl.value;
  const x = Number(document.getElementById('object-x').value);
  const y = Number(document.getElementById('object-y').value);

  if (!name || Number.isNaN(x) || Number.isNaN(y)) {
    return;
  }

  const newItem = {
    id: Date.now(),
    name,
    type,
    color,
    x,
    y
  };

  trackedObjects.push(newItem);

  if (type === 'Friendly') {
    selectedFriendlyId = newItem.id;
    document.getElementById('from-x').value = x;
    document.getElementById('from-y').value = y;
  } else {
    selectedTargetId = newItem.id;
    document.getElementById('to-x').value = x;
    document.getElementById('to-y').value = y;
  }

  renderPositionLists();
  calculate();

  document.getElementById('object-name').value = '';
  document.getElementById('object-x').value = 0;
  document.getElementById('object-y').value = 0;
});

refreshColorOptions();
renderPositionLists();
calculate();
