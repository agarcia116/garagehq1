import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  CalendarDays,
  Users,
  Wrench,
  FileText,
  Wallet,
  PackageCheck,
  Smartphone,
  ArrowRight,
  Check,
  Star,
  ChevronDown,
  ClipboardList,
  StickyNote,
  Search,
  Zap,
  Clock,
  Shield,
  UserCog,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { DashboardDemo } from './DashboardDemo';

const REVIEWS = [
  {
    name: 'Carlos Mendez',
    shop: 'Mendez Auto Repair — Austin, TX',
    initials: 'CM',
    quote:
      'Garage HQ replaced three spreadsheets and a wall calendar. My bay scheduling is finally organized and I can see exactly where the money goes each month.',
    rating: 5,
  },
  {
    name: 'Tanya Brooks',
    shop: 'Brooks Brothers Garage — Denver, CO',
    initials: 'TB',
    quote:
      'The customer portal alone is worth it. People can check their repair status without calling me five times a day. Huge time saver for a 2-bay shop.',
    rating: 5,
  },
  {
    name: 'Aiden Wallace',
    shop: 'Wallace & Sons Auto — Portland, OR',
    initials: 'AW',
    quote:
      'Invoices and estimates look professional and send in seconds. I went from chasing payments to getting paid faster with automatic status tracking.',
    rating: 5,
  },
  {
    name: 'Priya Shah',
    shop: 'Shah Auto Service — Raleigh, NC',
    initials: 'PS',
    quote:
      'Setup took an afternoon. My technicians learned it in a day. Everything I need to run the shop is finally in one place instead of scattered everywhere.',
    rating: 5,
  },
];

const FAQS = [
  {
    q: 'How much does Garage HQ cost?',
    a: 'Garage HQ is $159.99 per month with no setup fees and no long-term contracts. Every shop gets a free trial to explore the full platform before billing begins.',
  },
  {
    q: 'What features are included?',
    a: 'Appointment scheduling, customer and vehicle history, digital repair orders, estimates, invoices, expense tracking, financial reports, inventory, employee accounts, and a customer portal for repair status updates — all in one subscription.',
  },
  {
    q: "Can I access Garage HQ on my phone or tablet?",
    a: 'Yes. Garage HQ is fully responsive and works in any modern web browser on desktop, tablet, and mobile. No app install required — your shop is always with you.',
  },
  {
    q: "Is my shop's data secure?",
    a: 'Your data is stored on encrypted, industry-standard infrastructure with row-level security. Each shop can only access its own records, and only your authorized employees can log in.',
  },
  {
    q: 'Can I add my mechanics and employees?',
    a: 'Absolutely. You can invite employees with role-based access (owner, admin, or mechanic) so your technicians see what they need and your books stay private.',
  },
  {
    q: 'How does the customer portal work?',
    a: 'Your customers get a dedicated portal where they can request appointments and track the status of their repairs in real time, reducing phone calls and improving communication.',
  },
];

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Why Garage HQ', href: '#why' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

const BENEFITS = [
  {
    icon: CalendarDays,
    title: 'Appointment Scheduling',
    desc: 'Book service appointments, assign bays, and manage your daily workflow on a shared calendar that keeps everyone in sync.',
  },
  {
    icon: Users,
    title: 'Customer & Vehicle History',
    desc: 'Every customer and vehicle in one place — service records, contact info, and notes instantly accessible the moment the phone rings.',
  },
  {
    icon: Wrench,
    title: 'Digital Repair Orders',
    desc: 'Create repair orders, track technician progress, and attach parts and labor without touching a single paper form.',
  },
  {
    icon: FileText,
    title: 'Estimates & Invoices',
    desc: 'Send professional estimates and invoices in seconds. Track approval status, payments, and outstanding balances automatically.',
  },
  {
    icon: Wallet,
    title: 'Expense Tracking & Reports',
    desc: 'Log expenses by category and watch real-time financial reports show your revenue, costs, and profit margin without spreadsheets.',
  },
  {
    icon: Smartphone,
    title: 'Customer Portal',
    desc: 'Give customers a self-service portal to check repair status and request appointments — fewer phone calls, happier clients.',
  },
];

