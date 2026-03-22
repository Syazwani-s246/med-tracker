import { MEDICATIONS } from './medications'

const STORAGE_KEY = 'amikubat_medications'

function getStoredMeds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStoredMeds(meds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meds))
}

// Returns merged list: defaults (with any overrides) + custom additions
// Each item: { name, interval, isDefault }
export function getMergedMedications() {
  const stored = getStoredMeds()
  const result = MEDICATIONS.map((m) => ({ ...m, isDefault: true }))

  for (const [name, data] of Object.entries(stored)) {
    const idx = result.findIndex(
      (m) => m.name.toLowerCase() === name.toLowerCase()
    )
    if (idx !== -1) {
      result[idx] = { ...result[idx], interval: data.interval }
    } else {
      result.push({ name, interval: data.interval, isDefault: false })
    }
  }

  return result
}

export function searchMedications(query) {
  const names = getMergedMedications().map((m) => m.name)
  if (!query) return names
  const q = query.toLowerCase()
  return names.filter((n) => n.toLowerCase().includes(q))
}

export function getSafetyInterval(name) {
  if (!name) return 0
  const match = getMergedMedications().find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  )
  return match ? match.interval : 0
}

// Save an interval override for a default medication
export function saveOverride(name, interval) {
  const stored = getStoredMeds()
  stored[name] = { interval }
  saveStoredMeds(stored)
}

// Remove override for a default medication, restoring the original interval
export function resetDefault(name) {
  const stored = getStoredMeds()
  delete stored[name]
  saveStoredMeds(stored)
}

// Add a new custom medication
export function addCustomMedication(name, interval) {
  const stored = getStoredMeds()
  stored[name] = { interval }
  saveStoredMeds(stored)
}

// Rename or update a custom medication
export function updateCustomMedication(oldName, newName, interval) {
  const stored = getStoredMeds()
  delete stored[oldName]
  stored[newName] = { interval }
  saveStoredMeds(stored)
}

// Delete a custom medication
export function deleteCustomMedication(name) {
  const stored = getStoredMeds()
  delete stored[name]
  saveStoredMeds(stored)
}
