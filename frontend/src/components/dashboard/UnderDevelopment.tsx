export default function UnderDevelopment({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-10 text-center">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-sm opacity-70">
        This section is currently under development.
      </p>
    </div>
  );
}
