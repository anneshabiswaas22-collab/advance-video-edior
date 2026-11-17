import { parse, type Expression, type Node, type Program } from "acorn";

/** A small data-expression language, never JavaScript execution. */
export const RESTRICTED_EXPRESSION_LIMITS = {
  sourceLength: 4096,
  nodes: 256,
  depth: 32,
  arguments: 16,
  operations: 1024,
} as const;

const forbiddenNames = new Set(["constructor", "prototype", "__proto__"]);
const binaryOperators = new Set([
  "+", "-", "*", "/", "%", "**", "<", "<=", ">", ">=", "===", "!==",
]);

type Scope = Readonly<Record<string, unknown>>;
export type RestrictedExpression = (
  scope: Scope,
  consumeOperation?: () => void,
) => unknown;

interface Binding {
  readonly name: string;
  readonly value: Expression;
}

function reject(message: string): never {
  throw new SyntaxError(`Restricted expression: ${message}`);
}

/**
 * Accept arithmetic, conditions, whitelisted scope reads/calls and immutable
 * const bindings followed by return. All branches are validated before use;
 * statements, loops, assignment, functions, computed/prototype access and globals
 * are never compiled or executed. Scope values must be host-created capabilities.
 */
export function compileRestrictedExpression(
  source: string,
  scopeNames: readonly string[],
): RestrictedExpression {
  if (source.length > RESTRICTED_EXPRESSION_LIMITS.sourceLength) {
    reject("source length limit exceeded");
  }
  const program: Program = parse(source, {
    ecmaVersion: 2022,
    allowReturnOutsideFunction: true,
  });
  const known = new Set(scopeNames);
  const bindings: Binding[] = [];
  let nodeCount = 0;

  const validate = (node: Node, depth = 0): void => {
    if (++nodeCount > RESTRICTED_EXPRESSION_LIMITS.nodes ||
        depth > RESTRICTED_EXPRESSION_LIMITS.depth) {
      reject("syntax complexity limit exceeded");
    }
    const next = (child: Node) => validate(child, depth + 1);
    switch (node.type) {
      case "Literal": {
        const literal = node as Extract<Expression, { type: "Literal" }>;
        if (literal.regex || literal.bigint ||
            !["number", "string", "boolean"].includes(typeof literal.value) && literal.value !== null) {
          reject("only numeric, string, boolean and null literals are allowed");
        }
        return;
      }
      case "Identifier": {
        const identifier = node as Extract<Expression, { type: "Identifier" }>;
        if (forbiddenNames.has(identifier.name) || !known.has(identifier.name)) {
          reject(`unknown name ${identifier.name}`);
        }
        return;
      }
      case "UnaryExpression": {
        const unary = node as Extract<Expression, { type: "UnaryExpression" }>;
        if (!["+", "-", "!"].includes(unary.operator)) reject("unsupported unary operator");
        next(unary.argument);
        return;
      }
      case "BinaryExpression": {
        const binary = node as Extract<Expression, { type: "BinaryExpression" }>;
        if (!binaryOperators.has(binary.operator)) reject("unsupported binary operator");
        next(binary.left);
        next(binary.right);
        return;
      }
      case "LogicalExpression": {
        const logical = node as Extract<Expression, { type: "LogicalExpression" }>;
        if (!["&&", "||", "??"].includes(logical.operator)) reject("unsupported logical operator");
        next(logical.left);
        next(logical.right);
        return;
      }
      case "ConditionalExpression": {
        const conditional = node as Extract<Expression, { type: "ConditionalExpression" }>;
        next(conditional.test);
        next(conditional.consequent);
        next(conditional.alternate);
        return;
      }
      case "MemberExpression": {
        const member = node as Extract<Expression, { type: "MemberExpression" }>;
        if (member.computed || member.optional || member.property.type !== "Identifier" ||
            forbiddenNames.has(member.property.name)) reject("unsupported member access");
        next(member.object);
        return;
      }
      case "CallExpression": {
        const call = node as Extract<Expression, { type: "CallExpression" }>;
        if (call.optional || call.arguments.length > RESTRICTED_EXPRESSION_LIMITS.arguments) {
          reject("call argument limit exceeded");
        }
        next(call.callee);
        for (const argument of call.arguments) next(argument);
        return;
      }
      default:
        reject(`unsupported syntax ${node.type}`);
    }
  };

  let result: Expression | undefined;
  if (program.body.length === 1 && program.body[0].type === "ExpressionStatement") {
    result = program.body[0].expression;
    validate(result);
  } else {
    for (const [index, statement] of program.body.entries()) {
      if (statement.type === "VariableDeclaration" && statement.kind === "const") {
        for (const declaration of statement.declarations) {
          if (declaration.id.type !== "Identifier" || !declaration.init ||
              known.has(declaration.id.name) || forbiddenNames.has(declaration.id.name)) {
            reject("const bindings require a new identifier and initializer");
          }
          validate(declaration.init);
          bindings.push({ name: declaration.id.name, value: declaration.init });
          known.add(declaration.id.name);
        }
      } else if (statement.type === "ReturnStatement" && statement.argument &&
                 index === program.body.length - 1) {
        result = statement.argument;
        validate(result);
      } else {
        reject("only const bindings followed by a final return are allowed");
      }
    }
  }
  if (!result) reject("an expression or final return is required");
  const finalExpression = result;

  return (scope, consumeOperation) => {
    const locals = new Map<string, unknown>();
    let operations = 0;
    const consume = () => {
      if (++operations > RESTRICTED_EXPRESSION_LIMITS.operations) {
        throw new Error("Expression operation limit exceeded");
      }
      consumeOperation?.();
    };
    const number = (value: unknown): number => {
      if (typeof value !== "number") throw new Error("Expression arithmetic requires numbers");
      return value;
    };
    const primitive = (value: unknown): unknown => {
      if (value !== null && !["number", "string", "boolean", "undefined"].includes(typeof value)) {
        throw new Error("Expression arguments must be primitive values");
      }
      return value;
    };
    const evaluate = (node: Node): unknown => {
      consume();
      switch (node.type) {
        case "Literal":
          return (node as Extract<Expression, { type: "Literal" }>).value;
        case "Identifier": {
          const name = (node as Extract<Expression, { type: "Identifier" }>).name;
          if (locals.has(name)) return locals.get(name);
          if (!Object.prototype.hasOwnProperty.call(scope, name)) throw new Error(`Unknown name ${name}`);
          return scope[name];
        }
        case "UnaryExpression": {
          const unary = node as Extract<Expression, { type: "UnaryExpression" }>;
          const value = evaluate(unary.argument);
          if (unary.operator === "!") return !value;
          return unary.operator === "-" ? -number(value) : number(value);
        }
        case "BinaryExpression": {
          const binary = node as Extract<Expression, { type: "BinaryExpression" }>;
          const left = evaluate(binary.left);
          const right = evaluate(binary.right);
          if (binary.operator === "===") return left === right;
          if (binary.operator === "!==") return left !== right;
          const a = number(left);
          const b = number(right);
          switch (binary.operator) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            case "/": return a / b;
            case "%": return a % b;
            case "**": return a ** b;
            case "<": return a < b;
            case "<=": return a <= b;
            case ">": return a > b;
            case ">=": return a >= b;
            default: throw new Error("Unsupported binary operator");
          }
        }
        case "LogicalExpression": {
          const logical = node as Extract<Expression, { type: "LogicalExpression" }>;
          const left = evaluate(logical.left);
          if (logical.operator === "&&") return left ? evaluate(logical.right) : left;
          if (logical.operator === "||") return left ? left : evaluate(logical.right);
          return left === null || left === undefined ? evaluate(logical.right) : left;
        }
        case "ConditionalExpression": {
          const conditional = node as Extract<Expression, { type: "ConditionalExpression" }>;
          return evaluate(conditional.test) ? evaluate(conditional.consequent) : evaluate(conditional.alternate);
        }
        case "MemberExpression": {
          const member = node as Extract<Expression, { type: "MemberExpression" }>;
          const object = evaluate(member.object);
          const name = (member.property as { name: string }).name;
          if (typeof object === "string" && name === "length") return object.length;
          if (!object || typeof object !== "object" || !Object.prototype.hasOwnProperty.call(object, name)) {
            throw new Error(`Expression member ${name} is unavailable`);
          }
          return (object as Record<string, unknown>)[name];
        }
        case "CallExpression": {
          const call = node as Extract<Expression, { type: "CallExpression" }>;
          const fn = evaluate(call.callee);
          if (typeof fn !== "function") throw new Error("Expression value is not callable");
          const args = call.arguments.map((argument) => primitive(evaluate(argument)));
          return Reflect.apply(fn, undefined, args);
        }
        default:
          throw new Error(`Unsupported expression syntax ${node.type}`);
      }
    };
    for (const binding of bindings) locals.set(binding.name, evaluate(binding.value));
    return evaluate(finalExpression);
  };
}
