/**
 * 16.16 Fixed-point arithmetic utilities.
 * Simulates Pixman's internal coordinate and color math.
 */
export class Fixed {
  public static readonly FRACTION_BITS = 16;
  public static readonly ONE = 1 << Fixed.FRACTION_BITS;

  /**
   * Converts a floating point number to a 16.16 fixed-point representation.
   */
  public static fromFloat(f: number): number {
    return Math.round(f * Fixed.ONE) | 0; // Use bitwise OR to ensure 32-bit signed int
  }

  /**
   * Converts a 16.16 fixed-point number back to a floating point.
   */
  public static toFloat(fixed: number): number {
    return fixed / Fixed.ONE;
  }

  /**
   * Converts a 16.16 fixed-point number to an integer (floor).
   */
  public static toInt(fixed: number): number {
    return fixed >> Fixed.FRACTION_BITS;
  }

  /**
   * Addition of two 16.16 fixed-point numbers.
   */
  public static add(a: number, b: number): number {
    return (a + b) | 0;
  }

  /**
   * Subtraction of two 16.16 fixed-point numbers.
   */
  public static sub(a: number, b: number): number {
    return (a - b) | 0;
  }

  /**
   * Multiplication of two 16.16 fixed-point numbers.
   * Result is a * b / 2^16.
   */
  public static mul(a: number, b: number): number {
    // We use BigInt to avoid overflow during intermediate 32*32 multiplication
    const res = (BigInt(a) * BigInt(b)) >> BigInt(Fixed.FRACTION_BITS);
    return Number(res) | 0;
  }
}