const PROBLEMS = [
  { icon: ClipboardList, pain: 'Paper repair orders get lost, misread, or buried under clutter.', solution: 'Digital repair orders saved permanently, searchable in seconds.' },
  { icon: StickyNote, pain: 'Appointments scribbled on sticky notes or a wall calendar.', solution: 'A shared digital calendar with bay assignments and reminders.' },
  { icon: Search, pain: 'Customer history scattered across notebooks and memory.', solution: 'Complete vehicle and customer history, one click away.' },
  { icon: FileText, pain: 'Hand-written invoices that look unprofessional and take forever.', solution: 'Polished estimates and invoices, generated and sent in seconds.' },
  { icon: Wallet, pain: 'No idea where the money goes until tax season.', solution: 'Live expense tracking and financial reports, updated automatically.' },
  { icon: PackageCheck, pain: 'Parts inventory lives in boxes, memory, or outdated spreadsheets.', solution: 'Track stock levels, part costs, and reorder needs before a job gets held up.' },
];

const ADVANTAGES = [
  { icon: Zap, title: 'Designed for independent shops', desc: 'Built around the workflow of a 2–3 bay shop, not a 20-location franchise.' },
  { icon: Clock, title: 'Learn it in an afternoon', desc: 'A clean, intuitive interface you and your mechanics can use on day one.' },
  { icon: Check, title: 'Everything in one place', desc: 'Scheduling, repairs, invoices, expenses, and customers — one subscription, one login.' },
  { icon: Wallet, title: 'One straightforward price', desc: '$159.99/month. No per-bay fees, no per-user add-ons, no surprise invoices.' },
  { icon: Shield, title: 'Your data stays private', desc: 'Row-level security keeps every shop\'s records isolated and protected.' },
  { icon: MessageSquare, title: 'Better customer communication', desc: 'A self-service portal means fewer status-call interruptions during jobs.' },
];

const COMPARISON: { feature: string; paper: boolean | string; garagehq: boolean | string }[] = [
  { feature: 'Appointment scheduling with bay management', paper: false, garagehq: true },
  { feature: 'Digital repair orders & technician tracking', paper: false, garagehq: true },
  { feature: 'Complete customer & vehicle service history', paper: false, garagehq: true },
  { feature: 'Professional estimates & invoices', paper: false, garagehq: true },
  { feature: 'Expense tracking & financial reports', paper: false, garagehq: true },
  { feature: 'Customer portal with repair status', paper: false, garagehq: true },
  { feature: 'Employee accounts with role-based access', paper: false, garagehq: true },
  { feature: 'Secure, backed-up, searchable records', paper: false, garagehq: true },
  { feature: 'Access from phone, tablet, or desktop', paper: false, garagehq: true },
  { feature: 'Setup time', paper: 'Weeks', garagehq: 'An afternoon' },
];

