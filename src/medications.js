// Safety intervals in hours (0 = no warning, null = no warning)
export const MEDICATIONS = [
  { name: 'Panadol', ingredients: ['paracetamol'], interval: 4 },
  { name: 'Uphamol', ingredients: ['paracetamol'], interval: 4 },
  { name: 'Paracetamol', ingredients: ['paracetamol'], interval: 4 },
  { name: 'Ibuprofen', ingredients: ['ibuprofen'], interval: 6 },
  { name: 'Aspirin', ingredients: ['aspirin'], interval: 4 },
  { name: 'Myoflex', ingredients: ['paracetamol', 'orphenadrine'], interval: null },
  { name: 'Anarex', ingredients: ['paracetamol', 'orphenadrine', 'caffeine'], interval: null },
  { name: 'Piriton', ingredients: ['chlorphenamine'], interval: 6 },
  { name: 'Polaramine', ingredients: ['dexchlorpheniramine'], interval: 6 },
  { name: 'Clarinase', ingredients: ['loratadine', 'pseudoephedrine'], interval: 6 },
  { name: 'Loratadine', ingredients: ['loratadine'], interval: 6 },
  { name: 'Cetirizine', ingredients: ['cetirizine'], interval: 6 },
  { name: 'Bromhexine HCl', ingredients: ['bromhexine'], interval: null },
  { name: 'Voltaren', ingredients: ['diclofenac'], interval: 8 },
  { name: 'Buscopan', ingredients: ['hyoscine butylbromide'], interval: 8 },
  { name: 'Nexium', ingredients: ['esomeprazole'], interval: 0 },
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
