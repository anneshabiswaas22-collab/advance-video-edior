import { compileRestrictedExpression, RESTRICTED_EXPRESSION_LIMITS, type RestrictedExpression } from "../motion/restricted-expression";

export interface ExpressionContext {
  time: number;
  value: any;
  velocity: number;
  fps: number;
  width: number;
  height: number;

  wiggle: (freq: number, amp: number) => number;
  smooth: (width?: number, samples?: number) => number;
  linear: (
    t: number,
    tMin: number,
    tMax: number,
    value1: number,
    value2: number,
  ) => number;
  ease: (
    t: number,
    tMin: number,
    tMax: number,
    value1: number,
    value2: number,
  ) => number;
  easeIn: (
    t: number,
    tMin: number,
    tMax: number,
    value1: number,
    value2: number,
  ) => number;
  easeOut: (
    t: number,
    tMin: number,
    tMax: number,
    value1: number,
    value2: number,
  ) => number;
  clamp: (value: number, min: number, max: number) => number;
  random: (min?: number, max?: number) => number;
  noise: (x: number) => number;
}

export class ExpressionEngine {
  private cache = new Map<string, RestrictedExpression>();

  evaluate(expression: string, context: ExpressionContext): any {
    // Reject before caching so large project strings cannot accumulate here.
    if (expression.length > RESTRICTED_EXPRESSION_LIMITS.sourceLength) return 0;
    if (!this.cache.has(expression)) {
      if (this.cache.size >= 256) {
        const oldest = this.cache.keys().next().value;
        if (oldest !== undefined) this.cache.delete(oldest);
      }
      this.cache.set(expression, this.compile(expression));
    }

    const fn = this.cache.get(expression)!;
    let remainingOperations = 1024;
    const consumeOperation = () => {
      if (--remainingOperations < 0) throw new Error("Expression operation limit exceeded");
    };
    return fn({
      ...this.createSafeContext(),
      time: context.time,
      value: context.value,
      velocity: context.velocity,
      fps: context.fps,
      width: context.width,
      height: context.height,
      wiggle: (freq: number, amp: number) => this.wiggle(context.time, freq, amp),
      smooth: (width = 5, samples = 5) =>
        this.smooth(context.value, width, samples, consumeOperation),
    }, consumeOperation);
  }

  private compile(expression: string): RestrictedExpression {
    try {
      return compileRestrictedExpression(expression, [
        ...Object.keys(this.createSafeContext()),
        "time", "value", "velocity", "fps", "width", "height",
      ]);
    } catch {
      return () => 0;
    }
  }

  private createSafeContext() {
    return {
      Math,
      wiggle: this.wiggle.bind(this),
      smooth: this.smooth.bind(this),
      linear: this.linear.bind(this),
      ease: this.ease.bind(this),
      easeIn: this.easeIn.bind(this),
      easeOut: this.easeOut.bind(this),
      clamp: this.clamp.bind(this),
      random: Math.random,
      noise: this.perlinNoise.bind(this),
    };
  }

  private wiggle(time: number, freq: number, amp: number): number {
    const seed = Math.floor(time * freq);
    const t = (time * freq) % 1;

    const v1 = this.pseudoRandom(seed) * amp;
    const v2 = this.pseudoRandom(seed + 1) * amp;

    return v1 + (v2 - v1) * this.smoothstep(t);
  }

  private smooth(
    values: unknown,
    width: number = 5,
    samples: number = 5,
    consumeOperation: () => void = () => {},
  ): number {
    if (!Number.isFinite(width) || width < 0 ||
        !Number.isSafeInteger(samples) || samples < 1 || samples > 256) {
      throw new Error("smooth requires finite width and 1–256 integer samples");
    }
    if (typeof values === "number" && Number.isFinite(values)) return values;
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("smooth requires a numeric value or non-empty numeric history");
    }
    let sum = 0;
    for (let i = 0; i < samples; i++) {
      consumeOperation();
      const idx = Math.max(0, values.length - 1 - i);
      const sample: unknown = values[idx];
      if (typeof sample !== "number" || !Number.isFinite(sample)) {
        throw new Error("smooth requires finite numeric samples");
      }
      sum += sample;
    }
    return sum / samples;
  }

  private linear(
    t: number,
    tMin: number,
    tMax: number,
    value1: number,
    value2: number,
  ): number {
    if (t <= tMin) return value1;
    if (t >= tMax) return value2;

    const progress = (t - tMin) / (tMax - tMin);
    return value1 + (value2 - value1) * progress;
  }

  private ease(
    t: number,
    tMin: number,
    tMax: number,
    value1: number,
    value2: number,
  ): number {
    if (t <= tMin) return value1;
    if (t >= tMax) return value2;

    const progress = (t - tMin) / (tMax - tMin);
    const eased = progress * progress * (3 - 2 * progress);
    return value1 + (value2 - value1) * eased;
  }

  private easeIn(
    t: number,
    tMin: number,
    tMax: number,
    value1: number,
    value2: number,
  ): number {
    if (t <= tMin) return value1;
    if (t >= tMax) return value2;

    const progress = (t - tMin) / (tMax - tMin);
    return value1 + (value2 - value1) * progress * progress;
  }

  private easeOut(
    t: number,
    tMin: number,
    tMax: number,
    value1: number,
    value2: number,
  ): number {
    if (t <= tMin) return value1;
    if (t >= tMax) return value2;

    const progress = (t - tMin) / (tMax - tMin);
    return value1 + (value2 - value1) * (1 - (1 - progress) * (1 - progress));
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private pseudoRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  private perlinNoise(x: number): number {
    const xi = Math.floor(x);
    const xf = x - xi;

    const u = xf * xf * (3 - 2 * xf);

    const a = this.pseudoRandom(xi);
    const b = this.pseudoRandom(xi + 1);

    return a + (b - a) * u;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const expressionEngine = new ExpressionEngine();
