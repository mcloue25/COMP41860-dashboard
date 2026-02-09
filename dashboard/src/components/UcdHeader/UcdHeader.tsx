import React, { useEffect, useMemo, useRef, useState } from "react";

type NavItem =
  | { type: "link"; label: string; href: string; target?: "_self" | "_blank" }
  | {
      type: "dropdown";
      label: string;
      items: { label: string; href: string; target?: "_self" | "_blank" }[];
    };

function useOnClickOutside(
  refs: React.RefObject<HTMLElement>[],
  handler: () => void
) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const clickedInside = refs.some((r) => r.current?.contains(target));
      if (!clickedInside) handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler]);
}

export function UcdHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  useOnClickOutside([headerRef], () => setOpenDropdown(null));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navItems: NavItem[] = useMemo(
    () => [
      { type: "link", label: "Exams", href: "/students/exams/", target: "_self" },
      {
        type: "dropdown",
        label: "Fees",
        items: [
          { label: "Fees", href: "/students/fees/", target: "_self" },
          { label: "Grants", href: "/students/fees/grants/", target: "_self" },
          {
            label: "Fee Payment Deadlines",
            href: "/students/fees/feepaymentdeadlines/",
            target: "_self",
          },
          { label: "How To Pay", href: "/students/fees/howtopay/", target: "_self" },
        ],
      },
      { type: "link", label: "Key Dates", href: "/students/keydates/", target: "_self" },
      {
        type: "dropdown",
        label: "Course Search",
        items: [
          { label: "Course Search", href: "/students/course_search/", target: "_self" },
          {
            label: "General Reference Timetable",
            href: "/students/course_search/generalreferencetimetable/",
            target: "_self",
          },
        ],
      },
      {
        type: "dropdown",
        label: "Student Desk",
        items: [
          { label: "Student Desk", href: "/students/studentdesk/", target: "_self" },
          { label: "How-to Video Guides", href: "/students/videos/", target: "_blank" },
          { label: "Registration", href: "/students/studentdesk/registration/", target: "_self" },
          { label: "Fees", href: "/students/studentdesk/fees/", target: "_self" },
          { label: "FAQ's", href: "/students/studentdesk/faqs/", target: "_self" },
        ],
      },
      {
        type: "dropdown",
        label: "Services",
        items: [
          { label: "Services", href: "/students/services/", target: "_self" },
          {
            label: "UView - Your Student Record",
            href: "/students/services/uview-yourstudentrecord/",
            target: "_self",
          },
          { label: "Email Archive", href: "/students/services/emailarchive/", target: "_self" },
        ],
      },
    ],
    []
  );

  const relForTarget = (target?: "_self" | "_blank") =>
    target === "_blank" ? "noopener noreferrer" : undefined;

  // ✅ Block-style nav items that turn UCD dark blue on hover (like the real site)
  const navBlock =
  "inline-flex h-full self-stretch items-center gap-2 px-4 text-sm font-semibold " +
  "leading-none text-[#004377] transition " +
  "hover:bg-[#004377] hover:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-600/30";

  const navBlockOpen = "bg-[#004377] text-white";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white"
    >
      {/* Full-width container */}
      <div className="w-full pl-2 sm:pl-4 lg:pl-6 pr-0">
        {/* smaller + responsive header height */}
        <div className="flex h-[clamp(56px,6vh,76px)] items-center gap-3">
          {/* Brand */}
          <a className="flex items-center gap-3" href="/students/" title="Go to 'Home' page">
            <img
              className="hidden h-[clamp(34px,4.2vh,48px)] w-auto sm:block"
              src="/crest-ucd.svg"
              alt="University College Dublin"
            />
            <div className="leading-tight">
              <div className="w-[180px] whitespace-nowrap text-[clamp(13px,1.2vw,18px)] leading-[1.1] font-semibold text-[#004377]">
                UCD Current Students
              </div>
              <div className="w-[180px] whitespace-nowrap text-[clamp(13px,1.2vw,18px)] leading-[1.1] font-semibold text-[#007db8]">
                Mic Léinn Reatha UCD
              </div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="ml-auto hidden h-full items-stretch lg:flex">
            {navItems.map((item) => {
              if (item.type === "link") {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.target}
                    rel={relForTarget(item.target)}
                    className={navBlock}
                  >
                    {item.label}
                  </a>
                );
              }

              const isOpen = openDropdown === item.label;

              return (
                <div key={item.label} className="relative h-full flex">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    className={`${navBlock} ${isOpen ? navBlockOpen : ""}`}
                    aria-expanded={isOpen}
                  >
                    {item.label}
                    <span
                      className={`leading-none transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                      >
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="absolute left-0 top-full z-50 min-w-full overflow-hidden
                                border-x border-b border-slate-200 bg-white"
                      role="menu"
                    >
                      <ul className="divide-y divide-slate-200">
                        {item.items.map((sub) => (
                          <li key={sub.href}>
                            <a
                              href={sub.href}
                              target={sub.target}
                              rel={relForTarget(sub.target)}
                              className="block px-4 py-1.5 text-sm font-medium text-[#004377]
                                hover:bg-[#004377] hover:text-white transition"
                            >
                              {sub.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Explore / Connect boxes */}
            <div className="hidden items-stretch gap-0 lg:flex">
              {/* Explore UCD */}
              <a
                href="/"
                className="group h-full flex items-center gap-2 px-4 text-sm font-semibold text-white
                  bg-[#004377] hover:bg-[#00365f] transition
                  focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                title="Explore UCD"
              >
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 place-items-center rounded bg-white/15 group-hover:bg-white/20 transition"
                >
                  ▾
                </span>
                <span>Explore UCD</span>
              </a>

              {/* UCD Connect */}
              <a
                href="/connect/"
                className="group h-full flex items-center gap-2 px-4 text-sm font-semibold
                  text-[#00365f] bg-[#F2C200] hover:bg-[#E3B400] transition
                  focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                title="UCD Connect"
              >
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 place-items-center rounded bg-black/10 group-hover:bg-black/15 transition"
                >
                  ▦
                </span>
                <span>UCD Connect</span>
              </a>
            </div>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="ml-auto inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 lg:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                if (item.type === "link") {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.target}
                      rel={relForTarget(item.target)}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-[#004377] hover:bg-[#004377] hover:text-white transition"
                    >
                      {item.label}
                    </a>
                  );
                }

                const isOpen = openDropdown === item.label;

                return (
                  <div key={item.label} className="overflow-hidden rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm font-semibold transition
                                  text-[#004377] hover:bg-[#004377] hover:text-white ${
                                    isOpen ? "bg-[#004377] text-white" : ""
                                  }`}
                      aria-expanded={isOpen}
                    >
                      {item.label}
                      <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">
                        ▾
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-200 bg-white p-1">
                        {item.items.map((sub) => (
                          <a
                            key={sub.href}
                            href={sub.href}
                            target={sub.target}
                            rel={relForTarget(sub.target)}
                            className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          >
                            {sub.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Explore / Connect boxes */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href="/"
                className="block rounded-md bg-[#004377] px-4 py-3 text-sm font-semibold text-white
                           hover:bg-[#00365f] transition focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              >
                Explore UCD
              </a>

              <a
                href="/connect/"
                className="block rounded-md bg-[#F2C200] px-4 py-3 text-sm font-semibold text-[#00365f]
                           hover:bg-[#E3B400] transition focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
              >
                UCD Connect
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
