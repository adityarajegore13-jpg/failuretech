export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex items-center justify-center p-4 cyber-grid relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-cyan-600/15 blur-[140px]" />
      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}
