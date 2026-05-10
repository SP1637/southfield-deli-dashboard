import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions governing your use of Marketing Intelligence.",
};

const LAST_UPDATED = "28 April 2026";
const CONTACT_EMAIL = "sub17h4@gmail.com";
const APP_URL = "https://marketing-analytics-self.vercel.app";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Marketing Intelligence</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 text-slate-300 leading-relaxed text-sm">

          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of Marketing Intelligence
            (&quot;Service&quot;), operated by Marketing Intelligence (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
            By accessing or using the Service you agree to be bound by these Terms.
            If you do not agree, do not use the Service.
          </p>

          <Section title="1. Use of the Service">
            <p>
              Marketing Intelligence provides a marketing analytics dashboard that connects to Google Analytics 4
              via a service account. You must be at least 13 years old and have the legal authority
              to enter into these Terms to use the Service.
            </p>
            <p className="mt-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
              <li>Attempt to reverse-engineer, decompile or extract source code from the Service</li>
              <li>Use automated means to access the Service in a way that exceeds reasonable use</li>
              <li>Resell or sublicense access to the Service without our written consent</li>
              <li>Introduce malicious code or attempt to compromise the security of the Service</li>
            </ul>
          </Section>

          <Section title="2. Accounts and Authentication">
            <p>
              You sign in using your Google account via OAuth. You are responsible for maintaining
              the security of your Google account and for all activity that occurs under your session.
              You must notify us immediately at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a>{" "}
              if you suspect unauthorised access to your account.
            </p>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms or that
              have been inactive for more than 12 months.
            </p>
          </Section>

          <Section title="3. Your Data and GA4 Access">
            <p>
              You retain full ownership of your Google Analytics data. By connecting a GA4 property
              to Marketing Intelligence, you grant us permission to read that property&apos;s data on your behalf
              for the purpose of displaying it in your dashboard.
            </p>
            <p className="mt-3">
              You can revoke this access at any time by removing the Marketing Intelligence service account from
              your GA4 Admin panel. We do not store your analytics data persistently — it is fetched
              in real time and held in server memory for up to 5 minutes for performance caching only.
            </p>
          </Section>

          <Section title="4. Subscription Plans and Billing">
            <p>
              Marketing Intelligence offers a free Starter plan and paid Pro (£29/month) and Agency (£99/month)
              plans. Paid plans are billed monthly via Stripe. All prices are in GBP and exclusive
              of any applicable taxes.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>
                <strong className="text-white">Free trial</strong> — Pro includes a 14-day free trial.
                No charge is made until the trial ends. You may cancel at any time before the trial
                ends with no obligation.
              </li>
              <li>
                <strong className="text-white">Cancellation</strong> — You may cancel your subscription
                at any time. Cancellation takes effect at the end of the current billing period.
                No refunds are issued for partial months.
              </li>
              <li>
                <strong className="text-white">Changes to pricing</strong> — We will give at least
                30 days&apos; notice of any price increases via email.
              </li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              The Marketing Intelligence name, logo, dashboard design, and all underlying software are our
              exclusive property and are protected by copyright and other intellectual property laws.
              You may not copy, reproduce or create derivative works from any part of the Service
              without our written permission.
            </p>
            <p className="mt-3">
              We grant you a limited, non-exclusive, non-transferable licence to access and use
              the Service for your internal business purposes during the term of your subscription.
            </p>
          </Section>

          <Section title="6. Third-Party Services">
            <p>
              Marketing Intelligence integrates with third-party services including Google Analytics, Stripe,
              Resend and Vercel. Your use of these services is governed by their respective terms
              and privacy policies. We are not responsible for the practices of these third parties.
            </p>
          </Section>

          <Section title="7. Disclaimer of Warranties">
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
              either express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p className="mt-3">
              We do not warrant that the Service will be uninterrupted, error-free, or that any
              data or insights provided will be accurate, complete or suitable for any particular
              business decision. Marketing analytics data should be used as one input among many —
              not as the sole basis for financial decisions.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Marketing Intelligence shall not be liable for any
              indirect, incidental, special, consequential or punitive damages, including loss of
              profits, data, goodwill or business opportunities, arising from or related to your
              use of the Service.
            </p>
            <p className="mt-3">
              Our total cumulative liability to you for any claims arising from these Terms or
              the Service shall not exceed the amount you paid us in the 3 months preceding the claim,
              or £50, whichever is greater.
            </p>
          </Section>

          <Section title="9. Indemnification">
            <p>
              You agree to indemnify and hold harmless Marketing Intelligence and its officers, directors,
              employees and agents from any claims, damages, losses or expenses (including
              reasonable legal fees) arising from your use of the Service, your violation of
              these Terms, or your violation of any third-party rights.
            </p>
          </Section>

          <Section title="10. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              by email and by updating the &quot;Last updated&quot; date above. If you continue to use
              the Service after the changes take effect, you accept the revised Terms.
              If you do not agree to the new Terms, you must stop using the Service.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes arising
              from these Terms or your use of the Service shall be subject to the exclusive
              jurisdiction of the courts of England and Wales.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>For any questions about these Terms, please contact us:</p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5 space-y-1">
              <p><strong className="text-white">Marketing Intelligence</strong></p>
              <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a></p>
              <p>Website: <a href={APP_URL} className="text-indigo-400 hover:underline">{APP_URL}</a></p>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 mt-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-600">© 2026 Marketing Intelligence. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-indigo-400">Terms of Service</Link>
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
