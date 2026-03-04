/**
 * Matrix represents a 2D affine transformation matrix.
 * Layout (Pixman style):
 * [ a  c  tx ]
 * [ b  d  ty ]
 * [ 0  0  1  ]
 */
export class Matrix {
  constructor(
    public a: number = 1,
    public b: number = 0,
    public c: number = 0,
    public d: number = 1,
    public tx: number = 0,
    public ty: number = 0,
  ) {}

  /**
   * Creates an identity matrix.
   */
  static identity(): Matrix {
    return new Matrix(1, 0, 0, 1, 0, 0);
  }

  /**
   * Creates a translation matrix.
   */
  static translation(tx: number, ty: number): Matrix {
    return new Matrix(1, 0, 0, 1, tx, ty);
  }

  /**
   * Creates a scaling matrix.
   */
  static scaling(sx: number, sy: number): Matrix {
    return new Matrix(sx, 0, 0, sy, 0, 0);
  }

  /**
   * Creates a rotation matrix (angle in radians).
   */
  static rotation(angle: number): Matrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Matrix(cos, sin, -sin, cos, 0, 0);
  }

  /**
   * Multiplies this matrix by another matrix (this * other).
   */
  multiply(other: Matrix): Matrix {
    return new Matrix(
      this.a * other.a + this.c * other.b,
      this.b * other.a + this.d * other.b,
      this.a * other.c + this.c * other.d,
      this.b * other.c + this.d * other.d,
      this.a * other.tx + this.c * other.ty + this.tx,
      this.b * other.tx + this.d * other.ty + this.ty,
    );
  }

  /**
   * Returns the inverse of this matrix.
   * Throws an error if the matrix is singular (not invertible).
   */
  invert(): Matrix {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is not invertible');
    }

    const invDet = 1 / det;
    return new Matrix(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.ty - this.d * this.tx) * invDet,
      (this.b * this.tx - this.a * this.ty) * invDet,
    );
  }

  /**
   * Applies the transformation to a point (x, y).
   */
  apply(x: number, y: number): { x: number; y: number } {
    return {
      x: this.a * x + this.c * y + this.tx,
      y: this.b * x + this.d * y + this.ty,
    };
  }

  /**
   * Applies the inverse transformation to a point (x, y).
   */
  applyInverse(x: number, y: number): { x: number; y: number } {
    return this.invert().apply(x, y);
  }

  /**
   * Returns true if the matrix is identity (no transform).
   */
  public isIdentity(): boolean {
    return (
      Math.abs(this.a - 1) < 1e-10 &&
      Math.abs(this.b) < 1e-10 &&
      Math.abs(this.c) < 1e-10 &&
      Math.abs(this.d - 1) < 1e-10 &&
      Math.abs(this.tx) < 1e-10 &&
      Math.abs(this.ty) < 1e-10
    );
  }

  /**
   * Returns true if the matrix only represents an integer translation.
   */
  public isIntegerTranslation(): boolean {
    return (
      Math.abs(this.a - 1) < 1e-10 &&
      Math.abs(this.b) < 1e-10 &&
      Math.abs(this.c) < 1e-10 &&
      Math.abs(this.d - 1) < 1e-10 &&
      Number.isInteger(this.tx) &&
      Number.isInteger(this.ty)
    );
  }
}
