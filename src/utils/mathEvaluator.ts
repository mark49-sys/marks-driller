/**
 * MarkDriller Safe Mathematical Evaluator
 *
 * Deterministic mathematical expression evaluator built using a recursive descent parser.
 * - Zero dynamic execution.
 * - 100% compatible with production Content Security Policy (Helmet without unsafe-eval).
 * - Preserves operator precedence (*, / before +, -).
 * - Handles parentheses, unary negation, floating-point decimals, and division by zero.
 * - Formats results to prevent IEEE-754 floating-point inaccuracies (e.g., 0.1 + 0.2 = 0.3).
 */

export interface EvaluationOptions {
  maxDecimals?: number;
  throwOnDivByZero?: boolean;
}

export class MathEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MathEvaluationError';
  }
}

type TokenType = 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN' | 'FUNC';

interface Token {
  type: TokenType;
  value: string;
}

/**
 * Tokenizes mathematical expression string into structured tokens.
 */
function tokenize(rawExpr: string): Token[] {
  const sanitized = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, '');

  if (!sanitized) {
    throw new MathEvaluationError('Expression is empty');
  }

  // Validate allowed characters: digits, decimal point, operators (+, -, *, /), parentheses, and function/constant letters
  if (!/^[0-9+\-*/.()a-zA-Z]+$/.test(sanitized)) {
    throw new MathEvaluationError('Expression contains invalid characters');
  }

  const tokens: Token[] = [];
  let i = 0;
  const len = sanitized.length;

  while (i < len) {
    const ch = sanitized[i];

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      const prevToken = tokens[tokens.length - 1];
      if (prevToken && prevToken.type === 'OP') {
        // Allow unary minus after *, /, or + (e.g., 5 * -2, 10 / -5, 8 + -3)
        if (ch === '-' && (prevToken.value === '*' || prevToken.value === '/' || prevToken.value === '+')) {
          // Valid unary minus
        } else {
          throw new MathEvaluationError(`Consecutive operators '${prevToken.value}${ch}' are invalid`);
        }
      }
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    // Number parsing (integers, floats, starting with dot or digit)
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      let decimalCount = 0;

      while (i < len && /[0-9.]/.test(sanitized[i])) {
        if (sanitized[i] === '.') {
          decimalCount++;
          if (decimalCount > 1) {
            throw new MathEvaluationError(`Invalid number format with multiple decimals: ${numStr}.`);
          }
        }
        numStr += sanitized[i];
        i++;
      }

      if (numStr === '.') {
        throw new MathEvaluationError('Stray decimal point without digits');
      }

      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Function and constant identifier parsing (log, ln, sin, cos, tan, sqrt, pi, e)
    if (/[a-zA-Z]/.test(ch)) {
      let word = '';
      while (i < len && /[a-zA-Z]/.test(sanitized[i])) {
        word += sanitized[i].toLowerCase();
        i++;
      }

      if (word === 'pi') {
        tokens.push({ type: 'NUMBER', value: Math.PI.toString() });
        continue;
      }
      if (word === 'e') {
        tokens.push({ type: 'NUMBER', value: Math.E.toString() });
        continue;
      }
      if (['log', 'ln', 'sin', 'cos', 'tan', 'sqrt'].includes(word)) {
        tokens.push({ type: 'FUNC', value: word });
        continue;
      }

      throw new MathEvaluationError(`Unknown function or identifier: ${word}`);
    }

    throw new MathEvaluationError(`Unexpected character: ${ch}`);
  }

  const first = tokens[0];
  if (first && first.type === 'OP' && (first.value === '*' || first.value === '/')) {
    throw new MathEvaluationError(`Expression cannot start with operator '${first.value}'`);
  }

  const last = tokens[tokens.length - 1];
  if (last && last.type === 'OP') {
    throw new MathEvaluationError(`Expression cannot end with operator '${last.value}'`);
  }

  return tokens;
}

/**
 * Recursive descent parser for arithmetic grammar:
 *
 * Expression -> Term (('+' | '-') Term)*
 * Term       -> Factor (('*' | '/') Factor)*
 * Factor     -> ('+' | '-') Factor | Primary
 * Primary    -> NUMBER | '(' Expression ')'
 */
