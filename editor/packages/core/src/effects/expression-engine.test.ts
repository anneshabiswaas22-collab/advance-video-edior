import { describe, expect, it } from "vitest";
import { ExpressionEngine, type ExpressionContext } from "./expression-engine";

const context: ExpressionContext = {
  time: 0.5, value: 10, velocity: 0, fps: 24, width: 640, height: 360,
  wiggle: () => 0, smooth: () => 0, linear: () => 0, ease: () => 0,
  easeIn: () => 0, easeOut: () => 0, clamp: () => 0, random: () => 0, noise: () => 0,
};

describe("legacy effects expression engine", () => {
  it("uses numeric context values and the same restricted math helpers", () => {
    const engine = new ExpressionEngine();
    expect(engine.evaluate("value + time * fps", context)).toBe(22);
    expect(engine.evaluate("clamp(value, 0, 5) + Math.sin(Math.PI / 2)", context)).toBe(6);
  });

  it.each([
    "globalThis.__expression_escape = 1", "Math.sin.constructor('return 1')()",
    "while (true) {}", "(() => 1)()",
  ])("rejects arbitrary code: %s", (code) => {
    expect(new ExpressionEngine().evaluate(code, context)).toBe(0);
  });

  it.each(["smooth(1, 1 / 0)", "smooth(1, 1000000)", "smooth(1, -1)", "smooth(1, 1.5)", "smooth(1 / 0, 2)"])("rejects unbounded helper work: %s", (code) => {
    expect(() => new ExpressionEngine().evaluate(code, context)).toThrow("smooth requires");
  });

  it("bounds smoothing and charges each sample to the expression budget", () => {
    const history = { ...context, value: [1, 2, 3, 4] };
    const engine = new ExpressionEngine();
    expect(engine.evaluate("smooth(5, 4)", history)).toBe(2.5);
    expect(() => engine.evaluate(Array(5).fill("smooth(5, 256)").join(" + "), history))
      .toThrow("operation limit");
  });


  it("does not retain oversized source in the compiled-expression cache", () => {
    const engine = new ExpressionEngine();
    expect(engine.evaluate("1".repeat(5000), context)).toBe(0);
    expect((engine as unknown as { cache: Map<string, unknown> }).cache.size).toBe(0);
  });

});
