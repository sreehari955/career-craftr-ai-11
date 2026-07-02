import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} JobTrack-AI. Built for students and freshers.</p>
        <div className="flex flex-wrap justify-center gap-5">
          <Link to="/features" className="hover:text-foreground">Features</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          <Link to="/help" className="hover:text-foreground">Help Centre</Link>
        </div>
      </div>
    </footer>
  );
}
