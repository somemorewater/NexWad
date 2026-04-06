import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import { subscriptionsAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { normalizeRole } from '../utils/roleRouting'

const SELLER_PLANS = ['seller_basic', 'seller_pro', 'seller_elite']

export default function BecomeSeller() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [plans, setPlans] = useState([])
  const [application, setApplication] = useState(null)
  const [currentSub, setCurrentSub] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'seller_basic')
  const [form, setForm] = useState({
    fullName: '',
    storeName: '',
    idType: 'matric',
    idNumber: '',
    productDetails: '',
    phone: '',
    experience: '',
    reason: '',
    schoolIdImage: null,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paystackReady, setPaystackReady] = useState(false)
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [trialModalSeen, setTrialModalSeen] = useState(false)

  const selected = useMemo(
    () => plans.find(p => p._id === selectedPlan) || plans[0],
    [plans, selectedPlan]
  )
  const isAdminRole = ['admin', 'superadmin', 'super_admin', 'moderator', 'cs', 'developer'].includes(normalizeRole(user?.role))
  const paystackKey = String(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '').trim()
  const hasPriorSellerApproval = application?.status === 'approved'
  const freeTrialEnabled = String(import.meta.env.VITE_FREE_TRIAL_ENABLED ?? 'false').toLowerCase() === 'true'
  const freeTrialDuration = String(import.meta.env.VITE_FREE_TRIAL_DURATION ?? '2months')
  const isTrialPlan = !hasPriorSellerApproval && freeTrialEnabled && ['seller_basic', 'seller_pro'].includes(selectedPlan)

  const load = async () => {
    setLoading(true)
    try {
      const [plansResult, appResult, currentResult] = await Promise.allSettled([
        subscriptionsAPI.getPlans(),
        subscriptionsAPI.getMySellerApplication(),
        subscriptionsAPI.getCurrent(),
      ])
      const plansData = plansResult?.status === 'fulfilled' ? plansResult.value?.data : null
      const sellerPlans = (plansData?.plans || []).filter(p => SELLER_PLANS.includes(p._id))
      setPlans(sellerPlans)
      if (appResult?.status === 'fulfilled') {
        setApplication(appResult.value?.data?.application || null)
      } else {
        setApplication(null)
      }
      if (currentResult?.status === 'fulfilled') {
        setCurrentSub(currentResult.value?.data?.subscription || null)
      } else {
        setCurrentSub(null)
      }
      if (!sellerPlans.find(p => p._id === selectedPlan) && sellerPlans[0]) {
        setSelectedPlan(sellerPlans[0]._id)
      }
      if (appResult?.status === 'rejected') {
        toast('Could not load previous application status')
      }
      if (plansResult?.status === 'rejected') {
        toast.error('Could not load seller plans')
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

  useEffect(() => {
    if (loading || trialModalSeen) return
    if (freeTrialEnabled && !hasPriorSellerApproval) {
      setShowTrialModal(true)
      setTrialModalSeen(true)
    }
  }, [loading, freeTrialEnabled, hasPriorSellerApproval, trialModalSeen])

  const submitApplication = async (paymentReference) => {
    if (!selected?._id) return
    if (!form.fullName.trim() || !form.storeName.trim() || !form.idNumber.trim() || !form.productDetails.trim() || !form.phone.trim() || !form.schoolIdImage) {
      toast.error('Please fill all required fields')
      return
    }
    if (!isTrialPlan && !paymentReference) {
      toast.error('Payment reference missing')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('planId', selected._id)
      fd.append('fullName', form.fullName.trim())
      fd.append('storeName', form.storeName.trim())
      fd.append('idType', form.idType)
      fd.append('idNumber', form.idNumber.trim())
      fd.append('productDetails', form.productDetails.trim())
      fd.append('phone', form.phone.trim())
      fd.append('experience', form.experience.trim())
      fd.append('reason', form.reason.trim())
      if (paymentReference) fd.append('paymentReference', paymentReference)
      fd.append('schoolIdImage', form.schoolIdImage)

      await subscriptionsAPI.applySeller(fd)
      toast.success('Application submitted. Awaiting admin approval.')
      setForm({
        fullName: '',
        storeName: '',
        idType: 'matric',
        idNumber: '',
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

  const activateSellerSubscription = async (paymentReference) => {
    if (!selected?._id) return
    setSubmitting(true)
    try {
      await subscriptionsAPI.subscribe(selected._id, { paymentReference })
      toast.success('Seller subscription activated successfully')
      await load()
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not activate seller subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const proceedToPayment = () => {
    if (!selected?._id) return
    if (isTrialPlan) {
      submitApplication()
      return
    }
    if (!paystackReady || !window.PaystackPop) {
      toast.error('Payment gateway not ready yet')
      return
    }
    if (!paystackKey) {
      toast.error('Paystack public key is missing (VITE_PAYSTACK_PUBLIC_KEY)')
      return
    }
    if (!hasPriorSellerApproval && (!form.fullName.trim() || !form.storeName.trim() || !form.idNumber.trim() || !form.productDetails.trim() || !form.phone.trim() || !form.schoolIdImage)) {
      toast.error('Please fill all required fields before payment')
      return
    }
    if (hasPriorSellerApproval && amountToPay <= 0) {
      activateSellerSubscription()
      return
    }

    try {
      const paystackAmountKobo = Math.round(Number(amountToPay || selected.price || 0) * 100)
      if (!Number.isFinite(paystackAmountKobo) || paystackAmountKobo <= 0) {
        toast.error('Invalid plan amount. Please reload and try again.')
        return
      }

      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: user?.email || 'customer@nexwad.app',
        amount: paystackAmountKobo,
        currency: 'NGN',
        metadata: {
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: selected._id },
            { display_name: 'Applicant', variable_name: 'full_name', value: form.fullName.trim() },
            { display_name: 'ID Type', variable_name: 'id_type', value: form.idType },
            { display_name: 'ID Number', variable_name: 'id_number', value: form.idNumber.trim() },
          ],
        },
        callback: (response) => {
          if (!response?.reference) {
            toast.error('Payment reference missing')
            return
          }
          if (hasPriorSellerApproval) activateSellerSubscription(response.reference)
          else submitApplication(response.reference)
        },
        onClose: () => {
          toast('Payment window closed')
        },
      })

      handler.openIframe()
    } catch (err) {
      toast.error(err?.message || 'Could not start payment. Try refreshing.')
    }
  }

  const missingRequired = !hasPriorSellerApproval && (!form.fullName.trim() || !form.storeName.trim() || !form.idNumber.trim() || !form.productDetails.trim() || !form.phone.trim() || !form.schoolIdImage)
  const amountToPay = useMemo(() => {
    if (!selected) return 0
    if (!hasPriorSellerApproval && freeTrialEnabled && ['seller_basic', 'seller_pro'].includes(selected._id)) return 0
    if (!hasPriorSellerApproval) return Number(selected.price || 0)

    const isActiveSellerSub = currentSub?.status === 'active' && ['seller_basic', 'seller_pro', 'seller_elite'].includes(currentSub?.plan)
    if (!isActiveSellerSub) return Number(selected.price || 0)

    const currentPlan = plans.find(p => p._id === currentSub.plan)
    if (!currentPlan) return Number(selected.price || 0)

    const targetPrice = Number(selected.price || 0)
    const currentPrice = Number(currentPlan.price || 0)
    if (!Number.isFinite(targetPrice) || !Number.isFinite(currentPrice)) return Number(selected.price || 0)
    if (targetPrice <= currentPrice) return 0

    const currentExpiryMs = new Date(currentSub.expiresAt).getTime()
    if (!Number.isFinite(currentExpiryMs)) return targetPrice
    const remainingMs = currentExpiryMs - Date.now()
    if (remainingMs <= 0) return targetPrice

    const currentDurationMs = Math.max(1, Number(currentPlan.durationDays || 30)) * 24 * 60 * 60 * 1000
    const remainingRatio = Math.max(0, Math.min(1, remainingMs / currentDurationMs))
    return Math.max(0, Math.round((targetPrice - currentPrice) * remainingRatio))
  }, [selected, hasPriorSellerApproval, currentSub, plans])
  const actionDisabled = !selected || submitting || application?.status === 'pending' || loading || isAdminRole
  const actionDisabledReason = isAdminRole
    ? 'Admin roles cannot apply for seller plans.'
    : application?.status === 'pending'
      ? 'You already have a pending seller application.'
      : !selected
        ? 'No seller plan available. Reload and try again.'
          : loading
            ? 'Loading seller plans...'
            : missingRequired
              ? (freeTrialEnabled ? 'Complete all required fields before submission.' : 'Complete all required fields before payment.')
              : ''

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Become a Seller</h1>
            <p className="page-header__sub">
              {freeTrialEnabled
                ? 'Choose a seller tier and submit for admin approval. Eligible tiers start with a free trial.'
                : 'Choose a seller tier, pay, and submit for admin approval.'}
            </p>
          </div>

          {freeTrialEnabled && !hasPriorSellerApproval && (
            <div
              className="card card-body"
              style={{
                marginBottom: 'var(--space-6)',
                border: '1px solid var(--nw-primary)',
                background: 'var(--nw-primary-light)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div>
                  <div className="badge badge-primary" style={{ marginBottom: 8 }}>Free Trial</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    Start selling with a free {freeTrialDuration} trial on eligible tiers.
                  </div>
                  <div className="caption" style={{ marginTop: 6 }}>
                    Submit your application today and your trial begins after admin approval.
                  </div>
                </div>
                <div>
                  <button type="button" className="btn btn-primary" onClick={() => setShowTrialModal(true)}>
                    See trial details
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAdminRole && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontWeight: 700 }}>Seller Application Unavailable</div>
              <div className="caption">Admin roles are not allowed to apply for seller plans.</div>
            </div>
          )}
          {application?.status === 'pending' && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontWeight: 700 }}>Application Pending Approval</div>
              <div className="caption">
                Plan: {application.plan} · Submitted: {new Date(application.createdAt).toLocaleDateString()}
              </div>
              <div className="what-this-means">
                <strong>What this means:</strong> Your payment and documents are received. You remain a buyer until admin approves this application.
              </div>
            </div>
          )}

          {hasPriorSellerApproval && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontWeight: 700 }}>Seller Approval Already Granted</div>
              <div className="caption">
                You can renew or upgrade seller plans directly. No additional approval is required.
              </div>
              <div className="caption" style={{ marginTop: 4 }}>
                {amountToPay > 0
                  ? `Prorated amount due: ₦${amountToPay.toLocaleString()}`
                  : 'No additional charge for this plan switch.'}
              </div>
              <div className="what-this-means">
                <strong>What this means:</strong> If you still have active seller time, you only pay the remaining price difference when upgrading.
              </div>
            </div>
          )}

          {loading ? (
            <div className="card card-body">Loading seller plans...</div>
          ) : null}

          <div className="card card-body" style={{ maxWidth: 720 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Seller Application Form</div>
            <div className="caption" style={{ marginBottom: 'var(--space-4)' }}>
              {hasPriorSellerApproval
                ? 'You already have seller approval. Select a tier and proceed to payment to renew or upgrade.'
                : freeTrialEnabled
                  ? `Complete this form and submit for approval. Eligible tiers start with a free ${freeTrialDuration} trial.`
                  : 'Complete this form, select tier, then proceed to Paystack payment. Your account remains Buyer until admin approval.'}
            </div>
            {!hasPriorSellerApproval && (
              <>
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
                {freeTrialEnabled && ['seller_basic', 'seller_pro'].includes(selectedPlan) && (
                  <span> · Free {freeTrialDuration} trial</span>
                )}
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
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">ID Type *</label>
                <select
                  className="form-select"
                  value={form.idType}
                  onChange={(e) => setForm(prev => ({ ...prev, idType: e.target.value }))}
                >
                  <option value="matric">Matric No</option>
                  <option value="nin">NIN</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Matric No or NIN *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.idNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, idNumber: e.target.value }))}
                  placeholder={form.idType === 'matric' ? 'e.g. U24PH1025' : '11-digit NIN'}
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
              <label className="form-label">{form.idType === 'matric' ? 'School ID Picture *' : 'National ID Picture *'}</label>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                onChange={(e) => setForm(prev => ({ ...prev, schoolIdImage: e.target.files?.[0] || null }))}
              />
              {form.schoolIdImage && <div className="caption">Selected: {form.schoolIdImage.name}</div>}
            </div>
              </>
            )}
            {hasPriorSellerApproval && (
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
              </div>
            )}
            <button
              className="btn btn-primary"
              onClick={proceedToPayment}
              disabled={actionDisabled}
            >
              {application?.status === 'pending'
                ? 'Application Pending'
                : submitting
                  ? (hasPriorSellerApproval ? 'Activating Subscription...' : 'Submitting Application...')
                  : hasPriorSellerApproval
                    ? amountToPay > 0
                      ? `Pay & Activate Plan (₦${amountToPay.toLocaleString()})`
                      : 'Activate Plan (No Charge)'
                    : (freeTrialEnabled && ['seller_basic', 'seller_pro'].includes(selectedPlan))
                      ? `Start Free Trial (${freeTrialDuration})`
                      : `Proceed to Payment (₦${selected?.price?.toLocaleString() || 0})`}
            </button>
            {actionDisabledReason && (
              <div className="caption" style={{ marginTop: 8 }}>
                {actionDisabledReason}
              </div>
            )}
            {!actionDisabledReason && (
              <div className="what-this-means">
                <strong>What this means:</strong> {freeTrialEnabled && ['seller_basic', 'seller_pro'].includes(selectedPlan)
                  ? 'Your application will be submitted for approval and, once approved, your free trial begins.'
                  : 'Clicking this button opens secure payment. After successful payment, your subscription is activated immediately or your application is submitted for approval.'}
              </div>
            )}
          </div>
        </main>
      </div>
      {freeTrialEnabled && (
        <Modal
          isOpen={showTrialModal}
          onClose={() => setShowTrialModal(false)}
          title="Your Free Trial Details"
          size="lg"
          footer={(
            <button type="button" className="btn btn-primary" onClick={() => setShowTrialModal(false)}>
              Got it
            </button>
          )}
        >
          <div style={{ marginBottom: 'var(--space-4)' }}>
            You can start selling with a free trial before paying for a subscription. Here is how it works:
          </div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            <li>Eligible tiers: Seller Basic and Seller Pro.</li>
            <li>Trial length: {freeTrialDuration}.</li>
            <li>No payment is required to submit your application for eligible tiers.</li>
            <li>Your trial begins after admin approval.</li>
            <li>Seller Elite is not part of the free trial and requires payment.</li>
          </ul>
          <div className="what-this-means" style={{ marginTop: 'var(--space-4)' }}>
            <strong>Tip:</strong> Complete all required fields and upload a clear ID image to speed up approval.
          </div>
        </Modal>
      )}
    </div>
  )
}
