export function units(value: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(String(value));
  if (!match) throw new Error("Invalid decimal quantity");
  return (
    BigInt(match[1]) * 1_000_000n + BigInt((match[2] || "").padEnd(6, "0"))
  );
}
export function formatUnits(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const fraction = (absolute % 1_000_000n)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return `${sign}${absolute / 1_000_000n}${fraction ? "." + fraction : ""}`;
}
export function positiveQuantity(value: string): boolean {
  try {
    return units(value) > 0n;
  } catch {
    return false;
  }
}
export function canPack(
  picked: string,
  alreadyPacked: string,
  requested: string,
): boolean {
  try {
    return (
      positiveQuantity(requested) &&
      units(requested) <= units(picked) - units(alreadyPacked)
    );
  } catch {
    return false;
  }
}
export const requiresLot = (mode?: string) =>
  mode === "LOT" || mode === "LOT_AND_SERIAL";
export const requiresSerial = (mode?: string) =>
  mode === "SERIAL" || mode === "LOT_AND_SERIAL";
export function poActions(
  status: string,
  permissions: string[],
  hasLines: boolean,
) {
  return {
    submit:
      status === "DRAFT" &&
      hasLines &&
      permissions.includes("purchase-order:update"),
    approve:
      status === "SUBMITTED" && permissions.includes("purchase-order:approve"),
    markSent:
      status === "APPROVED" && permissions.includes("purchase-order:update"),
  };
}
export function remainingToAllocate(
  ordered: string,
  allocated: string,
): string {
  const remaining = units(ordered) - units(allocated);
  return formatUnits(remaining < 0n ? 0n : remaining);
}
