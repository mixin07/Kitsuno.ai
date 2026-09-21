import { Link } from 'react-router-dom'

export default function StudentArea() {
  return (
    <section className="max-w-2xl">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ks-orange)]">
        Authenticated · STUDENT
      </p>
      <h1 className="font-display text-4xl font-normal tracking-tight text-[var(--ks-text)]">
        Student Area
      </h1>
      <p className="mt-4 text-lg text-[var(--ks-text-muted)]">
        This is a placeholder route to verify role-based access. The student
        dashboard will be built in a later phase.
      </p>
      <Link
        to="/"
        className="mt-8 inline-block font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
      >
        ← Back to home
      </Link>
    </section>
  )
}