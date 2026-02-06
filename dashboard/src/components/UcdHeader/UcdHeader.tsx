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

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white"
    >
      {/* ✅ Full-width container (no max-w-7xl cap) */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          {/* Brand */}
          <a
            className="flex items-center gap-3"
            href="/students/"
            title="Go to 'Home' page"
          >
            <img
              className="hidden h-10 w-auto sm:block"
              src="/crest-ucd.svg"
              alt="University College Dublin"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">
                UCD Current Students
              </div>
              <div className="text-xs text-slate-500">Mic Léinn Reatha UCD</div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              if (item.type === "link") {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.target}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  >
                    {item.label}
                  </a>
                );
              }

              const isOpen = openDropdown === item.label;

              return (
                <div key={item.label} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    aria-expanded={isOpen}
                  >
                    {item.label}
                    <span
                      className={`text-slate-500 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                      role="menu"
                    >
                      <ul className="p-1">
                        {item.items.map((sub) => (
                          <li key={sub.href}>
                            <a
                              href={sub.href}
                              target={sub.target}
                              className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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

            <div className="ml-2 flex items-center gap-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                title="Explore UCD"
              >
                <span aria-hidden="true">▾</span>
                <span>Explore UCD</span>
              </a>

              <a
                href="/connect/"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                title="UCD Connect"
              >
                <span aria-hidden="true">▦</span>
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
          {/* ✅ Also full width here */}
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                if (item.type === "link") {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.target}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {item.label}
                    </a>
                  );
                }

                const isOpen = openDropdown === item.label;

                return (
                  <div
                    key={item.label}
                    className="overflow-hidden rounded-lg border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                      aria-expanded={isOpen}
                    >
                      {item.label}
                      <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
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

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Explore UCD
              </a>
              <a
                href="/connect/"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
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
