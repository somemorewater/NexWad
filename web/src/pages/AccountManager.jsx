import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { usersAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const LEVEL_OPTIONS = ['100', '200', '300', '400', '500']

export default function AccountManager() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('details')
  const [detailsForm, setDetailsForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    department: user?.department || '',
    level: user?.level || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmText: '',
  })
  const [savingDetails, setSavingDetails] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const setDetails = (key) => (e) => setDetailsForm((prev) => ({ ...prev, [key]: e.target.value }))
  const setPassword = (key) => (e) => setPasswordForm((prev) => ({ ...prev, [key]: e.target.value }))
  const setDelete = (key) => (e) => setDeleteForm((prev) => ({ ...prev, [key]: e.target.value }))

  const canSaveDetails = useMemo(() => {
    return Boolean(detailsForm.name?.trim()) && !savingDetails
  }, [detailsForm.name, savingDetails])

  const canChangePassword = useMemo(() => {
    return Boolean(
      passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordForm.confirmPassword &&
      !savingPassword
    )
  }, [passwordForm, savingPassword])

  const canDeleteAccount = useMemo(() => {
    return Boolean(deleteForm.password && deleteForm.confirmText === 'DELETE' && !deletingAccount)
  }, [deleteForm, deletingAccount])

  const exitToSettings = () => navigate('/profile/settings')

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const uploadAvatar = async () => {
    if (!avatarFile || uploadingAvatar) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('avatar', avatarFile)
      const { data } = await usersAPI.uploadAvatar(fd)
      updateUser(data.user)
      setAvatarFile(null)
      setAvatarPreview(data.user?.avatar || '')
      toast.success('Avatar updated')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveAccountDetails = async (e) => {
    e.preventDefault()
    if (!detailsForm.name?.trim()) {
      toast.error('Full name is required')
      return
    }
    setSavingDetails(true)
    try {
      const { data } = await usersAPI.updateProfile(detailsForm)
      updateUser(data.user)
      toast.success('Account details updated')
      exitToSettings()
    } catch (err) {
      toast.error(err?.message || 'Failed to update account details')
    } finally {
      setSavingDetails(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }
    setSavingPassword(true)
    try {
      await usersAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      exitToSettings()
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const deleteAccount = async (e) => {
    e.preventDefault()
    if (deleteForm.confirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm account deletion')
      return
    }
    setDeletingAccount(true)
    try {
      await usersAPI.deleteAccount({ password: deleteForm.password })
      toast.success('Account deleted')
      await logout()
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to delete account')
      setDeletingAccount(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Account Manager</h1>
            <p className="page-header__sub">Manage account details, password, and account lifecycle</p>
          </div>

          <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
            <button type="button" className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
              Account Details
            </button>
            <button type="button" className={`tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              Change Password
            </button>
            <button type="button" className={`tab ${activeTab === 'delete' ? 'active' : ''}`} onClick={() => setActiveTab('delete')}>
              Delete Account
            </button>
          </div>

          <div className="card card-body" style={{ maxWidth: 820 }}>
            {activeTab === 'details' && (
              <form onSubmit={saveAccountDetails} style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Profile Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div className="avatar avatar-lg" style={{ width: 72, height: 72, fontSize: '1.25rem' }}>
                      {avatarPreview
                        ? <img src={avatarPreview} alt="Avatar preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : (user?.name?.[0] || 'U')}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                        Choose Image
                        <input type="file" accept="image/*" hidden onChange={handleAvatarPick} />
                      </label>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={uploadAvatar}
                        disabled={!avatarFile || uploadingAvatar}
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                  <div className="form-hint">Square images work best. Max 5MB.</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={detailsForm.name} onChange={setDetails('name')} />
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={user?.email || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Matric Number</label>
                    <input className="form-input" value={user?.matricNumber || ''} readOnly />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={detailsForm.department} onChange={setDetails('department')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select className="form-select" value={detailsForm.level} onChange={setDetails('level')}>
                      <option value="">Select level</option>
                      {LEVEL_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}L</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={detailsForm.phone} onChange={setDetails('phone')} placeholder="+234..." />
                </div>

                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" rows={4} value={detailsForm.bio} onChange={setDetails('bio')} />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-primary" disabled={!canSaveDetails}>
                    {savingDetails ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={exitToSettings}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={changePassword} style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" value={passwordForm.currentPassword} onChange={setPassword('currentPassword')} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" value={passwordForm.newPassword} onChange={setPassword('newPassword')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" value={passwordForm.confirmPassword} onChange={setPassword('confirmPassword')} />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-primary" disabled={!canChangePassword}>
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={exitToSettings}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'delete' && (
              <form onSubmit={deleteAccount} style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <p style={{ color: 'var(--nw-red)', fontWeight: 600 }}>
                  This action is permanent and cannot be undone.
                </p>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" value={deleteForm.password} onChange={setDelete('password')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type DELETE to confirm</label>
                  <input className="form-input" value={deleteForm.confirmText} onChange={setDelete('confirmText')} placeholder="DELETE" />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-danger" disabled={!canDeleteAccount}>
                    {deletingAccount ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={exitToSettings}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
