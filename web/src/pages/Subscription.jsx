import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { subscriptionsAPI } from '../api/endpoints'
import toast from 'react-hot-toast'

export default function Subscription() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [current, setCurrent] = useState(null)
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionPlan, setActionPlan] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: plansData }, { data: currentData }] = await Promise.all([
        subscriptionsAPI.getPlans(),
        subscriptionsAPI.getCurrent(),
      ])
      setPlans(plansData.plans || [])
      setCurrent(currentData.subscription || null)
      setApplication(currentData.application || null)
    } catch (err) {
      toast.error(err?.message || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const subscribe = async (planId) => {
    setActionPlan(planId)
    try {
      await subscriptionsAPI.subscribe(planId, {})
      toast.success('Subscription activated')
      await loadData()
    } catch (err) {
      toast.error(err?.message || 'Could not activate subscription')
    } finally {
      setActionPlan(null)
    }
  }

  const cancel = async () => {
    setActionPlan('cancel')
    try {
      await subscriptionsAPI.cancel()
      toast.success('Subscription cancelled')
      await loadData()
    } catch (err) {
      toast.error(err?.message || 'Could not cancel subscription')
    } finally {
      setActionPlan(null)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Subscription</h1>
            <p className="page-header__sub">Choose and manage your plan</p>
          </div>

          {current && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    Current Plan: {current.plan}
                  </div>
                  <div className="caption">
                    Expires {current.expiresAt ? new Date(current.expiresAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <button className="btn btn-danger" onClick={cancel} disabled={actionPlan === 'cancel'}>
                  {actionPlan === 'cancel' ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
              <div className="what-this-means">
                <strong>What this means:</strong> Your current plan benefits remain active until the expiry date shown above.
                Cancelling stops renewal and switches your account back after expiry.
              </div>
            </div>
          )}

          {application?.status === 'pending' && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontWeight: 700 }}>Seller Application Pending</div>
              <div className="caption">
                Plan: {application.plan} · Submitted: {new Date(application.createdAt).toLocaleDateString()} ·
                Your role remains Buyer until admin approval.
              </div>
              <div className="what-this-means">
                <strong>What this means:</strong> You have paid and submitted your application. You cannot post seller listings yet
                until approval is completed by admin.
              </div>
            </div>
          )}

          {loading ? (
            <div className="card card-body">Loading plans...</div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {plans.map((plan) => {
                const isCurrent = current?.plan === plan._id
                return (
                  <div key={plan._id} className="plan-card">
                    <div className="plan-card__name">{plan.name}</div>
                    <div className="plan-card__price">
                      <sub>{plan.currency === 'NGN' ? 'N' : ''}</sub>{plan.price?.toLocaleString?.() ?? plan.price}
                    </div>
                    <div className="plan-card__period">/{plan.durationDays} days</div>
                    <div className="plan-card__features">
                      {(plan.features || []).map((f) => (
                        <div key={f} className="plan-feature">{f}</div>
                      ))}
                    </div>
                    {plan.type === 'seller' ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          style={{ width: '100%' }}
                          onClick={() => navigate(`/profile/become-seller?plan=${plan._id}`)}
                        >
                          Apply as {plan.name}
                        </button>
                        <div className="what-this-means">
                          <strong>What this means:</strong> First-time seller access needs one approval. After approval, renewals/upgrades
                          are direct and may be prorated.
                        </div>
                      </>
                    ) : (
                      <button
                        className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ width: '100%' }}
                        disabled={isCurrent || actionPlan === plan._id}
                        onClick={() => subscribe(plan._id)}
                      >
                        {isCurrent ? 'Current Plan' : actionPlan === plan._id ? 'Processing...' : `Choose ${plan.name}`}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
