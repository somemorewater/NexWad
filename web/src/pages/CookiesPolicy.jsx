import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const sections = [
  {
    title: '1. Use of Cookies',
    body: 'NexWAD uses cookies and similar technologies to maintain sessions, authenticate users, and improve platform performance.',
  },
  {
    title: '2. Types of Cookies',
    body: 'Session cookies for authentication and analytics cookies for usage statistics.',
  },
  {
    title: '3. Managing Cookies',
    body: 'Users may control cookies through their browser settings; however, disabling cookies may affect functionality.',
  },
]

export default function CookiesPolicy() {
  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-page__main">
        <div className="container legal-page__container">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">NexWAD Cookies Policy</h1>
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
            <Link to="/data-retention-policy">Data Retention Policy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