const PRICING_FEATURES = [
  'Unlimited appointments & bay scheduling',
  'Customer & vehicle service history',
  'Digital repair orders with technician tracking',
  'Professional estimates & invoices',
  'Expense tracking & financial reports',
  'Inventory & parts management',
  'Employee accounts with role-based access',
  'Customer portal with repair status updates',
  'Access on desktop, tablet, and mobile',
  'Secure cloud storage with automatic backups',
];

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < count ? 'fill-[#d8a653] text-[#d8a653]' : 'fill-[#c9d4d2] text-[#c9d4d2]'}`}
        />
      ))}
    </div>
  );
}

export function LandingPage() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [contactSent, setContactSent] = useState(false);
  useReveal();

  useEffect(() => {
    if (REVIEWS.length <= 1) return;
    const id = setInterval(() => setReviewIndex((i) => (i + 1) % REVIEWS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContact = (e: FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setContactSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#173746] text-[#dbe4e5] antialiased">
      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-[#d8a653]/20 bg-[#173746]/95 backdrop-blur-md shadow-lg shadow-black/30' : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#d8a653] to-[#b9852c] shadow-md shadow-black/30">
              <Wrench className="h-5 w-5 text-[#173746]" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              Garage <span className="text-[#d8a653]">HQ</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="text-sm font-medium text-[#dbe4e5]/80 transition-colors hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#dbe4e5] transition-colors hover:text-white"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-[#d8a653] px-4 py-2 text-sm font-semibold text-[#173746] shadow-md shadow-black/30 transition-all hover:bg-[#e1b765]"
            >
              Get Started
            </Link>
          </div>

          <button
            className="rounded-lg p-2 text-[#dbe4e5] lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="border-t border-[#d8a653]/20 bg-[#173746] px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#dbe4e5]/80 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </button>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-[#d8a653]/30 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-[#d8a653] px-4 py-2.5 text-center text-sm font-semibold text-[#173746]"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#d8a653]/15 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#234b5a]/40 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(216,166,83,0.12),transparent_60%)]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8a653]/30 bg-[#d8a653]/10 px-3.5 py-1.5 text-xs font-medium text-[#e1b765]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d8a653] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d8a653]" />
              </span>
              Built for 2–3 bay independent shops
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              RUN YOUR SHOP.<br />
              <span className="bg-gradient-to-r from-[#d8a653] to-[#e1b765] bg-clip-text text-transparent">
                NOT YOUR PAPERWORK.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[#dbe4e5]">
              The all-in-one management software built for independent auto repair shops.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#b1c0c0]">
              Manage appointments, customers, repairs, invoices, and expenses from one simple dashboard. Spend less time on paperwork and more time running your business.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d8a653] px-6 py-3.5 text-base font-bold text-[#173746] shadow-lg shadow-black/30 transition-all hover:bg-[#e1b765] sm:w-auto"
              >
                Get Started — $159.99/Month
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => scrollTo('#demo')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8a653]/30 bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition-all hover:border-[#d8a653]/50 hover:bg-white/10 sm:w-auto"
              >
                Explore Live Demo
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#b1c0c0]">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#d8a653]" /> No setup fees</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#d8a653]" /> Cancel anytime</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#d8a653]" /> Free trial</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problems & Solutions */}
      <section className="border-t border-[#d8a653]/10 bg-[#173746] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto mb-14 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">The Problem</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              YOU FIX CARS. WE HELP FIX THE BUSINESS SIDE.
            </h2>
            <p className="mt-4 text-[#b1c0c0]">
              Running a shop on paper and memory works — until it doesn't. Here's what that chaos costs you, and how Garage HQ replaces it.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className="reveal rounded-2xl border border-[#d8a653]/15 bg-white/[0.04] p-6 transition-colors hover:border-[#d8a653]/30"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4e1d9]/10 text-[#d99878]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-[#b1c0c0] line-through decoration-[#d99878]/50">
                    {p.pain}
                  </p>
                  <div className="my-3 flex items-center gap-2 text-[#d8a653]">
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Garage HQ</span>
                  </div>
                  <p className="text-sm font-medium text-white">{p.solution}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section id="features" className="py-20 lg:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto mb-14 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">Features</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Everything your shop needs. Nothing it doesn't.
            </h2>
            <p className="mt-4 text-[#b1c0c0]">
              Six core tools that save time, keep you organized, and make the business side effortless.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="reveal group relative overflow-hidden rounded-2xl border border-[#d8a653]/15 bg-white/[0.04] p-6 transition-all hover:-translate-y-1 hover:border-[#d8a653]/40 hover:bg-white/[0.07]"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#d8a653]/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d8a653]/20 to-[#b9852c]/20 text-[#d8a653] ring-1 ring-inset ring-[#d8a653]/20 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-[#b1c0c0]">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="border-t border-[#d8a653]/10 bg-[#173746] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto mb-12 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">Live Demo</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Explore the dashboard. No sign-up required.
            </h2>
            <p className="mt-4 text-[#b1c0c0]">
              Click through the tabs in the preview to see realistic shop data across every part of Garage HQ.
            </p>
          </div>
          <div className="reveal mx-auto max-w-5xl">
            <DashboardDemo />
          </div>
        </div>
      </section>

      {/* Competitive Advantage */}
      <section id="why" className="py-20 lg:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="reveal">
              <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">Why Garage HQ</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                BUILT FOR SMALL SHOPS.<br />
                <span className="text-[#d8a653]">NOT CORPORATE CHAINS.</span>
              </h2>
              <p className="mt-4 text-[#b1c0c0]">
                Most shop software is built for dealerships and multi-location franchises. Garage HQ is built for the independent owner-operator who does it all — and needs software that helps, not gets in the way.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {ADVANTAGES.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d8a653]/15 text-[#d8a653]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{a.title}</h4>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#b1c0c0]">{a.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="reveal rounded-2xl border border-[#d8a653]/20 bg-[#173746] p-6 shadow-2xl shadow-black/30">
              <div className="mb-4 grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 text-xs">
                <span></span>
                <span className="px-2 text-center font-bold text-[#667b80]">Paper / Spreadsheets</span>
                <span className="px-2 text-center font-bold text-[#d8a653]">Garage HQ</span>
              </div>
              <div className="divide-y divide-white/5">
                {COMPARISON.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 py-2.5 text-sm">
                    <span className="text-[#dbe4e5]">{row.feature}</span>
                    <span className="px-2 text-center">
                      {typeof row.paper === 'boolean' ? (
                        row.paper ? <Check className="mx-auto h-4 w-4 text-[#35634b]" /> : <X className="mx-auto h-4 w-4 text-[#9a4f38]/70" />
                      ) : (
                        <span className="text-xs text-[#667b80]">{row.paper}</span>
                      )}
                    </span>
                    <span className="px-2 text-center">
                      {typeof row.garagehq === 'boolean' ? (
                        row.garagehq ? <Check className="mx-auto h-4 w-4 text-[#d8a653]" /> : <X className="mx-auto h-4 w-4 text-[#9a4f38]/70" />
                      ) : (
                        <span className="text-xs font-semibold text-[#e1b765]">{row.garagehq}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="border-t border-[#d8a653]/10 bg-[#173746] py-20 lg:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto mb-12 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">Reviews</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              TRUSTED BY SHOP OWNERS LIKE YOU.
            </h2>
            <p className="mt-4 text-sm text-[#667b80]">
              The testimonials below are illustrative examples and do not represent actual Garage HQ customers.
            </p>
          </div>

          <div className="reveal mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-2xl border border-[#d8a653]/15 bg-white/[0.04] p-8 sm:p-10">
              <div className="absolute right-6 top-6 text-6xl text-[#d8a653]/10 select-none">"</div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#d8a653] to-[#b9852c] text-lg font-bold text-[#173746]">
                  {REVIEWS[reviewIndex].initials}
                </div>
                <Stars count={REVIEWS[reviewIndex].rating} />
                <p className="mt-4 text-lg leading-relaxed text-[#dbe4e5]">
                  "{REVIEWS[reviewIndex].quote}"
                </p>
                <div className="mt-5">
                  <p className="font-bold text-white">{REVIEWS[reviewIndex].name}</p>
                  <p className="text-sm text-[#b1c0c0]">{REVIEWS[reviewIndex].shop}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewIndex(i)}
                  aria-label={`Review ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === reviewIndex ? 'w-6 bg-[#d8a653]' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto mb-14 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">How It Works</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Up and running in three steps.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { num: '01', icon: UserCog, title: 'Create your account', desc: 'Register your shop in minutes. No credit card needed to start your free trial.' },
              { num: '02', icon: Users, title: 'Set up your shop', desc: 'Add your employees, customers, and vehicles. Customize services and business hours.' },
              { num: '03', icon: Wrench, title: 'Start managing', desc: 'Book appointments, run repairs, send invoices, and track expenses — all in one place.' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="reveal relative rounded-2xl border border-[#d8a653]/15 bg-white/[0.04] p-7"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="absolute -top-4 left-6 rounded-lg bg-[#d8a653] px-3 py-1 text-sm font-bold text-[#173746] shadow-lg shadow-black/30">
                    {step.num}
                  </div>
                  <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d8a653]/15 text-[#d8a653]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#b1c0c0]">{step.desc}</p>
                  {i < 2 && (
                    <ArrowRight className="absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-[#d8a653]/40 md:block" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="reveal mt-10 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d8a653] px-6 py-3 text-base font-bold text-[#173746] shadow-lg shadow-black/30 transition-all hover:bg-[#e1b765]"
            >
              Start your free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-[#d8a653]/10 bg-[#173746] py-20 lg:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto mb-14 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">Pricing</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              One plan. One price. Everything included.
            </h2>
            <p className="mt-4 text-[#b1c0c0]">
              No per-user fees, no hidden add-ons, no long-term contract. Just straightforward software for running your shop.
            </p>
          </div>

          <div className="reveal mx-auto max-w-lg">
            <div className="relative overflow-hidden rounded-3xl border border-[#d8a653]/30 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-2xl shadow-black/40">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#d8a653]/10 blur-3xl" />
              <div className="relative">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Garage HQ Standard</h3>
                  <span className="rounded-full bg-[#d8a653]/15 px-3 py-1 text-xs font-bold text-[#e1b765]">Everything included</span>
                </div>
                <p className="text-sm text-[#b1c0c0]">The complete shop management platform.</p>

                <div className="mt-6 flex items-end gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-white">$159.99</span>
                  <span className="mb-1.5 text-sm font-medium text-[#b1c0c0]">/month</span>
                </div>
                <p className="mt-1 text-xs text-[#667b80]">Free trial • No setup fees • Cancel anytime</p>

                <Link
                  to="/signup"
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d8a653] px-6 py-4 text-base font-bold text-[#173746] shadow-lg shadow-black/30 transition-all hover:bg-[#e1b765]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <ul className="mt-7 space-y-3">
                  {PRICING_FEATURES.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#dbe4e5]">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#d8a653]" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">FAQ</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Questions, answered.
            </h2>
          </div>

          <div className="reveal space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    isOpen ? 'border-[#d8a653]/40 bg-white/[0.06]' : 'border-[#d8a653]/15 bg-white/[0.03]'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-white sm:text-base">{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#d8a653] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className="grid transition-all duration-300"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed text-[#b1c0c0]">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-[#d8a653]/10 bg-gradient-to-br from-[#234b5a] via-[#173746] to-[#173746] py-20 lg:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d8a653]/15 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="reveal text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            YOUR SHOP DESERVES<br />
            <span className="bg-gradient-to-r from-[#d8a653] to-[#e1b765] bg-clip-text text-transparent">
              BETTER THAN PAPERWORK.
            </span>
          </h2>
          <p className="reveal mx-auto mt-5 max-w-xl text-[#dbe4e5]">
            Join the independent shop owners running smarter, cleaner, and more profitable businesses with Garage HQ.
          </p>
          <div className="reveal mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d8a653] px-8 py-4 text-base font-bold text-[#173746] shadow-lg shadow-black/30 transition-all hover:bg-[#e1b765] sm:w-auto"
            >
              Start Using Garage HQ
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8a653]/30 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-[#d8a653]/10 bg-[#173746] py-20 lg:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="reveal">
              <span className="text-sm font-semibold uppercase tracking-widest text-[#d8a653]">Contact</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Talk to the Garage HQ team.
              </h2>
              <p className="mt-4 text-[#b1c0c0]">
                Questions about setup, features, or whether Garage HQ fits your shop? Send us a message and we'll get back to you within one business day.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-[#dbe4e5]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d8a653]/15 text-[#d8a653]"><Mail className="h-5 w-5" /></div>
                  support@garagehq.com
                </div>
                <div className="flex items-center gap-3 text-sm text-[#dbe4e5]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d8a653]/15 text-[#d8a653]"><Phone className="h-5 w-5" /></div>
                  (800) 555-0142
                </div>
                <div className="flex items-center gap-3 text-sm text-[#dbe4e5]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d8a653]/15 text-[#d8a653]"><MapPin className="h-5 w-5" /></div>
                  Available nationwide — remote demos daily
                </div>
              </div>
            </div>

            <form onSubmit={handleContact} className="reveal rounded-2xl border border-[#d8a653]/15 bg-white/[0.04] p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#b1c0c0]">Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-lg border border-[#d8a653]/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-[#667b80] outline-none transition-colors focus:border-[#d8a653]/50 focus:ring-2 focus:ring-[#d8a653]/20"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#b1c0c0]">Shop Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-[#d8a653]/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-[#667b80] outline-none transition-colors focus:border-[#d8a653]/50 focus:ring-2 focus:ring-[#d8a653]/20"
                    placeholder="Your shop"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#b1c0c0]">Email</label>
                  <input
                    required
                    type="email"
                    className="w-full rounded-lg border border-[#d8a653]/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-[#667b80] outline-none transition-colors focus:border-[#d8a653]/50 focus:ring-2 focus:ring-[#d8a653]/20"
                    placeholder="you@yourshop.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#b1c0c0]">Message</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[#d8a653]/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-[#667b80] outline-none transition-colors focus:border-[#d8a653]/50 focus:ring-2 focus:ring-[#d8a653]/20"
                    placeholder="Tell us about your shop or what you'd like to know..."
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d8a653] px-6 py-3 text-sm font-bold text-[#173746] transition-all hover:bg-[#e1b765]"
              >
                {contactSent ? (
                  <><CheckCircle2 className="h-4 w-4" /> Message sent — we'll be in touch</>
                ) : (
                  <>Send Message <ArrowUpRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#d8a653]/15 bg-[#0f2530] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link to="/" className="flex items-center gap-2.5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#d8a653] to-[#b9852c]">
                <Wrench className="h-5 w-5 text-[#173746]" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Garage <span className="text-[#d8a653]">HQ</span>
              </span>
            </Link>
            <p className="text-center text-xs text-[#667b80]">
              The command center for independent automotive repair shops.<br />
              <span className="text-[#49636b]">Run Your Shop. Not Your Paperwork.</span>
            </p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-[#b1c0c0] hover:text-white">Log In</Link>
              <Link to="/signup" className="rounded-lg bg-[#d8a653] px-4 py-2 text-sm font-semibold text-[#173746] transition-colors hover:bg-[#e1b765]">Get Started</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-[#d8a653]/10 pt-6 text-center text-xs text-[#49636b]">
            &copy; {new Date().getFullYear()} Garage HQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
