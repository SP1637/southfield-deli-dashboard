import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Nexoryx One collects, uses and protects your data.",
};

const LAST_UPDATED = "28 April 2026";
const CONTACT_EMAIL = "sub17h4@gmail.com";
const APP_URL = "https://marketing-analytics-self.vercel.app";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Nexoryx One</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-slate-300 leading-relaxed">

          <section>
            <p>
              Nexoryx One (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a marketing analytics platform
              that connects to Google Analytics 4 to provide dashboards, reports and insights.
              This Privacy Policy explains how we collect, use, disclose and safeguard your
              information when you use our service at{" "}
              <a href={APP_URL} className="text-indigo-400 hover:underline">{APP_URL}</a>.
            </p>
            <p className="mt-4">
              By using Nexoryx One, you agree to the practices described in this policy. If you
              do not agree, please discontinue use of the service.
            </p>
          </section>

          <Section title="1. Information We Collect">
            <SubHeading>1.1 Information you provide</SubHeading>
            <ul>
              <li>
                <strong>Google account information</strong> — When you sign in with Google, we receive
                your name, email address and profile picture via OAuth. We use this solely to identify
                your account within Nexoryx One.
              </li>
              <li>
                <strong>GA4 Property ID</strong> — You optionally provide a Google Analytics 4 Property
                ID to connect your analytics data. This is stored in your browser&apos;s localStorage
                and is never stored on our servers.
              </li>
            </ul>

            <SubHeading>1.2 Information collected automatically</SubHeading>
            <ul>
              <li>
                <strong>Usage data</strong> — We may collect standard server logs including IP address,
                browser type, pages visited and timestamps. This data is used solely for security and
                performance monitoring.
              </li>
              <li>
                <strong>Cookies &amp; session tokens</strong> — We use a session cookie (managed by
                NextAuth.js) to keep you signed in. No third-party advertising cookies are used.
              </li>
            </ul>

            <SubHeading>1.3 Google Analytics data</SubHeading>
            <p>
              When you connect a GA4 property, Nexoryx One reads analytics data from your property
              on your behalf using a Google service account that you explicitly grant Viewer access to.
              This data is fetched in real time, briefly cached in server memory (up to 5 minutes),
              and is never stored in a database or shared with any third party.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Authenticate you and maintain your session</li>
              <li>Display your Google Analytics data in the Nexoryx One dashboard</li>
              <li>Send marketing report emails that you explicitly request</li>
              <li>Send scheduled report emails that you configure</li>
              <li>Improve the reliability and performance of the service</li>
              <li>Respond to your support requests</li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> use your data for advertising, sell it to third parties,
              or use it to train machine learning models.
            </p>
          </Section>

          <Section title="3. Google OAuth Scopes">
            <p>
              Nexoryx One requests only the following OAuth scopes when you sign in with Google:
            </p>
            <ul>
              <li><code className="text-indigo-300">openid</code> — Verify your identity</li>
              <li><code className="text-indigo-300">email</code> — Your email address (for account identification and report delivery)</li>
              <li><code className="text-indigo-300">profile</code> — Your name and profile picture (displayed in the dashboard)</li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> request access to Google Analytics, Google Ads, Google Drive,
              Gmail or any other Google service through OAuth. GA4 data access is granted separately
              via a service account that you control and can revoke at any time from your GA4 Admin panel.
            </p>
            <p className="mt-4">
              Nexoryx One&apos;s use and transfer of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </Section>

          <Section title="4. Data Sharing and Disclosure">
            <p>We do not sell or rent your personal information. We may share data only in these limited circumstances:</p>
            <ul>
              <li>
                <strong>Service providers</strong> — We use Resend (email delivery) and Vercel (hosting).
                These providers process data only as directed by us and under appropriate data processing agreements.
              </li>
              <li>
                <strong>Legal requirements</strong> — We may disclose information if required by law,
                court order or governmental authority.
              </li>
              <li>
                <strong>Business transfer</strong> — If Nexoryx One is acquired or merged, your information
                may be transferred as part of that transaction. You will be notified by email.
              </li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <ul>
              <li>
                <strong>Session data</strong> — Your login session is kept for 30 days and then expires automatically.
              </li>
              <li>
                <strong>GA4 data cache</strong> — Analytics data is cached in server memory for up to 5 minutes only.
                It is never written to persistent storage.
              </li>
              <li>
                <strong>User settings</strong> — KPI goals, alert preferences and team members are stored in your
                browser&apos;s localStorage. Clearing your browser data removes them completely.
              </li>
              <li>
                <strong>Account deletion</strong> — To delete your account, email us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a>.
                We will remove your email and any server-side records within 30 days.
              </li>
            </ul>
          </Section>

          <Section title="6. Security">
            <p>
              We take reasonable technical and organisational measures to protect your information,
              including HTTPS encryption in transit, secure session tokens signed with a secret key,
              and no persistent storage of sensitive analytics data on our servers.
            </p>
            <p className="mt-4">
              However, no internet transmission is 100% secure. We cannot guarantee absolute security
              and encourage you to use a strong password on your Google account and enable
              two-factor authentication.
            </p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>
              Nexoryx One is not directed to children under 13 years of age. We do not knowingly collect
              personal information from children. If you believe a child has provided us with personal
              information, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Withdraw consent at any time (by revoking GA4 service account access or deleting your account)</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="9. International Transfers">
            <p>
              Nexoryx One is hosted on Vercel infrastructure which may process data in the United States
              and other countries. By using our service, you consent to this transfer. We ensure
              appropriate safeguards are in place in accordance with applicable data protection laws.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by updating the &quot;Last updated&quot; date at the top of this page and, where
              appropriate, by email. Your continued use of Nexoryx One after changes are posted
              constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5 space-y-1 text-sm">
              <p><strong className="text-white">Nexoryx One</strong></p>
              <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a></p>
              <p>Website: <a href={APP_URL} className="text-indigo-400 hover:underline">{APP_URL}</a></p>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 mt-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-600">© 2026 Nexoryx One. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link href="/privacy" className="text-indigo-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4 pb-2 border-b border-white/10">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-white mt-5 mb-2">{children}</h3>;
}
