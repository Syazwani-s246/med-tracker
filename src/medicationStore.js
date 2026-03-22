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
// Each item: { name, ingredients, interval, isDefault }
export function getMergedMedications() {
  const stored = getStoredMeds()
  const result = MEDICATIONS.map((m) => ({ ...m, isDefault: true }))

  for (const [name, data] of Object.entries(stored)) {
    const idx = result.findIndex(
      (m) => m.name.toLowerCase() === name.toLowerCase()
    )
    if (idx !== -1) {
      if (data.deleted) {
        result.splice(idx, 1)
      } else {
        result[idx] = {
          ...result[idx],
          interval: data.interval,
          ...(data.ingredients !== undefined ? { ingredients: data.ingredients } : {}),
          ...(data.prescribed !== undefined ? { prescribed: data.prescribed } : {}),
        }
      }
    } else {
      result.push({ name, ingredients: data.ingredients || [], interval: data.interval, isDefault: false, ...(data.prescribed !== undefined ? { prescribed: data.prescribed } : {}) })
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

export function getIngredients(name) {
  if (!name) return []
  const match = getMergedMedications().find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  )
  return match?.ingredients || []
}

// Save an interval/ingredients override for a default medication
export function saveOverride(name, interval, ingredients) {
  const stored = getStoredMeds()
  const existing = stored[name] || {}
  stored[name] = {
    ...existing,
    interval,
    ...(ingredients !== undefined ? { ingredients } : {}),
  }
  saveStoredMeds(stored)
}

// Remove override for a default medication, restoring the original interval
export function resetDefault(name) {
  const stored = getStoredMeds()
  delete stored[name]
  saveStoredMeds(stored)
}

// Add a new custom medication
export function addCustomMedication(name, interval, ingredients) {
  const stored = getStoredMeds()
  stored[name] = { interval, ingredients: ingredients || [] }
  saveStoredMeds(stored)
}

// Rename or update a custom medication
export function updateCustomMedication(oldName, newName, interval, ingredients) {
  const stored = getStoredMeds()
  delete stored[oldName]
  stored[newName] = { interval, ingredients: ingredients || [] }
  saveStoredMeds(stored)
}

// Delete a custom medication
export function deleteCustomMedication(name) {
  const stored = getStoredMeds()
  delete stored[name]
  saveStoredMeds(stored)
}

// Hide a default medication from the list
export function deleteDefaultMedication(name) {
  const stored = getStoredMeds()
  stored[name] = { deleted: true }
  saveStoredMeds(stored)
}

// Returns list of default medication names that the user has hidden
export function getHiddenDefaults() {
  const stored = getStoredMeds()
  return MEDICATIONS.filter((m) => stored[m.name]?.deleted).map((m) => m.name)
}

// Save prescribed flag for a medication
export function setPrescribed(name, prescribed) {
  const stored = getStoredMeds()
  const existing = stored[name] || {}
  stored[name] = { ...existing, prescribed }
  saveStoredMeds(stored)
}

export function getPrescribed(name) {
  const stored = getStoredMeds()
  return stored[name]?.prescribed === true
}

// --- Course helpers ---

// Get all courses for a med, sorted by startDate asc
export function getCourses(name) {
  const stored = getStoredMeds()
  const med = stored[name]
  if (!med || !Array.isArray(med.courses)) return []
  return [...med.courses].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
}

// Get the currently active course (endDate is null OR endDate >= today)
export function getActiveCourse(name) {
  const today = new Date().toISOString().split('T')[0]
  return getCourses(name).find((c) => !c.endDate || c.endDate >= today) || null
}

// Check if a specific date falls within any course for this med
// Returns true/false/null — null means med has no courses at all (count everything)
export function isWithinAnyCourse(name, date) {
  const courses = getCourses(name)
  if (courses.length === 0) return null
  const d = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10)
  return courses.some((c) => c.startDate <= d && (!c.endDate || c.endDate >= d))
}

// Add a new course
export function addCourse(medName, course) {
  const stored = getStoredMeds()
  const med = stored[medName] || {}
  const courses = Array.isArray(med.courses) ? med.courses : []
  courses.push({ id: crypto.randomUUID(), ...course })
  stored[medName] = { ...med, courses }
  saveStoredMeds(stored)
}

// Update an existing course by id
export function updateCourse(medName, courseId, updatedCourse) {
  const stored = getStoredMeds()
  const med = stored[medName] || {}
  const courses = (Array.isArray(med.courses) ? med.courses : []).map((c) =>
    c.id === courseId ? { ...c, ...updatedCourse } : c
  )
  stored[medName] = { ...med, courses }
  saveStoredMeds(stored)
}

// Delete a course by id
export function deleteCourse(medName, courseId) {
  const stored = getStoredMeds()
  const med = stored[medName] || {}
  const courses = (Array.isArray(med.courses) ? med.courses : []).filter((c) => c.id !== courseId)
  stored[medName] = { ...med, courses }
  saveStoredMeds(stored)
}
