import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404: no route for", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="font-display text-2xl font-bold text-ink">Page not found</h1>
      <Link to="/" className="font-mono text-sm text-accent hover:opacity-80">
        Return home
      </Link>
    </div>
  );
}
