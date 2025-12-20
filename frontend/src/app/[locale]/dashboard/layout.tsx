import RequireLegal from "./_components/RequireLegal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RequireLegal />
      {children}
    </>
  );
}
