import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { subscriptionsAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const SELLER_PLANS = ['seller_basic', 'seller_pro', 'seller_elite']

export default function BecomeSeller() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [plans, setPlans] = useState([])
  const [application, setApplication] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'seller_basic')
  const [form, setForm] = useState({
    fullName: '',
    storeName: '',
    nin: '',
    productDetails: '',
    phone: '',
    experience: '',
    reason: '',
    schoolIdImage: null,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paystackReady, setPaystackReady] = useState(false)

  const selected = useMemo(
    () => plans.find(p => p._id === selectedPlan) || plans[0],
    [plans, selectedPlan]
  )

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: plansData }, { data: appData }] = await Promise.all([
        subscriptionsAPI.getPlans(),
        subscriptionsAPI.getMySellerApplication(),
      ])
      const sellerPlans = (plansData.plans || []).filter(p => SELLER_PLANS.includes(p._id))
      setPlans(sellerPlans)
      setApplication(appData.application || null)
      if (!sellerPlans.find(p => p._id === selectedPlan) && sellerPlans[0]) {
        setSelectedPlan(sellerPlans[0]._id)
      }
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to load seller plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (window.PaystackPop) {
      setPaystackReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => setPaystackReady(true)
    script.onerror = () => toast.error('Could not load payment gateway')
    document.body.appendChild(script)
    return () => {
      script.remove()
    }
  }, [])

  useEffect(() => {
    if (selectedPlan) setSearchParams({ plan: selectedPlan })
  }, [selectedPlan, setSearchParams])

  const submitApplication = async (paymentReference) => {
    if (!selected?._id) return
    if (!form.fullName.trim() || !form.storeName.trim() || !form.nin.trim() || !form.productDetails.trim() || !form.phone.trim() || !paymentReference || !form.schoolIdImage) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('planId', selected._id)
      fd.append('fullName', form.fullName.trim())
      fd.append('storeName', form.storeName.trim())
      fd.append('nin', form.nin.trim())
      fd.append('productDetails', form.productDetails.trim())
      fd.append('phone', form.phone.trim())
      fd.append('experience', form.experience.trim())
      fd.append('reason', form.reason.trim())
      fd.append('paymentReference', paymentReference)
      fd.append('schoolIdImage', form.schoolIdImage)

      await subscriptionsAPI.applySeller(fd)
      toast.success('Application submitted. Awaiting admin approval.')
      setForm({
        fullName: '',
        storeName: '',
        nin: '',
        productDetails: '',
        phone: '',
        experience: '',
        reason: '',
        schoolIdImage: null,
      })
      await load()
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const proceedToPayment = () => {
    if (!selected?._id) return
    if (!paystackReady || !window.PaystackPop) {
      toast.error('Payment gateway not ready yet')
      return
    }
    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      toast.error('Paystack public key is missing (VITE_PAYSTACK_PUBLIC_KEY)')
      return
    }
    if (!form.fullName.trim() || !form.storeName.trim() || !form.nin.trim() || !form.productDetails.trim() || !form.phone.trim() || !form.schoolIdImage) {
      toast.error('Please fill all required fields before payment')
      return
    }

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user?.email || 'customer@nexwad.app',
      amount: Math.round(Number(selected.price || 0) * 100),
      currency: 'NGN',
      metadata: {
        custom_fields: [
          { display_name: 'Plan', variable_name: 'plan', value: selected._id },
          { display_name: 'Applicant', variable_name: 'full_name', value: form.fullName.trim() },
          { display_name: 'NIN', variable_name: 'nin', value: form.nin.trim() },
        ],
      },
      callback: async (response) => {
        if (!response?.reference) {
          toast.error('Payment reference missing')
          return
        }
        await submitApplication(response.reference)
      },
      onClose: () => {
        toast('Payment window closed')
      },
    })

    handler.openIframe()
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Become a Seller</h1>
            <p className="page-header__sub">Choose a seller tier, pay, and submit for admin approval.</p>
          </div>

          {application?.status === 'pending' && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontWeight: 700 }}>Application Pending Approval</div>
              <div className="caption">
                Plan: {application.plan} · Submitted: {new Date(application.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {loading ? (
            <div className="card card-body">Loading seller plans...</div>
          ) : null}

          <div className="card card-body" style={{ maxWidth: 720 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Seller Application Form</div>
            <div className="caption" style={{ marginBottom: 'var(--space-4)' }}>
              Complete this form, select tier, then proceed to Paystack payment. Your account remains Buyer until admin approval.
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Seller Tier *</label>
              <select
                className="form-select"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                {plans.map(plan => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} - ₦{plan.price?.toLocaleString()}/30 days
                  </option>
                ))}
              </select>
              <div className="caption" style={{ marginTop: 6 }}>
                {selected?.features?.slice(0, 2).join(' • ')}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={form.fullName}
                onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Your legal full name"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Store Name *</label>
              <input
                type="text"
                className="form-input"
                value={form.storeName}
                onChange={(e) => setForm(prev => ({ ...prev, storeName: e.target.value }))}
                placeholder="e.g. Musa Gadgets"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">NIN *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.nin}
                  onChange={(e) => setForm(prev => ({ ...prev, nin: e.target.value }))}
                  placeholder="11-digit NIN"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234..."
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Product Details *</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={form.productDetails}
                onChange={(e) => setForm(prev => ({ ...prev, productDetails: e.target.value }))}
                placeholder="Describe the products you plan to sell, typical price range, and supply source."
              />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Selling Experience</label>
              <input
                type="text"
                className="form-input"
                value={form.experience}
                onChange={(e) => setForm(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="e.g. 2 years selling online"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Why do you want to become a seller? *</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={form.reason}
                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Tell us about your products and why you should be approved."
              />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">School ID Picture *</label>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                onChange={(e) => setForm(prev => ({ ...prev, schoolIdImage: e.target.files?.[0] || null }))}
              />
              {form.schoolIdImage && <div className="caption">Selected: {form.schoolIdImage.name}</div>}
            </div>
            <button
              className="btn btn-primary"
              onClick={proceedToPayment}
              disabled={!selected || submitting || application?.status === 'pending'}
            >
              {application?.status === 'pending'
                ? 'Application Pending'
                : submitting
                  ? 'Submitting Application...'
                  : `Proceed to Payment (₦${selected?.price?.toLocaleString() || 0})`}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
