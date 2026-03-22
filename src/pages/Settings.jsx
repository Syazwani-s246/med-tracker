import { useState, useEffect } from 'react'
import { MEDICATIONS } from '../medications'
import {
  getMergedMedications,
  saveOverride,
  resetDefault,
  addCustomMedication,
  updateCustomMedication,
  deleteCustomMedication,
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
  const [editing, setEditing] = useState(null) // { name, interval, isDefault }
  const [editInterval, setEditInterval] = useState('')
  const [editName, setEditName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newInterval, setNewInterval] = useState('')
  const [addError, setAddError] = useState('')

  function reload() {
    setMeds(getMergedMedications())
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
  }

  function closeEdit() {
    setEditing(null)
    setEditInterval('')
    setEditName('')
  }

  function handleSaveEdit() {
    const interval = parseFloat(editInterval) || 0
    if (editing.isDefault) {
      saveOverride(editing.name, interval)
    } else {
      const trimmedName = editName.trim()
      if (!trimmedName) return
      updateCustomMedication(editing.name, trimmedName, interval)
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
    deleteCustomMedication(editing.name)
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
    addCustomMedication(trimmedName, interval)
    setNewName('')
    setNewInterval('')
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
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setShowAdd(false); setNewName(''); setNewInterval(''); setAddError('') }}
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

            {editing.isDefault && isOverridden && (
              <button className={styles.resetBtn} onClick={handleReset}>
                Reset to default ({formatInterval(defaultOriginalInterval)})
              </button>
            )}

            <div className={styles.sheetActions}>
              {!editing.isDefault && (
                <button className={styles.deleteBtn} onClick={handleDelete}>
                  Delete
                </button>
              )}
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
