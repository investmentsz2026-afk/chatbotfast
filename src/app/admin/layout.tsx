export const maxDuration = 60; // Allow up to 60 seconds for Vercel Serverless

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
