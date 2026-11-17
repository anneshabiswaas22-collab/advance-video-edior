import { describe, expect, it } from "vitest";
import { compileRestrictedExpression, RESTRICTED_EXPRESSION_LIMITS } from "./restricted-expression";

const scope = { value: 10, time: 0.5, Math, clamp: (value: number, low: number, high: number) => Math.min(high, Math.max(low, value)) };
const compile = (code: string) => compileRestrictedExpression(code, Object.keys(scope));

describe("restricted expression language", () => {
  it("evaluates numeric expressions, conditions and immutable local bindings", () => {
    expect(compile("value + Math.sin(time * Math.PI) * 2")(scope)).toBe(12);
    expect(compile("const doubled = value * 2; return time > 0 ? clamp(doubled, 0, 15) : 0;")(scope)).toBe(15);
    expect(compile("time < 0 && clamp(1, 0, 2) || value")(scope)).toBe(10);
  });

  it.each([
    'globalThis.location',
    'window.localStorage',
    'document.cookie',
    'fetch("https://invalid.example")',
    'Function("return 1")()',
    'eval("1")',
    'Math.constructor',
    'Math.sin.constructor("return 1")()',
    'Math["sin"](time)',
    'Math.__proto__',
    'Math.prototype',
    'value = 2',
    'value++',
    'delete Math.PI',
    '(() => 1)()',
    'new Date()',
    'while (true) {}',
    'for (;;) {}',
    'return (function recurse() { return recurse(); })()',
    'const value = 2; return value;',
    'let x = 1; return x;',
    'const x = {}; return x;',
    'const x = []; return x;',
    'const x = /a/; return 1;',
    'true ? 1 : globalThis.location',
    'const x = 1; return x; fetch("https://invalid.example")',
  ])("rejects unsupported code before evaluation: %s", (source) => {
    expect(() => compile(source)).toThrow();
  });

  it("never traverses prototypes or function members", () => {
    expect(() => compile("Math.toString()")(scope)).toThrow("unavailable");
    expect(() => compile("clamp.call(null, 1, 0, 2)")(scope)).toThrow("unavailable");
  });

  it("allows trusted handle reads and curried capabilities without exposing prototypes", () => {
    const handles = { thisLayer: { name: "Title", value: () => 7 }, effect: () => () => 3 };
    const code = 'thisLayer.name.length + thisLayer.value("opacity") + effect("Blur")("radius")';
    expect(compileRestrictedExpression(code, Object.keys(handles))(handles)).toBe(15);
  });

  it("bounds source length, AST size, nesting and call arguments", () => {
    expect(() => compile("1".repeat(RESTRICTED_EXPRESSION_LIMITS.sourceLength + 1))).toThrow("length");
    expect(() => compile(Array(140).fill("1").join("+"))).toThrow("complexity");
    expect(() => compile("Math.sin(".repeat(40) + "1" + ")".repeat(40))).toThrow("complexity");
    expect(() => compile("Math.max(" + Array(17).fill("1").join(",") + ")")).toThrow("argument");
  });

  it("shares an operation budget with the host rather than trusting helper recursion", () => {
    let remaining = 2;
    expect(() => compile("value + time")(scope, () => {
      if (--remaining < 0) throw new Error("shared budget exhausted");
    })).toThrow("budget");
  });

  it("rejects object coercion, capability arguments and string amplification", () => {
    expect(() => compile('"a" + "b"')(scope)).toThrow("requires numbers");
    expect(() => compile("Math.sin(Math)")(scope)).toThrow("primitive");
  });
});
