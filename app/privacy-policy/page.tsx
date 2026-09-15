import Link from "next/link";
import Image from "next/image";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/rent.png"
              alt="RentAI Logo"
              width={40}
              height={40}
              className="rounded-full border border-[#0B3D2C] object-contain p-1"
            />
            <span className="font-semibold">Rent Ai</span>
          </Link>
          <Link href="/auth/sign-up" className="text-sm text-emerald-400 hover:underline">
            Back to Sign up
          </Link>
        </div>

        <article className="rounded-2xl border border-[#1f1f1f] bg-[#0E0E0E] p-6 md:p-10 space-y-6 text-sm leading-relaxed text-gray-300">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Privacy Policy</h1>
            <p className="text-xs text-gray-500">Version 1.0 · Last updated: 15 September 2026</p>
          </div>

          <p>
            Rent Ai (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides rental reconciliation and property management tools for landlords.
            This Privacy Policy explains how we collect, use, store, and share personal information when you use our website and services.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">1. Information we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account details: name, email address, password (hashed), and role.</li>
              <li>Landlord operational data: tenants, properties, rent history, expenses, and related notes.</li>
              <li>Bank connection data via Plaid (account identifiers and money-in transaction details you authorize).</li>
              <li>Technical data: IP address, browser/user agent, device type, and login/consent timestamps.</li>
              <li>Payment and referral information needed to process subscriptions and commissions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">2. How we use information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and secure your account and authenticate you.</li>
              <li>To provide rent tracking, reconciliation, dashboards, and notifications.</li>
              <li>To process payments, referrals, and customer support requests.</li>
              <li>To record legal consents (Privacy Policy, Terms, cookie preferences) for compliance.</li>
              <li>To improve product reliability, prevent fraud, and meet legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">3. Legal bases</h2>
            <p>
              Where applicable (including UK GDPR), we process personal data based on contract performance, legitimate interests
              (service improvement and security), consent (where required, including certain cookies), and legal obligation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">4. Sharing</h2>
            <p>
              We share data with trusted processors only as needed to run Rent Ai, including hosting providers, email delivery,
              payment processors (e.g. Stripe), identity providers (Firebase), and banking data partners (Plaid).
              We do not sell your personal information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">5. Retention &amp; security</h2>
            <p>
              We retain account and operational data while your account is active and for a reasonable period afterward for
              audits, disputes, and legal requirements. We use industry-standard safeguards including encryption in transit
              and access controls. No method of transmission is 100% secure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">6. Your rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete, restrict, or export your personal data,
              and to withdraw consent where processing is consent-based. Contact us to exercise these rights.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">7. Cookies</h2>
            <p>
              We use necessary cookies for authentication and security. Optional analytics/marketing cookies are used only if you accept them
              via our cookie banner. See also our{" "}
              <Link href="/terms-and-conditions" className="text-emerald-400 hover:underline">
                Terms &amp; Conditions
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">8. Contact</h2>
            <p>
              For privacy questions, email{" "}
              <a href="mailto:zeeshanzia1270@gmail.com" className="text-emerald-400 hover:underline">
                zeeshanzia1270@gmail.com
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
