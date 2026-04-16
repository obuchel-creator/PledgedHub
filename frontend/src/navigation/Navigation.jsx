export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Always call useAuth at the top level (never conditionally)
  const auth = useAuth();
  const user = auth && auth.user ? auth.user : null;

  function handleLogout(e) {
    e.preventDefault();
    if (auth && typeof auth.logout === 'function') {
      auth.logout();
    } else {
      // fallback: no-op
      console.warn('Logout not available');
    }
    setMenuOpen(false);
  }

  const menuVisible = !isMobile || menuOpen;
  const menuId = 'main-navigation-menu';

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'relative',
        borderBottom: '1px solid #e6e6e6',
        padding: '0.5rem 1rem',
        background: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <a
          href={import.meta.env.BASE_URL}
          style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: '#111',
            textDecoration: 'none',
          }}
        >
          Brand
        </a>

        {isMobile && (
          <button
            aria-controls={menuId}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((s) => !s)}
            style={{
              border: '1px solid #ccc',
              background: '#fff',
              padding: '0.35rem 0.5rem',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        )}
      </div>

      <ul
        id={menuId}
        role="menubar"
        style={{
          display: menuVisible ? 'flex' : 'none',
          listStyle: 'none',
          margin: 0,
          padding: isMobile ? '0.5rem 0' : 0,
          gap: '0.75rem',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          position: isMobile ? 'absolute' : 'static',
          left: isMobile ? 0 : undefined,
          right: isMobile ? 0 : undefined,
          top: isMobile ? '100%' : undefined,
          background: isMobile ? '#fff' : undefined,
          borderTop: isMobile ? '1px solid #eee' : undefined,
          boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.06)' : undefined,
          paddingInlineStart: 0,
          zIndex: 50,
        }}
      >
        <li role="none" style={{ margin: isMobile ? '0.25rem 1rem' : 0 }}>
          <a role="menuitem" href={`${import.meta.env.BASE_URL}dashboard`} style={{ textDecoration: 'none', color: '#0366d6' }}>
            Dashboard
          </a>
        </li>

        <li role="none" style={{ margin: isMobile ? '0.25rem 1rem' : 0 }}>
          <a role="menuitem" href={`${import.meta.env.BASE_URL}fundraise`} style={{ textDecoration: 'none', color: '#0366d6' }}>
            Fundraise
          </a>
        </li>

        <li role="none" style={{ margin: isMobile ? '0.25rem 1rem' : 0 }}>
          <a role="menuitem" href={`${import.meta.env.BASE_URL}about`} style={{ textDecoration: 'none', color: '#0366d6' }}>
            About
          </a>
        </li>

        {!user && (
          <>
            <li role="none" style={{ margin: isMobile ? '0.25rem 1rem' : 0 }}>
              <a role="menuitem" href={`${import.meta.env.BASE_URL}login`} style={{ textDecoration: 'none', color: '#0366d6' }}>
                Login
              </a>
            </li>
            <li role="none" style={{ margin: isMobile ? '0.25rem 1rem' : 0 }}>
              <a
                role="menuitem"
                href={`${import.meta.env.BASE_URL}register`}
                style={{ textDecoration: 'none', color: '#0366d6' }}
              >
                Register
              </a>
            </li>
          </>
        )}

        {user && (
          <li
            role="none"
            style={{
              margin: isMobile ? '0.25rem 1rem' : 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span aria-hidden style={{ color: '#111' }}>
              {user.name || user.username || 'User'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                border: '1px solid #ccc',
                background: '#fff',
                padding: '0.25rem 0.5rem',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}


