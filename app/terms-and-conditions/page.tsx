import Link from "next/link";
import Image from "next/image";

export default function TermsAndConditionsPage() {
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
            <h1 className="text-2xl font-semibold text-white mb-2">Terms &amp; Conditions</h1>
            <p className="text-xs text-gray-500">Version 1.0 · Last updated: 15 September 2026</p>
          </div>

          <p>
            These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of Rent Ai. By creating an account or using the service,
            you agree to these Terms.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">1. Service description</h2>
            <p>
              Rent Ai provides software tools to help landlords manage tenants, track rent, reconcile bank transactions,
              and view related analytics. Features may change as we improve the product.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">2. Eligibility &amp; accounts</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate registration information and keep credentials secure.</li>
              <li>You are responsible for activity under your account.</li>
              <li>We may suspend or disable accounts that violate these Terms or pose security risks.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">3. Acceptable use</h2>
            <p>You agree not to misuse Rent Ai, including attempting unauthorized access, disrupting service, uploading unlawful content, or using the platform for purposes other than legitimate rental management.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">4. Bank connections &amp; data accuracy</h2>
            <p>
              Bank linking is provided through third parties such as Plaid. You authorize us to retrieve and process transaction data you connect.
              You remain responsible for verifying reconciliations and financial records. Rent Ai does not provide legal, tax, or financial advice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">5. Subscriptions &amp; payments</h2>
            <p>
              Paid plans are billed according to the pricing shown at purchase. Fees are generally non-refundable except where required by law
              or expressly stated. Referral rewards, if offered, are subject to separate program rules.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">6. Intellectual property</h2>
            <p>
              Rent Ai software, branding, and content are owned by us or our licensors. You receive a limited, non-exclusive license to use the service
              for your internal business purposes while subscribed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">7. Disclaimer &amp; liability</h2>
            <p>
              The service is provided &quot;as is&quot; without warranties of uninterrupted or error-free operation. To the maximum extent permitted by law,
              our liability is limited to the amount you paid us for the service in the 3 months before the claim.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">8. Termination</h2>
            <p>
              You may stop using Rent Ai at any time. We may terminate or suspend access for breach of these Terms. Provisions that by nature should survive
              (including liability limits and IP ownership) will survive termination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">9. Changes</h2>
            <p>
              We may update these Terms and will post a new version (e.g. 1.1). Continued use after changes become effective constitutes acceptance of the updated Terms.
              Material updates may require renewed acceptance at signup or next login.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">10. Contact</h2>
            <p>
              Questions about these Terms:{" "}
              <a href="mailto:zeeshanzia1270@gmail.com" className="text-emerald-400 hover:underline">
                zeeshanzia1270@gmail.com
              </a>
              . Also see our{" "}
              <Link href="/privacy-policy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
