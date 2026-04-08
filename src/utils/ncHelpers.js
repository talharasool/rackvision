import ncTypes, { NC_ID_MIGRATION, ELEMENT_TYPE_MIGRATION } from '../data/ncTypes';

/**
 * Resolves an NC type ID, mapping old IDs to new ones via migration table.
 * Returns the ID unchanged if no migration exists.
 */
export function resolveNcTypeId(id) {
  if (!id) return id;
  return NC_ID_MIGRATION[id] || id;
}

/**
 * Resolves an element type, mapping old keys to new ones.
 */
export function resolveElementType(elementType) {
  if (!elementType) return elementType;
  return ELEMENT_TYPE_MIGRATION[elementType] || elementType;
}

/**
 * Looks up the display name of an NC type by its ID.
 * Automatically resolves old IDs via migration.
 */
export function getNCTypeName(ncTypeId) {
  if (!ncTypeId) return 'Unknown';
  const resolved = resolveNcTypeId(ncTypeId);
  for (const category of Object.values(ncTypes)) {
    const found = category.find((t) => t.id === resolved);
    if (found) return found.name;
  }
  return ncTypeId;
}

/**
 * Returns the full NC type object for a given ID.
 */
export function getNCTypeById(ncTypeId) {
  if (!ncTypeId) return null;
  const resolved = resolveNcTypeId(ncTypeId);
  for (const category of Object.values(ncTypes)) {
    const found = category.find((t) => t.id === resolved);
    if (found) return found;
  }
  return null;
}
