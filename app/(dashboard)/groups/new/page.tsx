import { CreateCourseForm } from './create-course-form'

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Neue Veranstaltung</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Kurs, Seminar, Workshop oder Gruppenveranstaltung anlegen
        </p>
      </div>
      <CreateCourseForm />
    </div>
  )
}
