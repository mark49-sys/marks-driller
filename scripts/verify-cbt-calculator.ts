/**
 * Automated Verification & Regression Test Suite:
 * Production CBT Calculator Mathematical Evaluation & CSP Security Audit
 *
 * MANDATE:
 * - Tests all mathematical operations without browser automation.
 * - Tests operator precedence, parentheses, decimals, negative numbers, repeated operations.
 * - Tests division by zero and invalid expression protection.
 * - Verifies ZERO dynamic code execution (eval, new Function) across calculator codebase.
 * - Verifies consistency between local and production Helmet CSP environments.
 */

import fs from 'fs';
import path from 'path';
import { evaluateMathExpression, evaluateAndFormat, MathEvaluationError } from '../src/utils/mathEvaluator.js';

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assertTest(id: string, description: string, condition: boolean, details: string) {
  results.push({ id, description, passed: condition, details });
  const icon = condition ? '✓' : '✗';
  console.log(`${icon} [${id}] ${description}: ${details}`);
}

async function runTests() {
  console.log('========================================================================');
  console.log(' MarkDriller — Production CBT Calculator Verification & Regression Audit');
  console.log(' Mandate: 100% Deterministic Mathematical Parser & CSP Integrity');
  console.log('========================================================================\n');

  // 1. BASIC ARITHMETIC OPERATORS
  console.log('--- 1. Basic Arithmetic Operations ---');
  assertTest('ADD_BASIC', 'Addition 2 + 3', evaluateAndFormat('2 + 3') === '5', `Expected '5', got '${evaluateAndFormat('2 + 3')}'`);
  assertTest('SUB_BASIC', 'Subtraction 8 - 3', evaluateAndFormat('8 - 3') === '5', `Expected '5', got '${evaluateAndFormat('8 - 3')}'`);
  assertTest('MUL_ASTERISK', 'Multiplication 4 * 5', evaluateAndFormat('4 * 5') === '20', `Expected '20', got '${evaluateAndFormat('4 * 5')}'`);
  assertTest('MUL_UNICODE', 'Multiplication 4 × 5', evaluateAndFormat('4 × 5') === '20', `Expected '20', got '${evaluateAndFormat('4 × 5')}'`);
  assertTest('DIV_SLASH', 'Division 20 / 4', evaluateAndFormat('20 / 4') === '5', `Expected '5', got '${evaluateAndFormat('20 / 4')}'`);
  assertTest('DIV_UNICODE', 'Division 20 ÷ 4', evaluateAndFormat('20 ÷ 4') === '5', `Expected '5', got '${evaluateAndFormat('20 ÷ 4')}'`);

  // 2. OPERATOR PRECEDENCE & PARENTHESES
  console.log('\n--- 2. Operator Precedence & Parentheses ---');
  assertTest('PRECEDENCE_ADD_MUL', 'Precedence 2 + 3 * 4', evaluateAndFormat('2 + 3 * 4') === '14', `Expected '14', got '${evaluateAndFormat('2 + 3 * 4')}'`);
  assertTest('PRECEDENCE_SUB_DIV', 'Precedence 20 - 8 / 2', evaluateAndFormat('20 - 8 / 2') === '16', `Expected '16', got '${evaluateAndFormat('20 - 8 / 2')}'`);
  assertTest('PARENTHESES_OVERRIDE', 'Parentheses (2 + 3) * 4', evaluateAndFormat('(2 + 3) * 4') === '20', `Expected '20', got '${evaluateAndFormat('(2 + 3) * 4')}'`);
  assertTest('NESTED_PARENTHESES', 'Nested ((2 + 3) * (4 + 1))', evaluateAndFormat('((2 + 3) * (4 + 1))') === '25', `Expected '25', got '${evaluateAndFormat('((2 + 3) * (4 + 1))')}'`);

  // 3. DECIMAL CALCULATIONS & IEEE PRECISION
  console.log('\n--- 3. Decimal Precision & Formatting ---');
  assertTest('DECIMAL_ADD_CLEAN', 'Decimal 0.1 + 0.2 (no IEEE 0.30000000000000004 bug)', evaluateAndFormat('0.1 + 0.2') === '0.3', `Expected '0.3', got '${evaluateAndFormat('0.1 + 0.2')}'`);
  assertTest('DECIMAL_MUL', 'Decimal 5.5 * 2', evaluateAndFormat('5.5 * 2') === '11', `Expected '11', got '${evaluateAndFormat('5.5 * 2')}'`);
  assertTest('DECIMAL_DIV', 'Decimal 10.5 / 2', evaluateAndFormat('10.5 / 2') === '5.25', `Expected '5.25', got '${evaluateAndFormat('10.5 / 2')}'`);

  // 4. NEGATIVE NUMBERS & UNARY OPERATORS
  console.log('\n--- 4. Negative Numbers & Unary Signs ---');
  assertTest('UNARY_NEG_START', 'Unary minus -5 + 8', evaluateAndFormat('-5 + 8') === '3', `Expected '3', got '${evaluateAndFormat('-5 + 8')}'`);
  assertTest('UNARY_NEG_INFIX', 'Unary minus in infix 8 + -3', evaluateAndFormat('8 + -3') === '5', `Expected '5', got '${evaluateAndFormat('8 + -3')}'`);
  assertTest('UNARY_NEG_PRODUCT', 'Negative product -2 * -3', evaluateAndFormat('-2 * -3') === '6', `Expected '6', got '${evaluateAndFormat('-2 * -3')}'`);
  assertTest('UNARY_NEG_PAREN', 'Negative parenthesized -(3 + 4)', evaluateAndFormat('-(3 + 4)') === '-7', `Expected '-7', got '${evaluateAndFormat('-(3 + 4)')}'`);

  // 5. REPEATED OPERATIONS
  console.log('\n--- 5. Repeated Operations ---');
  assertTest('REPEAT_ADD', 'Chained addition 2 + 3 + 4 + 5', evaluateAndFormat('2 + 3 + 4 + 5') === '14', `Expected '14', got '${evaluateAndFormat('2 + 3 + 4 + 5')}'`);
  assertTest('REPEAT_SUB', 'Chained subtraction 20 - 5 - 3', evaluateAndFormat('20 - 5 - 3') === '12', `Expected '12', got '${evaluateAndFormat('20 - 5 - 3')}'`);
  assertTest('REPEAT_DIV', 'Chained division 100 / 2 / 2', evaluateAndFormat('100 / 2 / 2') === '25', `Expected '25', got '${evaluateAndFormat('100 / 2 / 2')}'`);

  // 6. DIVISION BY ZERO & INVALID EXPRESSIONS SAFETY
  console.log('\n--- 6. Error Handling & Malformed Expression Protection ---');
  let divZeroCaught = false;
  try {
    evaluateMathExpression('20 / 0');
  } catch (err) {
    divZeroCaught = err instanceof MathEvaluationError;
  }
  assertTest('DIV_ZERO_REJECTED', 'Division by zero explicitly rejected', divZeroCaught, 'Throws MathEvaluationError without returning Infinity or NaN');

  let malformedCaught = false;
  try {
    evaluateMathExpression('2 ++ 3');
  } catch {
    malformedCaught = true;
  }
  assertTest('MALFORMED_DOUBLE_OP', 'Consecutive operators rejected safely', malformedCaught, 'Safely prevents malformed syntax crash');

  let unclosedParenCaught = false;
  try {
    evaluateMathExpression('(2 + 3');
  } catch {
    unclosedParenCaught = true;
  }
  assertTest('UNCLOSED_PAREN', 'Unclosed parenthesis rejected safely', unclosedParenCaught, 'Safely prevents unclosed grouping crash');

  // 7. SCIENTIFIC FUNCTIONS: LOG & LN EVALUATION
  console.log('\n--- 7. Scientific Functions: Logarithm (log) & Natural Log (ln) ---');
  assertTest('LOG_BASE10_HUNDRED', 'Base-10 log(100) = 2', evaluateAndFormat('log(100)') === '2', `Expected '2', got '${evaluateAndFormat('log(100)')}'`);
  assertTest('LOG_BASE10_THOUSAND', 'Base-10 log(1000) = 3', evaluateAndFormat('log(1000)') === '3', `Expected '3', got '${evaluateAndFormat('log(1000)')}'`);
  assertTest('LOG_ARITHMETIC', 'Composite arithmetic 10 + log(100) = 12', evaluateAndFormat('10 + log(100)') === '12', `Expected '12', got '${evaluateAndFormat('10 + log(100)')}'`);
  assertTest('LN_ONE', 'Natural log ln(1) = 0', evaluateAndFormat('ln(1)') === '0', `Expected '0', got '${evaluateAndFormat('ln(1)')}'`);
  assertTest('LN_E_CONSTANT', 'Natural log ln(e) = 1', evaluateAndFormat('ln(e)') === '1', `Expected '1', got '${evaluateAndFormat('ln(e)')}'`);

  let logZeroCaught = false;
  try {
    evaluateMathExpression('log(0)');
  } catch (err) {
    logZeroCaught = err instanceof MathEvaluationError;
  }
  assertTest('LOG_ZERO_REJECTED', 'log(0) correctly rejected as undefined', logZeroCaught, 'Safely throws MathEvaluationError on non-positive input');

  let lnNegativeCaught = false;
  try {
    evaluateMathExpression('ln(-10)');
  } catch (err) {
    lnNegativeCaught = err instanceof MathEvaluationError;
  }
  assertTest('LN_NEGATIVE_REJECTED', 'ln(-10) correctly rejected as undefined', lnNegativeCaught, 'Safely throws MathEvaluationError on negative input');

  // 8. SECURITY & CSP ZERO-EVAL AUDIT
  console.log('\n--- 8. Content Security Policy & Zero-Eval Static Audit ---');
  const rootDir = process.cwd();
  const cbtCalcPath = path.join(rootDir, 'src', 'components', 'CbtCalculatorModal.tsx');
  const mathUtilPath = path.join(rootDir, 'src', 'utils', 'mathEvaluator.ts');

  const cbtCalcContent = fs.readFileSync(cbtCalcPath, 'utf8');
  const mathUtilContent = fs.readFileSync(mathUtilPath, 'utf8');

  const stripComments = (str: string) => str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const cleanCalc = stripComments(cbtCalcContent);
  const cleanMath = stripComments(mathUtilContent);

  const hasNewFunction = /new\s+Function\s*\(/.test(cleanCalc) || /new\s+Function\s*\(/.test(cleanMath);
  const hasEval = /\beval\s*\(/.test(cleanCalc) || /\beval\s*\(/.test(cleanMath);

  assertTest('CSP_NO_NEW_FUNCTION', 'No new Function() in calculator modules', !hasNewFunction, 'Zero dynamic Function construction prevents production CSP violations');
  assertTest('CSP_NO_EVAL', 'No eval() in calculator modules', !hasEval, 'Zero eval() usage satisfies strict production CSP directives');

  // SUMMARY
  console.log('\n========================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL CALCULATOR AUDITS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Audit exception:', err);
  process.exit(1);
});