class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const t = this.tokens[this.pos];
    this.pos++;
    return t;
  }

  parse(): number {
    if (this.tokens.length === 0) {
      throw new MathEvaluationError('Empty expression');
    }
    const result = this.parseExpression();
    if (this.pos < this.tokens.length) {
      const leftover = this.tokens[this.pos];
      throw new MathEvaluationError(`Unexpected token after expression: ${leftover.value}`);
    }
    if (!Number.isFinite(result) || Number.isNaN(result)) {
      throw new MathEvaluationError('Calculation resulted in non-finite number');
    }
    return result;
  }

  // Expression -> Term (('+' | '-') Term)*
  private parseExpression(): number {
    let left = this.parseTerm();

    while (this.pos < this.tokens.length) {
      const current = this.peek();
      if (!current || current.type !== 'OP' || (current.value !== '+' && current.value !== '-')) {
        break;
      }
      const op = this.consume().value;
      const right = this.parseTerm();
      if (op === '+') {
        left = left + right;
      } else {
        left = left - right;
      }
    }

    return left;
  }

  // Term -> Factor (('*' | '/') Factor)*
  private parseTerm(): number {
    let left = this.parseFactor();

    while (this.pos < this.tokens.length) {
      const current = this.peek();
      if (!current || current.type !== 'OP' || (current.value !== '*' && current.value !== '/')) {
        break;
      }
      const op = this.consume().value;
      const right = this.parseFactor();
      if (op === '*') {
        left = left * right;
      } else {
        if (right === 0 || Math.abs(right) < 1e-15) {
          throw new MathEvaluationError('Division by zero');
        }
        left = left / right;
      }
    }

    return left;
  }

  // Factor -> ('+' | '-') Factor | Primary
  private parseFactor(): number {
    const current = this.peek();
    if (!current) {
      throw new MathEvaluationError('Unexpected end of expression');
    }

    // Unary operator
    if (current.type === 'OP' && (current.value === '+' || current.value === '-')) {
      const op = this.consume().value;
      const operand = this.parseFactor();
      return op === '-' ? -operand : operand;
    }

    return this.parsePrimary();
  }

  // Primary -> NUMBER | '(' Expression ')'
  private parsePrimary(): number {
    const current = this.peek();
    if (!current) {
      throw new MathEvaluationError('Unexpected end of expression where value was expected');
    }

    if (current.type === 'NUMBER') {
      this.consume();
      const val = parseFloat(current.value);
      if (Number.isNaN(val)) {
        throw new MathEvaluationError(`Invalid numeric literal: ${current.value}`);
      }
      return val;
    }

    if (current.type === 'LPAREN') {
      this.consume(); // consume '('
      const exprValue = this.parseExpression();
      const close = this.peek();
      if (!close || close.type !== 'RPAREN') {
        throw new MathEvaluationError("Missing closing parenthesis ')'");
      }
      this.consume(); // consume ')'
      return exprValue;
    }

    if (current.type === 'FUNC') {
      const funcName = this.consume().value;
      const lparen = this.peek();
      if (!lparen || lparen.type !== 'LPAREN') {
        throw new MathEvaluationError(`Expected '(' after function ${funcName}`);
      }
      this.consume(); // consume '('
      const arg = this.parseExpression();
      const close = this.peek();
      if (!close || close.type !== 'RPAREN') {
        throw new MathEvaluationError(`Missing closing parenthesis ')' for ${funcName}`);
      }
      this.consume(); // consume ')'

      switch (funcName) {
        case 'log':
          if (arg <= 0) {
            throw new MathEvaluationError('Logarithm of non-positive number is undefined');
          }
          return Math.log10(arg);
        case 'ln':
          if (arg <= 0) {
            throw new MathEvaluationError('Natural logarithm of non-positive number is undefined');
          }
          return Math.log(arg);
        case 'sqrt':
          if (arg < 0) {
            throw new MathEvaluationError('Square root of negative number is undefined');
          }
          return Math.sqrt(arg);
        case 'sin':
          return Math.sin(arg);
        case 'cos':
          return Math.cos(arg);
        case 'tan':
          return Math.tan(arg);
        default:
          throw new MathEvaluationError(`Unsupported function: ${funcName}`);
      }
    }

    throw new MathEvaluationError(`Expected number, function, or '(', found ${current.value}`);
  }
}

/**
 * Formats numeric result cleanly:
 * - Truncates IEEE floating point inaccuracies (e.g. 0.1 + 0.2 => 0.3)
 * - Retains integer representation when whole
 * - Caps decimals to maxDecimals (default: 8)
 */
export function formatResult(value: number, maxDecimals: number = 8): string {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    throw new MathEvaluationError('Invalid result');
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  // Round precision to eliminate 0.30000000000000004 IEEE artifact
  const precisionRounded = parseFloat(value.toPrecision(12));
  if (Number.isInteger(precisionRounded)) {
    return precisionRounded.toString();
  }

  return parseFloat(precisionRounded.toFixed(maxDecimals)).toString();
}

/**
 * Main evaluation function:
 * Takes expression string (e.g. "2 + 3 * 4", "20 ÷ 4", "(8 - 3) * 5")
 * Returns evaluated numeric result.
 */
export function evaluateMathExpression(expr: string): number {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Helper to evaluate and format to string in one step.
 * Returns formatted string on success, throws MathEvaluationError on failure.
 */
export function evaluateAndFormat(expr: string, maxDecimals: number = 8): string {
  const val = evaluateMathExpression(expr);
  return formatResult(val, maxDecimals);
}
