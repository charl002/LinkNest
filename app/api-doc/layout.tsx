export default function SwaggerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 overflow-auto pb-20 px-4">{children}</div>
    </div>
  );
}
