export default function EmptyState({ icon = '⚡', title, subtitle }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <p className="mb-2 text-4xl">{icon}</p>
      <p className="text-lg">{title}</p>
      {subtitle && <p className="text-sm">{subtitle}</p>}
    </div>
  );
}
