export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold tracking-tight text-zinc-900">
          Nexum
        </span>
        <p className="mt-1 text-sm text-zinc-500">
          Das Betriebssystem für Menschen, die Menschen begleiten.
        </p>
      </div>
      {children}
    </div>
  )
}
