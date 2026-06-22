/**
 * One-Euro filter for smoothing the fingertip position.
 *
 * Adaptive low-pass: smooths heavily when the value is near-still (kills jitter)
 * and lightly when it moves fast (keeps latency low). Standard fix for noisy
 * real-time landmarks, and a better choice than a fixed-factor moving average.
 *
 * Reference: Casiez, Roussel, Vogel, "1e Filter" (CHI 2012).
 */

import type { Point } from "./landmarks";

interface OneEuroParams {
  /** Minimum cutoff frequency (Hz). Lower = more smoothing when still. */
  minCutoff: number;
  /** Speed coefficient. Higher = less lag when moving fast. */
  beta: number;
  /** Cutoff for the derivative filter (Hz). */
  dCutoff: number;
}

const DEFAULTS: OneEuroParams = { minCutoff: 1.2, beta: 0.03, dCutoff: 1.0 };

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

class ScalarFilter {
  private xPrev = 0;
  private dxPrev = 0;
  private tPrev = 0;
  private started = false;
  private readonly p: OneEuroParams;

  constructor(p: OneEuroParams) {
    this.p = p;
  }

  filter(x: number, tSeconds: number): number {
    if (!this.started) {
      this.started = true;
      this.xPrev = x;
      this.tPrev = tSeconds;
      return x;
    }
    const dt = Math.max(tSeconds - this.tPrev, 1e-6);
    this.tPrev = tSeconds;

    const dx = (x - this.xPrev) / dt;
    const aD = alpha(this.p.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = dxHat;

    const cutoff = this.p.minCutoff + this.p.beta * Math.abs(dxHat);
    const a = alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;
    return xHat;
  }
}

/** One-Euro filter for a single 2D point. */
export class Point2DFilter {
  private fx: ScalarFilter;
  private fy: ScalarFilter;

  constructor(params: OneEuroParams = DEFAULTS) {
    this.fx = new ScalarFilter(params);
    this.fy = new ScalarFilter(params);
  }

  filter(p: Point, tSeconds: number): Point {
    return {
      x: this.fx.filter(p.x, tSeconds),
      y: this.fy.filter(p.y, tSeconds),
    };
  }
}
