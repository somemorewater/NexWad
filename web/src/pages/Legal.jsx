import Navbar from '../components/Navbar'

const termsSections = [
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

const privacySections = [
  {
    title: '1. Data We Collect',
    body: 'We collect email addresses, matric numbers, usernames, NIN (for sellers), uploaded IDs, chat history, and usage analytics.',
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

const cookiesSections = [
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

const retentionSections = [
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

function LegalBlock({ title, sections }) {
  return (
    <section className="legal-page__block">
      <h2 className="legal-page__block-title">{title}</h2>
      {sections.map((section) => (
        <section key={`${title}-${section.title}`} className="legal-page__section">
          <h3>{section.title}</h3>
          <p>{section.body}</p>
        </section>
      ))}
    </section>
  )
}

export default function Legal() {
  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-page__main">
        <div className="container legal-page__container">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">NexWAD Legal Policies</h1>
          <p className="legal-page__effective">Effective Date: February 26, 2026</p>

          <div className="legal-page__content card card-body">
            <LegalBlock title="Terms and Conditions" sections={termsSections} />
            <LegalBlock title="Privacy Policy" sections={privacySections} />
            <LegalBlock title="Cookies Policy" sections={cookiesSections} />
            <LegalBlock title="Data Retention Policy" sections={retentionSections} />
          </div>
        </div>
      </main>
    </div>
  )
}
