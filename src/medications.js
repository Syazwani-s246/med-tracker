// Safety intervals in hours (0 = no warning)
export const MEDICATIONS = [
  { name: 'Panadol', interval: 4 },
  { name: 'Uphamol', interval: 4 },
  { name: 'Paracetamol', interval: 4 },
  { name: 'Ibuprofen', interval: 6 },
  { name: 'Aspirin', interval: 4 },
  { name: 'Piriton', interval: 6 },
  { name: 'Polaramine', interval: 6 },
  { name: 'Loratadine', interval: 6 },
  { name: 'Clarinase', interval: 6 },
  { name: 'Anarex', interval: 4 },
  { name: 'Voltaren', interval: 8 },
  { name: 'Buscopan', interval: 8 },
  { name: 'Nexium', interval: 0 },
  { name: 'Propranolol', interval: 0 },
  { name: 'Omeprazole', interval: 0 },
  { name: 'Metformin', interval: 0 },
  { name: 'Atorvastatin', interval: 0 },
]

export const MED_NAMES = MEDICATIONS.map((m) => m.name)

// Returns the interval in hours for a given medication name (case-insensitive)
// Returns 0 if not found or no interval defined
export function getSafetyInterval(name) {
  if (!name) return 0
  const match = MEDICATIONS.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  )
  return match ? match.interval : 0
}

// Autocomplete: returns names matching the query
export function searchMedications(query) {
  if (!query) return MED_NAMES
  const q = query.toLowerCase()
  return MED_NAMES.filter((n) => n.toLowerCase().includes(q))
}

export const REASON_PRESETS = [
  'headache',
  'fever',
  'stomachache',
  'anxiety',
  'muscle pain',
  'other',
]
