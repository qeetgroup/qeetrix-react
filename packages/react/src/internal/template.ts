/** Fill a catalogue string's `{name}` slots: `fill("Remove {label}", { label: "Admin" })`. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (slot, name: string) =>
    name in values ? String(values[name]) : slot,
  );
}
