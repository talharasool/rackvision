const manufacturers = [
  { id: 'mecalux', name: 'Mecalux' },
  { id: 'ar-racking', name: 'AR Racking' },
  { id: 'jungheinrich', name: 'Jungheinrich' },
  { id: 'dexion', name: 'Dexion' },
  { id: 'ssi-schaefer', name: 'SSI Schaefer' },
  { id: 'stow', name: 'Stow' },
  { id: 'constructor', name: 'Constructor' },
  { id: 'link51', name: 'Link 51' },
  { id: 'redirack', name: 'Redirack' },
  { id: 'polypal', name: 'Polypal' },
];

/**
 * Add a new manufacturer to the list.
 * @param {string} name - The manufacturer name.
 * @returns {object} The newly added manufacturer object.
 */
export function addManufacturer(name) {
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existing = manufacturers.find((m) => m.id === id);
  if (existing) {
    return existing;
  }

  const manufacturer = { id, name };
  manufacturers.push(manufacturer);
  return manufacturer;
}

export default manufacturers;
