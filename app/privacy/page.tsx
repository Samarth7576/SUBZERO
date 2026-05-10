import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — SUBZERO",
  description: "How SUBZERO collects, uses, and protects your data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Nav */}
      <nav className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white text-lg">❄️</span>
          </div>
          <span className="text-lg font-bold tracking-tighter text-slate-900 uppercase">Subzero</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
          ← Back to home
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: May 2025</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-10">

          <Section title="1. Who We Are">
            <p>
              SUBZERO ("we", "our", or "us") is a subscription management service that helps you identify
              and cancel unwanted recurring charges. We are accessible at{" "}
              <span className="font-medium text-slate-700">subzero-delta.vercel.app</span>.
            </p>
          </Section>

          <Section title="2. What Data We Collect">
            <Subsection title="2.1 Google Account Information">
              <p>When you sign in with Google, we receive:</p>
              <ul>
                <li>Your name</li>
                <li>Your email address</li>
                <li>Your Google profile picture</li>
              </ul>
              <p>We use this solely to create and identify your account.</p>
            </Subsection>

            <Subsection title="2.2 Gmail Data (optional)">
              <p>
                If you choose to connect your Gmail inbox, we request read-only access
                (<code>gmail.readonly</code>) to scan for subscription-related emails such as
                receipts, renewal notices, and billing confirmations.
              </p>
              <p>
                <strong>We never read personal emails.</strong> We only process messages
                matching subscription-related patterns (e.g. subject lines containing "receipt",
                "invoice", "subscription", "renewal").
              </p>
              <p>We do not store the content of your emails. We only extract:</p>
              <ul>
                <li>Merchant name</li>
                <li>Charge amount and currency</li>
                <li>Billing date</li>
              </ul>
            </Subsection>

            <Subsection title="2.3 Usage Data">
              <p>
                We collect standard server logs (IP address, browser type, pages visited) for
                security and debugging purposes. This data is not sold or shared with advertisers.
              </p>
            </Subsection>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul>
              <li>To authenticate you and maintain your session</li>
              <li>To scan your Gmail for subscription charges on your behalf</li>
              <li>To display your subscriptions in your SUBZERO dashboard</li>
              <li>To improve the accuracy of our subscription detection</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your data, use it for advertising, or share it
              with third parties except as described in Section 5.
            </p>
          </Section>

          <Section title="4. How We Store and Protect Your Data">
            <p>
              All data is stored in a secure PostgreSQL database hosted on{" "}
              <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Neon
              </a>{" "}
              with TLS encryption in transit.
            </p>
            <p>
              OAuth tokens (your Gmail access credentials) are encrypted at rest using
              AES-256-CBC encryption with a unique per-user key. Raw tokens are never logged
              or exposed in plaintext.
            </p>
            <p>
              We follow industry-standard security practices and conduct regular reviews of
              our data handling procedures.
            </p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>We use the following third-party services:</p>
            <ul>
              <li>
                <strong>Google OAuth & Gmail API</strong> — for authentication and inbox access.
                Governed by{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Google's Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Vercel</strong> — for application hosting. Governed by{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Vercel's Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Neon</strong> — for database hosting. Governed by{" "}
                <a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Neon's Privacy Policy
                </a>.
              </li>
            </ul>
            <p>
              Our use of Google APIs complies with the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </Section>

          <Section title="6. Google API Limited Use Disclosure">
            <p>
              SUBZERO's use of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Specifically:
            </p>
            <ul>
              <li>We only use Gmail data to provide the subscription-detection feature within SUBZERO.</li>
              <li>We do not use Gmail data for advertising or to train AI/ML models.</li>
              <li>We do not share Gmail data with any third party except as necessary to operate the service.</li>
              <li>We do not allow humans to read your Gmail messages.</li>
            </ul>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We retain your account data and extracted subscription records for as long as your
              account is active. If you delete your account, we permanently delete all associated
              data within 30 days.
            </p>
            <p>
              Gmail OAuth tokens are revoked and deleted immediately upon disconnecting your Gmail
              account or deleting your SUBZERO account.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and all associated data</li>
              <li>Disconnect your Gmail at any time from your dashboard settings</li>
              <li>Revoke Google OAuth access via your{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Google Account permissions
                </a>
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact us at the email below.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              SUBZERO is not directed at children under 13. We do not knowingly collect personal
              data from children. If you believe a child has provided us with their data, please
              contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by updating the "Last updated" date at the top of this page. Continued use of
              SUBZERO after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have any questions, concerns, or data requests, please reach out:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:privacy@subzero.app" className="text-indigo-600 hover:underline">
                privacy@subzero.app
              </a>
            </p>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <span className="font-bold text-slate-900 uppercase tracking-tight text-sm">Subzero</span>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <Link href="/privacy" className="text-indigo-600">Privacy</Link>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="space-y-3 text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
      <div className="space-y-2 text-slate-600 leading-relaxed pl-4 border-l-2 border-indigo-100">{children}</div>
    </div>
  );
}
