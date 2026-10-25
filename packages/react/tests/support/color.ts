/** The computed colour a token resolves to here, in the form getComputedStyle reports colours. */
export function tokenColor(token: `--qx-${string}`): string {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}
