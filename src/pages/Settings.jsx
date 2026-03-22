import { useState, useEffect } from 'react'
import { MEDICATIONS } from '../medications'
import {
  getMergedMedications,
  saveOverride,
  resetDefault,
  addCustomMedication,
  updateCustomMedication,
  deleteCustomMedication,
  deleteDefaultMedication,
  getHiddenDefaults,
} from '../medicationStore'
import styles from './Settings.module.css'

function formatInterval(interval) {
  if (!interval) return 'No interval set'
  return `${interval} hour${interval !== 1 ? 's' : ''}`
}

function getDefaultInterval(name) {
  const def = MEDICATIONS.find((m) => m.name.toLowerCase() === name.toLowerCase())
  return def ? def.interval : 0
}

export default function Settings() {
  const [meds, setMeds] = useState([])
  const [editing, setEditing] = useState(null) // { name, interval, ingredients, isDefault }
  const [editInterval, setEditInterval] = useState('')
  const [editName, setEditName] = useState('')
  const [editIngredients, setEditIngredients] = useState([])
  const [editIngredientInput, setEditIngredientInput] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newInterval, setNewInterval] = useState('')
  const [newIngredients, setNewIngredients] = useState([])
  const [newIngredientInput, setNewIngredientInput] = useState('')
  const [addError, setAddError] = useState('')
  const [hiddenMeds, setHiddenMeds] = useState([])

  function reload() {
    setMeds(getMergedMedications())
    setHiddenMeds(getHiddenDefaults())
  }

  useEffect(() => {
    reload()
  }, [])

  const defaultMeds = meds.filter((m) => m.isDefault)
  const customMeds = meds.filter((m) => !m.isDefault)

  function openEdit(med) {
    setEditing(med)
    setEditInterval(med.interval ? String(med.interval) : '')
    setEditName(med.name)
    setEditIngredients(med.ingredients || [])
    setEditIngredientInput('')
  }

  function closeEdit() {
    setEditing(null)
    setEditInterval('')
    setEditName('')
    setEditIngredients([])
    setEditIngredientInput('')
  }

  function addTag(tag, list, setList, setInput) {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed])
    }
    setInput('')
  }

  function handleTagKeyDown(e, list, setList, setInput) {
    if (e.key === ' ' || e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      addTag(e.target.value, list, setList, setInput)
    } else if (e.key === 'Backspace' && !e.target.value && list.length > 0) {
      setList(list.slice(0, -1))
    }
  }

  function removeTag(tag, list, setList) {
    setList(list.filter((t) => t !== tag))
  }

  function handleSaveEdit() {
    const interval = parseFloat(editInterval) || 0
    const finalIngredients = editIngredientInput.trim()
      ? [...editIngredients, editIngredientInput.trim().toLowerCase()]
      : editIngredients
    if (editing.isDefault) {
      saveOverride(editing.name, interval, finalIngredients)
    } else {
      const trimmedName = editName.trim()
      if (!trimmedName) return
      updateCustomMedication(editing.name, trimmedName, interval, finalIngredients)
    }
    closeEdit()
    reload()
  }

  function handleReset() {
    resetDefault(editing.name)
    closeEdit()
    reload()
  }

  function handleDelete() {
    if (editing.isDefault) {
      deleteDefaultMedication(editing.name)
    } else {
      deleteCustomMedication(editing.name)
    }
    closeEdit()
    reload()
  }

  function handleAdd(e) {
    e.preventDefault()
    const trimmedName = newName.trim()
    if (!trimmedName) return

    const isDuplicate = meds.some(
      (m) => m.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (isDuplicate) {
      setAddError('A medication with this name already exists.')
      return
    }

    const interval = parseFloat(newInterval) || 0
    const finalIngredients = newIngredientInput.trim()
      ? [...newIngredients, newIngredientInput.trim().toLowerCase()]
      : newIngredients
    addCustomMedication(trimmedName, interval, finalIngredients)
    setNewName('')
    setNewInterval('')
    setNewIngredients([])
    setNewIngredientInput('')
    setAddError('')
    setShowAdd(false)
    reload()
  }

  const defaultOriginalInterval = editing?.isDefault
    ? getDefaultInterval(editing.name)
    : null
  const isOverridden =
    editing?.isDefault && editing.interval !== defaultOriginalInterval

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </header>

      {/* Default medications */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>Default Medications</p>
        <div className={styles.list}>
          {defaultMeds.map((med) => (
            <button
              key={med.name}
              className={styles.medRow}
              onClick={() => openEdit(med)}
            >
              <span className={styles.medName}>{med.name}</span>
              <span className={styles.medInterval}>{formatInterval(med.interval)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Hidden default medications */}
      {hiddenMeds.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Hidden Medications</p>
          <div className={styles.list}>
            {hiddenMeds.map((name) => (
              <button
                key={name}
                className={styles.medRow}
                onClick={() => { resetDefault(name); reload() }}
              >
                <span className={styles.medName}>{name}</span>
                <span className={styles.medInterval}>Tap to restore</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Custom medications */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>My Medications</p>
        {customMeds.length > 0 ? (
          <div className={styles.list}>
            {customMeds.map((med) => (
              <button
                key={med.name}
                className={styles.medRow}
                onClick={() => openEdit(med)}
              >
                <span className={styles.medName}>{med.name}</span>
                <span className={styles.medInterval}>{formatInterval(med.interval)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyNote}>No custom medications yet.</p>
        )}

        {showAdd ? (
          <form className={styles.addForm} onSubmit={handleAdd}>
            <p className={styles.addFormTitle}>New Medication</p>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Name</label>
              <input
                className={styles.input}
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setAddError('') }}
                placeholder="e.g. Cetirizine"
                autoFocus
              />
              {addError && <p className={styles.error}>{addError}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Safety interval <span className={styles.optional}>(hours, optional)</span>
              </label>
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.5"
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Active ingredients <span className={styles.optional}>(optional)</span>
              </label>
              <div className={styles.tagInput}>
                {newIngredients.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => removeTag(tag, newIngredients, setNewIngredients)}
                    >✕</button>
                  </span>
                ))}
                <input
                  className={styles.tagTextInput}
                  type="text"
                  value={newIngredientInput}
                  onChange={(e) => setNewIngredientInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyDown(e, newIngredients, setNewIngredients, setNewIngredientInput)}
                  onBlur={() => addTag(newIngredientInput, newIngredients, setNewIngredients, setNewIngredientInput)}
                  placeholder={newIngredients.length === 0 ? 'e.g. paracetamol, ibuprofen' : ''}
                />
              </div>
              <p className={styles.fieldHint}>Check your medication label or packaging for active ingredients</p>
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setShowAdd(false); setNewName(''); setNewInterval(''); setNewIngredients([]); setNewIngredientInput(''); setAddError('') }}
              >
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn}>Add</button>
            </div>
          </form>
        ) : (
          <button className={styles.addBtn} onClick={() => setShowAdd(true)}>
            + Add Medication
          </button>
        )}
      </section>

      {/* Edit bottom sheet */}
      {editing && (
        <div className={styles.overlay} onClick={closeEdit}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <p className={styles.sheetTitle}>
              {editing.isDefault ? editing.name : 'Edit Medication'}
            </p>

            {!editing.isDefault && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Safety interval <span className={styles.optional}>(hours)</span>
              </label>
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.5"
                value={editInterval}
                onChange={(e) => setEditInterval(e.target.value)}
                placeholder="0 = no warning"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Active ingredients <span className={styles.optional}>(optional)</span>
              </label>
              <div className={styles.tagInput}>
                {editIngredients.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => removeTag(tag, editIngredients, setEditIngredients)}
                    >✕</button>
                  </span>
                ))}
                <input
                  className={styles.tagTextInput}
                  type="text"
                  value={editIngredientInput}
                  onChange={(e) => setEditIngredientInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyDown(e, editIngredients, setEditIngredients, setEditIngredientInput)}
                  onBlur={() => addTag(editIngredientInput, editIngredients, setEditIngredients, setEditIngredientInput)}
                  placeholder={editIngredients.length === 0 ? 'e.g. paracetamol, ibuprofen' : ''}
                />
              </div>
              <p className={styles.fieldHint}>Check your medication label or packaging for active ingredients</p>
            </div>

            {editing.isDefault && isOverridden && (
              <button className={styles.resetBtn} onClick={handleReset}>
                Reset to default ({formatInterval(defaultOriginalInterval)})
              </button>
            )}

            <div className={styles.sheetActions}>
              <button className={styles.deleteBtn} onClick={handleDelete}>
                Delete
              </button>
              <button className={styles.cancelBtn} onClick={closeEdit}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSaveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
