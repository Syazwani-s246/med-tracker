import { useState, useEffect } from 'react'
import {
  getMergedMedications,
  saveOverride,
  addCustomMedication,
  updateCustomMedication,
  deleteCustomMedication,
  deleteDefaultMedication,
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getPrescribed,
  setPrescribed,
} from '../medicationStore'
import styles from './Settings.module.css'

function formatCourseDate(dateStr) {
  if (!dateStr) return 'Ongoing'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function coursesOverlap(courses, startDate, endDate, excludeId = null) {
  const sDate = new Date(startDate)
  const eDate = endDate ? new Date(endDate) : null
  for (const c of courses) {
    if (c.id === excludeId) continue
    const cStart = new Date(c.startDate)
    const cEnd = c.endDate ? new Date(c.endDate) : null
    // check overlap: two ranges overlap if one starts before the other ends
    const aEnd = eDate || new Date('9999-12-31')
    const bEnd = cEnd || new Date('9999-12-31')
    if (sDate <= bEnd && aEnd >= cStart) return true
  }
  return false
}

function formatInterval(interval) {
  if (!interval) return 'No interval set'
  return `${interval} hour${interval !== 1 ? 's' : ''}`
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
  const [newPrescribed, setNewPrescribed] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Course state
  const [courses, setCourses] = useState([])
  const [courseForm, setCourseForm] = useState(null) // null | { mode: 'add' } | { mode: 'edit', id }
  const [courseFormDose, setCourseFormDose] = useState('')
  const [courseFormStart, setCourseFormStart] = useState('')
  const [courseFormEnd, setCourseFormEnd] = useState('')
  const [courseFormNotes, setCourseFormNotes] = useState('')
  const [courseFormError, setCourseFormError] = useState('')
  const [courseDeleteConfirm, setCourseDeleteConfirm] = useState(null) // courseId
  const [editPrescribed, setEditPrescribed] = useState(false)

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
    setEditIngredients(med.ingredients || [])
    setEditIngredientInput('')
    setCourses(getCourses(med.name))
    setCourseForm(null)
    setCourseFormError('')
    setCourseDeleteConfirm(null)
    setEditPrescribed(getPrescribed(med.name))
  }

  function closeEdit() {
    setEditing(null)
    setEditInterval('')
    setEditName('')
    setEditIngredients([])
    setEditIngredientInput('')
    setCourses([])
    setCourseForm(null)
    setCourseFormError('')
    setCourseDeleteConfirm(null)
    setShowDeleteConfirm(false)
  }

  function openCourseAdd() {
    setCourseForm({ mode: 'add' })
    setCourseFormDose('')
    setCourseFormStart('')
    setCourseFormEnd('')
    setCourseFormNotes('')
    setCourseFormError('')
  }

  function openCourseEdit(course) {
    setCourseForm({ mode: 'edit', id: course.id })
    setCourseFormDose(course.dose)
    setCourseFormStart(course.startDate)
    setCourseFormEnd(course.endDate || '')
    setCourseFormNotes(course.notes || '')
    setCourseFormError('')
  }

  function cancelCourseForm() {
    setCourseForm(null)
    setCourseFormError('')
  }

  function saveCourseForm() {
    if (!courseFormStart) {
      setCourseFormError('Start date is required.')
      return
    }
    if (courseFormEnd && courseFormEnd <= courseFormStart) {
      setCourseFormError('End date must be after start date.')
      return
    }
    const excludeId = courseForm.mode === 'edit' ? courseForm.id : null
    if (coursesOverlap(courses, courseFormStart, courseFormEnd || null, excludeId)) {
      setCourseFormError('This overlaps with another course. Please check the dates.')
      return
    }
    const payload = {
      dose: courseFormDose.trim(),
      startDate: courseFormStart,
      endDate: courseFormEnd || null,
      notes: courseFormNotes.trim(),
    }
    if (courseForm.mode === 'add') {
      addCourse(editing.name, payload)
    } else {
      updateCourse(editing.name, courseForm.id, payload)
    }
    setCourses(getCourses(editing.name))
    setCourseForm(null)
    setCourseFormError('')
  }

  function confirmDeleteCourse() {
    deleteCourse(editing.name, courseDeleteConfirm)
    setCourses(getCourses(editing.name))
    setCourseDeleteConfirm(null)
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
    let savedName = editing.name
    if (editing.isDefault) {
      saveOverride(editing.name, interval, finalIngredients)
    } else {
      const trimmedName = editName.trim()
      if (!trimmedName) return
      updateCustomMedication(editing.name, trimmedName, interval, finalIngredients)
      savedName = trimmedName
    }
    setPrescribed(savedName, editPrescribed)
    closeEdit()
    reload()
  }

  function handleDelete() {
    setShowDeleteConfirm(true)
  }

  function confirmDelete() {
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
    addCustomMedication(trimmedName, interval, finalIngredients, newPrescribed)
    setNewName('')
    setNewInterval('')
    setNewIngredients([])
    setNewIngredientInput('')
    setAddError('')
    setNewPrescribed(false)
    setShowAdd(false)
    reload()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </header>

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
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Daily / Prescribed</label>
              <button
                type="button"
                className={`${styles.togglePill} ${newPrescribed ? styles.togglePillOn : ''}`}
                onClick={() => setNewPrescribed((v) => !v)}
              >
                {newPrescribed ? 'Yes' : 'No'}
              </button>
              <p className={styles.fieldHint}>Turn this on if your doctor has assigned this as a regular medication</p>
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setShowAdd(false); setNewName(''); setNewInterval(''); setNewIngredients([]); setNewIngredientInput(''); setAddError(''); setNewPrescribed(false) }}
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

            {/* Prescribed toggle */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Prescribed</label>
              <button
                type="button"
                className={`${styles.togglePill} ${editPrescribed ? styles.togglePillOn : ''}`}
                onClick={() => setEditPrescribed((v) => !v)}
              >
                {editPrescribed ? 'Yes' : 'No'}
              </button>
            </div>

            {/* Courses section */}
            <div className={styles.coursesSection}>
              <p className={styles.coursesSectionLabel}>Courses</p>

              {courses.length > 0 && (
                <div className={styles.courseList}>
                  {courses.map((c) => (
                    <div key={c.id} className={styles.courseRow}>
                      <div className={styles.courseInfo}>
                        <span className={styles.courseDose}>{c.dose || 'No dose set'}</span>
                        <span className={styles.courseDates}>
                          {formatCourseDate(c.startDate)} – {c.endDate ? formatCourseDate(c.endDate) : 'Ongoing'}
                        </span>
                        {c.notes ? <span className={styles.courseNotes}>{c.notes}</span> : null}
                      </div>
                      <div className={styles.courseActions}>
                        <button
                          type="button"
                          className={styles.courseIconBtn}
                          onClick={() => openCourseEdit(c)}
                          aria-label="Edit course"
                        >✏️</button>
                        <button
                          type="button"
                          className={styles.courseIconBtn}
                          onClick={() => setCourseDeleteConfirm(c.id)}
                          aria-label="Delete course"
                        >🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {courseDeleteConfirm && (
                <div className={styles.courseConfirm}>
                  <p className={styles.courseConfirmMsg}>Remove this course?</p>
                  <div className={styles.courseConfirmActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setCourseDeleteConfirm(null)}>Cancel</button>
                    <button type="button" className={`${styles.saveBtn} ${styles.deleteSaveBtn}`} onClick={confirmDeleteCourse}>Remove</button>
                  </div>
                </div>
              )}

              {courseForm ? (
                <div className={styles.courseFormWrap}>
                  <p className={styles.courseFormTitle}>{courseForm.mode === 'add' ? 'Add Course' : 'Edit Course'}</p>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Dose <span className={styles.optional}>(optional)</span></label>
                    <input
                      className={styles.input}
                      type="text"
                      value={courseFormDose}
                      onChange={(e) => setCourseFormDose(e.target.value)}
                      placeholder="e.g. 50mg, 1 tablet"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Start Date</label>
                    <input
                      className={styles.input}
                      type="date"
                      value={courseFormStart}
                      onChange={(e) => { setCourseFormStart(e.target.value); setCourseFormError('') }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>End Date <span className={styles.optional}>(leave blank if still ongoing)</span></label>
                    <input
                      className={styles.input}
                      type="date"
                      value={courseFormEnd}
                      onChange={(e) => { setCourseFormEnd(e.target.value); setCourseFormError('') }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Notes <span className={styles.optional}>(optional)</span></label>
                    <input
                      className={styles.input}
                      type="text"
                      value={courseFormNotes}
                      onChange={(e) => setCourseFormNotes(e.target.value)}
                      placeholder="e.g. prescribed by Dr. Amir"
                    />
                  </div>
                  {courseFormError && <p className={styles.error}>{courseFormError}</p>}
                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={cancelCourseForm}>Cancel</button>
                    <button type="button" className={styles.saveBtn} onClick={saveCourseForm}>Save</button>
                  </div>
                </div>
              ) : (
                !courseDeleteConfirm && (
                  <button type="button" className={styles.addCourseBtn} onClick={openCourseAdd}>
                    + Add Course
                  </button>
                )
              )}
            </div>

            {showDeleteConfirm ? (
              <div className={styles.deleteConfirm}>
                <p className={styles.deleteConfirmMsg}>Remove {editing.name} from your list?</p>
                <div className={styles.sheetActions}>
                  <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </button>
                  <button className={`${styles.saveBtn} ${styles.deleteSaveBtn}`} onClick={confirmDelete}>
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}
