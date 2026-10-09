export function GradientSamples() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-card border border-border bg-card p-6">
        <div
          className="h-12 rounded-full bg-primary-gradient"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm font-medium leading-5 text-text-1">
          Primary / top → bottom
        </p>
        <p className="mt-4 text-xs leading-4 text-text-2">
          green-1 → green-2 → green-3
          <br />
          Label #092011 · 500
        </p>
      </div>
      <div className="rounded-card border border-border bg-card p-6">
        <div
          className="h-12 rounded-full bg-accent-gradient"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm font-medium leading-5 text-text-1">
          Accent / top → bottom
        </p>
        <p className="mt-4 text-xs leading-4 text-text-2">
          purple-1 → purple-2 → purple-3
          <br />
          Label #FFFFFF · 500
        </p>
      </div>
    </div>
  );
}
