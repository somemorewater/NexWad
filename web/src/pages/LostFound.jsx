import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import { lostFoundAPI, pinsAPI } from '../api/endpoints'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { canPinContent, formatPinTimeLeft } from '../utils/pins'
import ReportActionMenu from '../components/ReportActionMenu'
import { LOST_FOUND_CATEGORIES, lostFoundCategoryIcon } from '../constants/categories'

const TABS = ['All', 'Lost', 'Found', 'Resolved']
const LOCATIONS = ['Main Building', 'Hostel A', 'Hostel B', 'Hostel C', 'Sports Complex', 'Library', 'Cafeteria', 'Car Park', 'Other']

export default function LostFound() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [showReport, setShowReport] = useState(false)
  const [reportType, setReportType] = useState('lost')

  useEffect(() => {
    lostFoundAPI.getAll({ type: activeTab === 'All' ? undefined : activeTab.toLowerCase() })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [activeTab])

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header-row" style={{ marginBottom: 'var(--space-6)' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', marginBottom: 4 }}>Lost &amp; Found</h1>
              <p style={{ color: 'var(--nw-gray-500)' }}>Help your fellow students recover their belongings</p>
            </div>
            {isAuthenticated && (
              <div className="page-header-actions" style={{ gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => { setReportType('found'); setShowReport(true) }}>
                  I Found Something
                </button>
                <button className="btn btn-primary" onClick={() => { setReportType('lost'); setShowReport(true) }}>
                  Report Lost Item
                </button>
              </div>
            )}
          </div>

          {!isAuthenticated && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-5)', color: 'var(--nw-gray-600)' }}>
              Browse public lost and found posts. Login to report or claim an item.
            </div>
          )}

          {items.some((item) => item.isPinned) && (
            <section className="pin-strip" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="pin-strip__header">
                <h2 className="pin-strip__title"><i className="fa-solid fa-thumbtack" aria-hidden="true" /> Pinned Lost &amp; Found</h2>
              </div>
              <div className="pin-strip__scroller">
                {items.filter((item) => item.isPinned).map((item) => (
                  <div key={`pin-${item._id}`} className="pin-strip__item">
                    <div className="pin-strip__thumb">
                      <i className={lostFoundCategoryIcon(item.category)} aria-hidden="true" />
                    </div>
                    <div className="pin-strip__content">
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                      <div className="caption">{item.type} · {formatPinTimeLeft(item.pin?.expiresAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
            {TABS.map(t => (
              <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-xl)' }} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ fontSize: '2rem' }}><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /></div>
              <div className="empty-state__title">Nothing here</div>
              <div className="empty-state__text">Be the first to report a lost or found item</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {items.map((item, i) => (
                <LFCard key={item._id} item={item} delay={i * 0.05} />
              ))}
            </div>
          )}
        </main>
      </div>

      {isAuthenticated && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          type={reportType}
          onCreated={item => setItems(prev => [item, ...prev])}
          locations={LOCATIONS}
        />
      )}
    </div>
  )
}

function LFCard({ item, delay }) {
  const { user, isAuthenticated } = useAuth()
  const [pinData, setPinData] = useState(item.pin || null)
  const [pinLoading, setPinLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', location: '', description: '', category: '' })
  const [deleting, setDeleting] = useState(false)
  const isLost = item.type === 'lost'
  const isResolved = item.status === 'resolved'
  const isPinned = Boolean(pinData && new Date(pinData.expiresAt).getTime() > Date.now())
  const isOwner = Boolean(user?._id && item.reporter?._id && user._id === item.reporter._id)
  const canPin = isOwner && canPinContent(user)
  const reportLostFound = async (reason) => {
    if (!isAuthenticated) throw new Error('Login required to report items')
    await lostFoundAPI.report(item._id, reason)
  }

  const togglePin = async () => {
    if (pinLoading) return
    if (!isAuthenticated) {
      toast.error('Login required')
      return
    }
    if (!canPin) {
      toast.error('Only sellers or premium users can pin their own content')
      return
    }

    setPinLoading(true)
    try {
      if (isPinned) {
        await pinsAPI.unpin(pinData._id)
        setPinData(null)
        toast.success('Unpinned')
      } else {
        const { data } = await pinsAPI.initialize({
          targetType: 'lostfound',
          targetId: item._id,
          units: 1,
        })
        setPinData(data?.pin || null)
        toast.success('Pinned for 24 hours')
      }
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not update pin')
    } finally {
      setPinLoading(false)
    }
  }

  const openEditModal = () => {
    if (!isOwner) return
    setEditForm({
      title: item.title || '',
      location: item.location || '',
      description: item.description || '',
      category: item.category || 'Other',
    })
    setShowEditModal(true)
  }

  const submitEdit = async () => {
    if (!isOwner || editing) return
    const nextTitle = String(editForm.title || '').trim()
    if (!nextTitle) {
      toast.error('Title is required')
      return
    }

    setEditing(true)
    try {
      const payload = {
        title: nextTitle,
        location: String(editForm.location || '').trim(),
        description: String(editForm.description || '').trim(),
        category: String(editForm.category || 'Other').trim(),
      }
      await lostFoundAPI.update(item._id, payload)
      toast.success('Report updated')
      setShowEditModal(false)
      window.location.reload()
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not update report')
    } finally {
      setEditing(false)
    }
  }

  const deleteReport = async () => {
    if (!isOwner || deleting) return
    if (!window.confirm('Delete this lost/found report?')) return
    setDeleting(true)
    try {
      await lostFoundAPI.delete(item._id)
      toast.success('Report deleted')
      window.location.reload()
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not delete report')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={`lf-card animate-fade-in ${isPinned ? 'pinned-card' : ''}`} style={{ animationDelay: `${delay}s` }}>
      <div className="lf-card__image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: isLost ? 'var(--nw-accent-light)' : 'var(--nw-green-light)' }}>
        <i className={lostFoundCategoryIcon(item.category)} aria-hidden="true" />
      </div>
      <div className="lf-card__content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div className={`lf-card__status lf-card__status--${isResolved ? 'found' : item.type}`}>
            {isResolved
              ? <><i className="fa-solid fa-check" aria-hidden="true" /> Resolved</>
              : isLost
                ? <><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Lost</>
                : <><i className="fa-solid fa-circle-dot" aria-hidden="true" /> Found</>}
          </div>
          <ReportActionMenu
            actions={isOwner ? [
              ...(!isResolved ? [{
                key: 'pin',
                label: isPinned ? 'Unpin' : 'Pin',
                onClick: () => togglePin(),
                disabled: pinLoading || !canPin,
              }] : []),
              {
                key: 'edit',
                label: 'Edit',
                onClick: () => openEditModal(),
                disabled: editing,
              },
              {
                key: 'delete',
                label: 'Delete',
                danger: true,
                onClick: () => deleteReport(),
                disabled: deleting,
              },
            ] : []}
            onReport={!isOwner ? reportLostFound : undefined}
            entityLabel="lost and found report"
            buttonClassName="post-card__menu-btn"
          />
        </div>
        {isPinned && (
          <div style={{ marginBottom: 6 }}>
            <span className="pin-badge" style={{ position: 'static' }}>
              <i className="fa-solid fa-thumbtack" aria-hidden="true" /> Pinned · {formatPinTimeLeft(pinData?.expiresAt)}
            </span>
          </div>
        )}
        <h3 className="lf-card__title">{item.title}</h3>
        <div className="caption" style={{ marginBottom: 6 }}>{item.category || 'Other'}</div>
        {item.description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--nw-gray-500)', marginBottom: 8 }}>{item.description}</p>
        )}
        <div className="lf-card__meta">
          {item.location && <span><i className="fa-solid fa-location-dot" aria-hidden="true" /> {item.location}</span>}
          <span><i className="fa-solid fa-clock" aria-hidden="true" /> {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
          <span>by {item.reporter?.name}</span>
        </div>
      </div>
      {!isResolved && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-primary btn-sm">Contact</button>
          {item.type === 'lost' && <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8125rem' }}>I Found It</button>}
        </div>
      )}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Report"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={editing}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={submitEdit} disabled={editing}>
              {editing ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        )}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input
              type="text"
              className="form-input"
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={editForm.location}
              onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={editForm.category}
              onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {LOST_FOUND_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ReportModal({ isOpen, onClose, type, onCreated, locations }) {
  const [form, setForm] = useState({ title: '', description: '', location: '', category: LOST_FOUND_CATEGORIES[0] })
  const [loading, setLoading] = useState(false)

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) { toast.error('Title is required'); return }
    setLoading(true)
    try {
      const payload = { ...form, type }
      const { data } = await lostFoundAPI.create(payload)
      toast.success(type === 'lost' ? 'Lost item reported!' : 'Found item reported!')
      onCreated?.(data.item)
      onClose()
      setForm({ title: '', description: '', location: '', category: LOST_FOUND_CATEGORIES[0] })
    } catch (err) {
      toast.error(err?.message || 'Failed to report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title={type === 'lost' ? 'Report Lost Item' : 'Report Found Item'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Submit Report'}
          </button>
        </>
      }
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label">Item Name *</label>
          <input type="text" className="form-input" placeholder="e.g. HP Laptop Charger" value={form.title} onChange={set('title')} />
        </div>
        <div className="form-group">
          <label className="form-label">Location {type === 'lost' ? 'Lost' : 'Found'}</label>
          <select className="form-select" value={form.location} onChange={set('location')}>
            <option value="">Select location</option>
            {locations.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Add identifying details to help verification..." value={form.description} onChange={set('description')} rows={3} />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={set('category')}>
            {LOST_FOUND_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  )
}
