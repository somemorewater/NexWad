import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const sections = [
  {
    title: '1. Data We Collect',
    body: 'We collect email addresses, matric numbers, usernames, ID numbers (for sellers), uploaded IDs, chat history, and usage analytics.',
  },
  {
    title: '2. Purpose of Data Collection',
    body: 'Data is collected for account verification, security, platform functionality, analytics, and fraud prevention.',
  },
  {
    title: '3. Data Sharing',
    body: 'NexWAD does not sell personal data. Data may be shared with payment processors (Paystack) strictly for transaction processing.',
  },
  {
    title: '4. Data Security',
    body: 'Sensitive data is stored securely with restricted admin access. Authentication is protected using JWT and OTP verification.',
  },
  {
    title: '5. User Rights',
    body: 'Users may request account deletion. Certain records may be retained for legal or security reasons.',
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-page__main">
        <div className="container legal-page__container">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">NexWAD Privacy Policy</h1>
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
            <Link to="/cookies-policy">Cookies Policy</Link>
            <Link to="/data-retention-policy">Data Retention Policy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
