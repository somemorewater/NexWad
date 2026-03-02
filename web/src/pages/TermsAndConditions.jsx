import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const sections = [
  {
    title: '1. Introduction',
    body: 'NexWAD is an independent student-built digital platform exclusively for students of the Air Force Institute of Technology (AFIT). By accessing or using NexWAD, you agree to comply with these Terms and Conditions.',
  },
  {
    title: '2. Eligibility',
    body: 'Access to NexWAD is restricted to currently enrolled AFIT students. Users must provide a valid matric number. If under 18, users confirm parental or guardian consent.',
  },
  {
    title: '3. Accounts',
    body: 'Users register as Buyers by default. Sellers must apply and receive admin approval. Payment does not guarantee Seller approval. Usernames must be unique. Users are responsible for account security.',
  },
  {
    title: '4. Marketplace',
    body: 'NexWAD facilitates listings of goods and services. NexWAD is not responsible for product quality, safety, legality, or delivery. Transactions occur directly between users. Pinning is a paid visibility feature and does not guarantee engagement or sales.',
  },
  {
    title: '5. Subscriptions & Payments',
    body: 'Seller subscriptions are valid for 30 days from approval. Expired subscriptions result in automatic listing visibility removal. Premium Buyer subscriptions are optional. Payments are processed via Paystack. No automatic refunds are provided. Admin may process manual refunds at sole discretion.',
  },
  {
    title: '6. Conduct & Misconduct',
    body: 'NexWAD reserves the right to suspend or revoke accounts, Seller status, or Premium privileges for misconduct, fraud, harassment, or system abuse. Revocation due to misconduct may occur without refund.',
  },
  {
    title: '7. Messaging & Content',
    body: 'Users are responsible for content shared on the platform and in private chats. NexWAD may review content when violations are reported.',
  },
  {
    title: '8. Lost & Found Disclaimer',
    body: 'NexWAD is not responsible for disputes or claims arising from Lost & Found posts.',
  },
  {
    title: '9. Moderation',
    body: 'Admins retain centralized moderation authority and may remove or override content without prior notice.',
  },
  {
    title: '10. Governing Law',
    body: 'These Terms are governed by the laws of the Federal Republic of Nigeria.',
  },
]

export default function TermsAndConditions() {
  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-page__main">
        <div className="container legal-page__container">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">NexWAD Terms and Conditions</h1>
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
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/cookies-policy">Cookies Policy</Link>
            <Link to="/data-retention-policy">Data Retention Policy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
