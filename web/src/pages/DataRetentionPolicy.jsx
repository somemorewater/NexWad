import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const sections = [
  {
    title: '1. Retention Period',
    body: 'User account data is retained while the account remains active.',
  },
  {
    title: '2. Chat History',
    body: 'Chat history is stored permanently unless legally required otherwise.',
  },
  {
    title: '3. Seller Data',
    body: 'Seller verification data may be retained for compliance and fraud prevention.',
  },
  {
    title: '4. Account Deletion',
    body: 'Upon deletion request, personal data will be removed except where retention is required for legal, financial, or security purposes.',
  },
]

export default function DataRetentionPolicy() {
  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-page__main">
        <div className="container legal-page__container">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">NexWAD Data Retention Policy</h1>
          <p className="legal-page__effective">Effective Date: February 26, 2026</p>

          <div className="legal-page__content card card-body">
            {sections.map((section) => (
              <section key={section.title} className="legal-page__section">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>

          <div className="legal-page__links">
            <Link to="/terms-and-conditions">Terms and Conditions</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/cookies-policy">Cookies Policy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
