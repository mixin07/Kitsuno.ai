import { Link } from 'react-router-dom'

export default function StudentArea() {
  return (
    <section className="max-w-2xl">
      <p className="ks-page-eyebrow">
        AUTHENTICATED · STUDENT
      </p>
      <h1 className="font-serif text-3xl font-normal tracking-tight text-[#241A16] sm:text-4xl">
        Student Area
      </h1>
      <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
        This is a placeholder route to verify role-based access.
      </p>
      <Link
        to="/student"
        className="mt-6 inline-block text-xs font-bold text-[#E8590C] hover:underline"
      >
        ← Go to Student Dashboard
      </Link>
    </section>
  )
}