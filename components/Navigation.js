import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="brand">
          <Image src="/acm-logo.png" alt="ACM logo" width={48} height={48} priority />
          <div>
            <span className="eyebrow">ACM Club · CST</span>
            <h1>CST <span>Zhabto</span></h1>
          </div>
        </div>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
            Home
          </Link>
          <Link href="/providers" className={`nav-link ${pathname === "/providers" ? "active" : ""}`}>
            Service Providers
          </Link>
          <Link href="/admin/login" className="nav-link admin-link">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
