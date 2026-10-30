import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="notfound">
      <p className="notfound__code rainbow-text">404</p>
      <h1 className="h2">This page took a different learning path.</h1>
      <Link href="/" className="btn btn--primary">
        <span className="btn__label">Back to home</span>
        <span className="btn__arrow">→</span>
      </Link>
    </main>
  );
}
