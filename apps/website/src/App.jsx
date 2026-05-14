import { useEffect, useMemo, useState } from 'react';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Tokens', path: '/tokens' }
];

const SITE_COPY = {
  heroTitle: 'Build useful things. Run them well.',
  heroBody:
    'Stoffer Industries is a builder\'s workshop for digital products, systems, and experiments designed to compound over time.',
  positioning:
    'We build practical digital products, internal tools, and operating systems for better work — with speed, precision, and long-term thinking.',
  principles: [
    'Start simple, then sharpen what proves useful.',
    'Ship early enough to learn, but not so early it wastes trust.',
    'Turn messy workflows into durable systems.',
    'Use automation to remove repetition and free up focus.'
  ],
  focus: [
    'Focused software products',
    'Internal tools and workflow automation',
    'Experiments that can grow into durable digital businesses'
  ],
  aboutBody:
    'Stoffer Industries is the company behind Tom Stoffer\'s builder-operator work: a home for software products, workflow systems, and experiments that solve real problems without unnecessary complexity.',
  contactBody:
    'If you want to collaborate, compare notes, or see what is being built, get in touch.'
};

function getPathname() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

function usePathname() {
  const [pathname, setPathname] = useState(getPathname());

  useEffect(() => {
    function handlePopState() {
      setPathname(getPathname());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(path) {
    if (path === pathname) return;
    window.history.pushState({}, '', path);
    setPathname(path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  return { pathname, navigate };
}

function Shell({ pathname, navigate, children }) {
  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={(event) => {
          event.preventDefault();
          navigate('/');
        }}>
          <span className="brand-kicker">SIN</span>
          <span className="brand-name">Stoffer Industries</span>
        </a>
        <nav className="nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={pathname === item.path ? 'nav-link active' : 'nav-link'}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.path);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <p>Built with intent in Auckland, New Zealand.</p>
        <a href="mailto:tom@stofferindustries.com">tom@stofferindustries.com</a>
      </footer>
    </div>
  );
}

function HomePage({ navigate }) {
  return (
    <>
      <section className="hero panel">
        <p className="eyebrow">Builder-operator company</p>
        <h1>{SITE_COPY.heroTitle}</h1>
        <p className="lede">{SITE_COPY.heroBody}</p>
        <div className="hero-actions">
          <a className="btn primary" href="mailto:tom@stofferindustries.com">Start a conversation</a>
          <button className="btn secondary" onClick={() => navigate('/about')}>How we work</button>
        </div>
      </section>

      <section className="grid two-up">
        <article className="panel">
          <p className="eyebrow">What Stoffer Industries is</p>
          <h2>Practical systems over performative noise.</h2>
          <p>{SITE_COPY.positioning}</p>
        </article>
        <article className="panel accent-panel">
          <p className="eyebrow">Current focus</p>
          <ul>
            {SITE_COPY.focus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Operating principles</p>
        <div className="principles-grid">
          {SITE_COPY.principles.map((principle) => (
            <article key={principle} className="principle-card">
              <span className="principle-marker" aria-hidden="true">▸</span>
              <p>{principle}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <section className="page-stack">
      <div className="panel page-intro">
        <p className="eyebrow">About</p>
        <h1>A builder\'s shop for modern software.</h1>
        <p className="lede">{SITE_COPY.aboutBody}</p>
      </div>
      <div className="grid two-up">
        <article className="panel">
          <p className="eyebrow">Why it exists</p>
          <p>
            The goal is simple: create useful tools, products, and systems that make work clearer,
            faster, and more durable.
          </p>
        </article>
        <article className="panel">
          <p className="eyebrow">How it works</p>
          <p>
            Stoffer Industries ships in small, focused slices. Learn quickly. Keep what works. Build
            the operating system behind better products.
          </p>
        </article>
      </div>
      <article className="panel founder-note">
        <p className="eyebrow">Founder note</p>
        <p>
          Founded by Tom Stoffer — product-minded engineering leader, systems thinker, and builder.
          This company is the home for the products and workflows he wants to own for the long term.
        </p>
      </article>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="page-stack">
      <div className="panel page-intro">
        <p className="eyebrow">Contact</p>
        <h1>Open line. Clear signal.</h1>
        <p className="lede">{SITE_COPY.contactBody}</p>
      </div>
      <div className="grid two-up">
        <article className="panel">
          <p className="eyebrow">Email</p>
          <a className="contact-link" href="mailto:tom@stofferindustries.com">tom@stofferindustries.com</a>
          <p className="muted">Best for collaborations, intros, and product conversations.</p>
        </article>
        <article className="panel">
          <p className="eyebrow">What to include</p>
          <ul>
            <li>What you are building or exploring</li>
            <li>Why you think it overlaps</li>
            <li>Any useful links or context</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

const TOKEN_SWATCHES = [
  ['Canvas', 'var(--si-color-bg-canvas)'],
  ['Surface', 'var(--si-color-bg-surface)'],
  ['Primary text', 'var(--si-color-text-primary)'],
  ['Muted text', 'var(--si-color-text-muted)'],
  ['Brand', 'var(--si-color-brand-500)'],
  ['Success', 'var(--si-color-success-500)'],
  ['Danger', 'var(--si-color-danger-500)'],
  ['Sage', 'var(--si-color-sage-500)'],
  ['Accent pink', 'var(--si-color-accent-500)']
];

const TOKEN_LABELS = [
  ['Green', 'var(--si-color-label-green)'],
  ['Blue', 'var(--si-color-label-blue)'],
  ['Orange', 'var(--si-color-label-orange)'],
  ['Purple', 'var(--si-color-label-purple)'],
  ['Gray', 'var(--si-color-label-gray)']
];

const TOKEN_SPACES = ['1', '2', '3', '4', '5', '6', '7', '8', '10'];
const TOKEN_RADII = ['sm', 'md', 'lg', 'xl', 'pill'];

function TokensPage() {
  return (
    <section className="page-stack token-specimen">
      <div className="panel page-intro">
        <p className="eyebrow">Design tokens</p>
        <h1>CSS token specimen.</h1>
        <p className="lede">
          This page renders the web view of the shared token contract from
          <code>@sindustries/design-tokens/styles.css</code>.
        </p>
      </div>

      <section className="panel token-section">
        <p className="eyebrow">Color</p>
        <div className="token-swatch-grid">
          {TOKEN_SWATCHES.map(([label, value]) => (
            <article className="token-swatch-card" key={label}>
              <span className="token-swatch" style={{ background: value }} />
              <strong>{label}</strong>
              <code>{value}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="panel token-section">
        <p className="eyebrow">Color Labels</p>
        <div className="token-swatch-grid">
          {TOKEN_LABELS.map(([label, value]) => (
            <article className="token-swatch-card" key={label}>
              <span className="token-swatch" style={{ background: value }} />
              <strong>{label}</strong>
              <code>{value}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="grid two-up">
        <article className="panel token-section">
          <p className="eyebrow">Typography</p>
          <p className="token-display">Display face</p>
          <p className="token-ui">UI label and controls</p>
          <p className="token-body">Body copy for longer readable text.</p>
        </article>

        <article className="panel token-section">
          <p className="eyebrow">Shape and space</p>
          <div className="space-stack">
            {TOKEN_SPACES.map((space) => (
              <span key={space} style={{ width: `var(--si-space-${space})` }} />
            ))}
          </div>
          <div className="radius-grid">
            {TOKEN_RADII.map((radius) => (
              <span key={radius} style={{ borderRadius: `var(--si-radius-${radius})` }}>
                {radius}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="panel token-section token-component-row">
        <p className="eyebrow">Component sample</p>
        <div className="token-mini-card">
          <strong>Budget card</strong>
          <p>Shared surface, text, spacing, radius, and semantic status colors.</p>
        </div>
        <button className="btn primary">Primary action</button>
        <span className="token-chip">Review needed</span>
      </section>
    </section>
  );
}

export function App() {
  const { pathname, navigate } = usePathname();

  const page = useMemo(() => {
    if (pathname === '/about') return <AboutPage />;
    if (pathname === '/contact') return <ContactPage />;
    if (pathname === '/tokens') return <TokensPage />;
    return <HomePage navigate={navigate} />;
  }, [navigate, pathname]);

  return <Shell pathname={pathname} navigate={navigate}>{page}</Shell>;
}
