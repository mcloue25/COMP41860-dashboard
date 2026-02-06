import React from "react";

type FooterLink = { label: string; href: string; target?: "_self" | "_blank" };

function FooterLinkList(props: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/90">{props.title}</h3>
      <ul className="mt-3 space-y-2">
        {props.links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target={l.target ?? "_self"}
              rel={l.target === "_blank" ? "noreferrer" : undefined}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon(props: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      aria-label={props.label}
      title={props.label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition"
    >
      {props.children}
    </a>
  );
}

export function UcdFooter() {
  const usefulLinks: FooterLink[] = [
    { label: "Accessibility Statement", href: "https://www.ucd.ie/accessibility/", target: "_blank" },
    { label: "Website Terms & Conditions", href: "https://www.ucd.ie/website-terms-conditions/", target: "_blank" },
    { label: "Freedom of Information", href: "https://www.ucd.ie/foi/", target: "_blank" },
    { label: "Privacy", href: "https://www.ucd.ie/privacy/", target: "_blank" },
    { label: "Cookie Policy", href: "https://www.ucd.ie/cookie-policy/", target: "_blank" },
    { label: "Acceptable Use Policy", href: "https://www.ucd.ie/acceptableusepolicy/", target: "_blank" },
  ];

  const moreLinks: FooterLink[] = [
    { label: "UCD Current Students", href: "https://www.ucd.ie/students/", target: "_blank" },
    { label: "UCD Student Desk", href: "https://www.ucd.ie/students/studentdesk/", target: "_blank" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#0b2b4c] text-white">
      {/* PNG grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/grid-overlay-footer.png')] bg-repeat"
        style={{ opacity: 0.18 }}
      />

      {/* subtle gradient overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* content */}
      <div className="relative">
        {/* Optional Student Desk strip (you had this in App.tsx) */}
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h3 className="text-lg font-semibold">Student Desk</h3>
          <p className="mt-2 text-white/80">
            Ground Floor, Tierney Building, UCD Belfield, Dublin 4
          </p>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pb-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr]">
            {/* Contact / crest */}
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/crest-ucd.svg"
                  alt="University College Dublin"
                  className="h-12 w-auto"
                />
                <div>
                  <div className="text-sm font-semibold tracking-wide">
                    University College Dublin
                  </div>
                  <div className="text-xs text-white/70">
                    Belfield, Dublin 4, Ireland
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm text-white/70">
                <div>
                  <span className="font-semibold text-white/80">T:</span>{" "}
                  <a className="hover:text-white" href="tel:+35317167777">
                    +353 1 716 7777
                  </a>
                </div>
                <div className="text-xs text-white/50">
                  © {new Date().getFullYear()} All Rights Reserved.
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white/90">
                  Connect with UCD
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  <SocialIcon label="LinkedIn" href="https://www.linkedin.com/">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5ZM0.5 8h4V23h-4V8Zm7 0h3.83v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V23h-4v-7.9c0-1.88-.03-4.3-2.62-4.3-2.62 0-3.02 2.05-3.02 4.17V23h-4V8Z" />
                    </svg>
                  </SocialIcon>

                  <SocialIcon label="Facebook" href="https://www.facebook.com/">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M13.5 22v-8h2.7l.4-3H13.5V9.1c0-.9.3-1.6 1.7-1.6h1.5V4.8c-.3 0-1.4-.1-2.7-.1-2.7 0-4.6 1.6-4.6 4.6V11H7v3h2.4v8h4.1Z" />
                    </svg>
                  </SocialIcon>

                  <SocialIcon label="Instagram" href="https://www.instagram.com/">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5ZM18 6.8a1.2 1.2 0 1 1-1.2-1.2A1.2 1.2 0 0 1 18 6.8Z" />
                    </svg>
                  </SocialIcon>

                  <SocialIcon label="YouTube" href="https://www.youtube.com/">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M23 12s0-3.6-.5-5.2c-.3-1-1.1-1.8-2.1-2.1C18.7 4 12 4s-6.7 0-8.4.7c-1 .3-1.8 1.1-2.1 2.1C1 8.4 1 12 1 12s0 3.6.5 5.2c.3 1 1.1 1.8 2.1 2.1C5.3 20 12 20 12 20s6.7 0 8.4-.7c1-.3 1.8-1.1 2.1-2.1.5-1.6.5-5.2.5-5.2ZM10 15.5v-7l6 3.5-6 3.5Z" />
                    </svg>
                  </SocialIcon>
                </div>
              </div>
            </div>

            <FooterLinkList title="Useful Links" links={usefulLinks} />
            <FooterLinkList title="More useful links" links={moreLinks} />
          </div>
        </div>
      </div>
    </footer>
  );
}
