import { Prisma } from "@prisma/client";

// Every currency value is stored as NUMERIC(12,2). Arithmetic stays in Decimal
// so cents never drift; only the API boundary converts to a JSON number.
export function toDecimal(value: number | string | Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function toAmount(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return new Prisma.Decimal(value).toDecimalPlaces(2).toNumber();
}

export function isPositive(value: Prisma.Decimal): boolean {
  return value.greaterThan(0);
}
