import React, { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateAndFormat, evaluateMathExpression, formatResult } from '../utils/mathEvaluator.js';

interface CbtCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CbtCalculatorModal: React.FC<CbtCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [pendingFunc, setPendingFunc] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [memory, setMemory] = useState<number | null>(null);
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    // Initial position on load (bottom right of screen)
    const initialX = Math.max(20, window.innerWidth - 380);
    const initialY = Math.max(80, window.innerHeight - 560);
    setPosition({ x: initialX, y: initialY });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 340, dragStartRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 100, dragStartRef.current.posY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  // Factorial helper
  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= Math.min(n, 100); i++) {
      res *= i;
    }
    return res;
  };

  // Core scientific function computation
  const computeScientific = useCallback(
    (func: string, val: number): number => {
      switch (func) {
        case 'sin': {
          const rad = angleMode === 'DEG' ? (val * Math.PI) / 180 : val;
          return Math.sin(rad);
        }
        case 'cos': {
          const rad = angleMode === 'DEG' ? (val * Math.PI) / 180 : val;
          return Math.cos(rad);
        }
        case 'tan': {
          const rad = angleMode === 'DEG' ? (val * Math.PI) / 180 : val;
          return Math.tan(rad);
        }
        case 'sqrt':
          if (val < 0) throw new Error('Square root of negative number is undefined');
          return Math.sqrt(val);
        case 'sqr':
          return Math.pow(val, 2);
        case 'reciprocal':
          if (val === 0) throw new Error('Division by zero is undefined');
          return 1 / val;
        case 'ln':
          if (val <= 0) throw new Error('Natural logarithm of non-positive number is undefined');
          return Math.log(val);
        case 'log':
          if (val <= 0) throw new Error('Base-10 logarithm of non-positive number is undefined');
          return Math.log10(val);
        case 'fact':
          if (val < 0) throw new Error('Factorial of negative number is undefined');
          return factorial(Math.floor(val));
        default:
          throw new Error('Unknown function');
      }
    },
    [angleMode]
  );

  // Safe Calculator Logic
  const handleDigit = useCallback((digit: string) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return digit;
      return prev + digit;
    });

    setExpression((prevExp) => {
      if (pendingFunc) {
        const nextVal = display === '0' || display === 'Error' ? digit : display + digit;
        return `${pendingFunc}(${nextVal})`;
      }
      if (justEvaluated) {
        return '';
      }
      return prevExp;
    });

    if (justEvaluated && !pendingFunc) {
      setDisplay(digit);
    }

    setJustEvaluated(false);
  }, [display, pendingFunc, justEvaluated]);

  const handleDecimal = useCallback(() => {
    if (display === 'Error' || (justEvaluated && !pendingFunc)) {
      setDisplay('0.');
      if (pendingFunc) {
        setExpression(`${pendingFunc}(0.`);
      } else {
        setExpression('');
      }
      setJustEvaluated(false);
      return;
    }

    const parts = display.split(/[\+\-\*\/]/);
    const currentNum = parts[parts.length - 1];
    if (!currentNum.includes('.')) {
      const nextDisplay = display + '.';
      setDisplay(nextDisplay);
      if (pendingFunc) {
        setExpression(`${pendingFunc}(${nextDisplay})`);
      }
    }
  }, [display, justEvaluated, pendingFunc]);

  const handleOperator = useCallback((op: string) => {
    if (display === 'Error') return;

    // If there is a pending prefix function (e.g. log(100)), resolve it before appending operator
    if (pendingFunc) {
      try {
        let currentVal: number;
        try {
          currentVal = evaluateMathExpression(display);
        } catch {
          currentVal = parseFloat(display);
        }

        if (isNaN(currentVal)) {
          setDisplay('Error');
          setPendingFunc(null);
          return;
        }

        const res = computeScientific(pendingFunc, currentVal);
        const formatted = formatResult(res);
        setPendingFunc(null);
        setDisplay(formatted + op);
        setExpression(`${pendingFunc}(${display}) ${op}`);
        setJustEvaluated(false);
        return;
      } catch {
        setDisplay('Error');
        setPendingFunc(null);
        return;
      }
    }

    setJustEvaluated(false);
    setDisplay((prev) => {
      const lastChar = prev.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        return prev.slice(0, -1) + op;
      }
      return prev + op;
    });
  }, [display, pendingFunc, computeScientific]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setPendingFunc(null);
    setJustEvaluated(false);
  }, []);

  const handleBackspace = useCallback(() => {
    if (display === 'Error' || display.length <= 1) {
      setDisplay('0');
      if (pendingFunc) {
        setExpression(`${pendingFunc}(`);
      }
    } else {
      const nextDisplay = display.slice(0, -1);
      setDisplay(nextDisplay);
      if (pendingFunc) {
        setExpression(`${pendingFunc}(${nextDisplay})`);
      }
    }
  }, [display, pendingFunc]);

  const handleToggleSign = useCallback(() => {
    if (display === '0' || display === 'Error') return;
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        const next = (-val).toString();
        setDisplay(next);
        if (pendingFunc) {
          setExpression(`${pendingFunc}(${next})`);
        }
      }
    } catch {
      // ignore
    }
  }, [display, pendingFunc]);

  // Scientific functions supporting both PREFIX (e.g., log -> 100 -> =) and POSTFIX (100 -> log)
  const handleScientific = useCallback((func: string) => {
    // 1. Constants (pi and e)
    if (func === 'pi') {
      const formatted = formatResult(Math.PI);
      setDisplay(formatted);
      setExpression('π =');
      setPendingFunc(null);
      setJustEvaluated(true);
      return;
    }
    if (func === 'e') {
      const formatted = formatResult(Math.E);
      setDisplay(formatted);
      setExpression('e =');
      setPendingFunc(null);
      setJustEvaluated(true);
      return;
    }

    // 2. Prefix Mode Trigger:
    // If the display is '0', or 'Error', or we just finished another evaluation/clear,
    // the user wants to enter prefix notation: e.g. click 'log' or 'ln', then enter operand, then '='.
    // Instead of throwing an instant Error on '0', initiate pending function mode smoothly!
    if (display === '0' || display === 'Error' || display === '' || justEvaluated) {
      setPendingFunc(func);
      setExpression(`${func}(`);
      setDisplay('0');
      setJustEvaluated(false);
      return;
    }

    // 3. Postfix Mode:
    // User already typed an operand or expression in display (e.g. '100' or '20 + 80').
    // Evaluate display first to obtain the true argument.
    try {
      let currentVal: number;
      try {
        currentVal = evaluateMathExpression(display);
      } catch {
        currentVal = parseFloat(display);
      }

      if (isNaN(currentVal)) {
        setDisplay('Error');
        setExpression(`${func}(${display}) = Error`);
        setPendingFunc(null);
        setJustEvaluated(true);
        return;
      }

      const result = computeScientific(func, currentVal);
      const formatted = formatResult(result);
      setExpression(`${func}(${display}) =`);
      setDisplay(formatted);
      setPendingFunc(null);
      setJustEvaluated(true);
    } catch {
      setExpression(`${func}(${display}) = Error`);
      setDisplay('Error');
      setPendingFunc(null);
      setJustEvaluated(true);
    }
  }, [display, justEvaluated, computeScientific]);

  // Deterministic arithmetic evaluation via safe parser (zero eval, CSP compliant)
  const handleEquals = useCallback(() => {
    if (display === 'Error') return;

    // 1. If we have a pending scientific prefix function (e.g. log(100) or ln(10))
    if (pendingFunc) {
      try {
        let currentVal: number;
        try {
          currentVal = evaluateMathExpression(display);
        } catch {
          currentVal = parseFloat(display);
        }

        if (isNaN(currentVal)) {
          setDisplay('Error');
          setPendingFunc(null);
          setJustEvaluated(true);
          return;
        }

        const result = computeScientific(pendingFunc, currentVal);
        const formatted = formatResult(result);
        setExpression(`${pendingFunc}(${display}) =`);
        setDisplay(formatted);
        setPendingFunc(null);
        setJustEvaluated(true);
      } catch {
        setExpression(`${pendingFunc}(${display}) = Error`);
        setDisplay('Error');
        setPendingFunc(null);
        setJustEvaluated(true);
      }
      return;
    }

    // 2. Standard arithmetic evaluation via evaluateAndFormat
    try {
      const formatted = evaluateAndFormat(display, 8);
      setExpression(`${display} =`);
      setDisplay(formatted);
      setJustEvaluated(true);
    } catch {
      setDisplay('Error');
      setJustEvaluated(true);
    }
  }, [display, pendingFunc, computeScientific]);

  // Keyboard navigation & numpad shortcuts while calculator is active
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a form input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        e.preventDefault();
        handleOperator(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleDecimal, handleOperator, handleEquals, handleBackspace, handleClear]);

  // Memory functions
  const handleMemory = (op: 'MC' | 'MR' | 'M+' | 'M-') => {
    const val = parseFloat(display);
    switch (op) {
      case 'MC':
        setMemory(null);
        break;
      case 'MR':
        if (memory !== null) setDisplay(memory.toString());
        break;
      case 'M+':
        if (!isNaN(val)) setMemory((prev) => (prev ?? 0) + val);
        break;
      case 'M-':
        if (!isNaN(val)) setMemory((prev) => (prev ?? 0) - val);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: typeof window !== 'undefined' && window.innerWidth <= 420 ? '8px' : `${Math.max(8, Math.min(position.x, (typeof window !== 'undefined' ? window.innerWidth : 500) - 350))}px`,
        top: `${Math.max(8, position.y)}px`,
        width: '340px',
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100dvh - 16px)',
        backgroundColor: '#14181c',
        color: '#f6f4ee',
        borderRadius: '8px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        zIndex: 9999,
        fontFamily: "var(--font-sans)",
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: 'linear-gradient(90deg, #1c2228 0%, #14181c 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: '#f3e8df' }}>
          <span style={{ color: 'var(--rust)' }}>🖩</span>
          <span>MARKDRILLER CBT CALCULATOR</span>
          {memory !== null && (
            <span style={{ fontSize: '9px', background: 'var(--rust)', color: '#fff', padding: '1px 4px', borderRadius: '2px' }}>
              M
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '0 4px',
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '□' : '—'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 4px',
              fontWeight: 700,
            }}
            title="Close Calculator"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div style={{ padding: '12px 14px' }}>
          {/* LCD Screen Display */}
          <div
            style={{
              backgroundColor: '#0c0f12',
              borderRadius: '4px',
              padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '10px',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '10px', color: '#8b949e', minHeight: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {expression}
            </div>
            <div
              style={{
                fontSize: display.length > 12 ? '16px' : '22px',
                fontWeight: 700,
                color: display === 'Error' ? '#ef4444' : '#52e396',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '2px',
              }}
            >
              {display}
            </div>
          </div>

          {/* Mode Bar (DEG / RAD & Memory) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '10px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')}
                style={{
                  padding: '3px 8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--rust)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                {angleMode}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['MC', 'MR', 'M+', 'M-'] as const).map((mOp) => (
                <button
                  key={mOp}
                  type="button"
                  onClick={() => handleMemory(mOp)}
                  style={{
                    padding: '3px 6px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#c9d1d9',
                    fontSize: '10px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  {mOp}
                </button>
              ))}
            </div>
          </div>

          {/* Scientific Keypad Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '6px' }}>
            {[
              { func: 'sin', label: 'sin', title: 'Sine (sin)', testId: 'cbt-calc-btn-sin' },
              { func: 'cos', label: 'cos', title: 'Cosine (cos)', testId: 'cbt-calc-btn-cos' },
              { func: 'tan', label: 'tan', title: 'Tangent (tan)', testId: 'cbt-calc-btn-tan' },
              { func: 'ln', label: 'ln', title: 'Natural Logarithm (ln)', isLn: true, testId: 'cbt-calc-btn-ln' },
              { func: 'log', label: 'log', title: 'Base-10 Common Logarithm (log)', testId: 'cbt-calc-btn-log' },
              { func: 'sqrt', label: '√x', title: 'Square Root (√x)', testId: 'cbt-calc-btn-sqrt' },
              { func: 'sqr', label: 'x²', title: 'Square (x²)', testId: 'cbt-calc-btn-sqr' },
              { func: 'reciprocal', label: '1/x', title: 'Reciprocal (1/x)', testId: 'cbt-calc-btn-reciprocal' },
              { func: 'pi', label: 'π', title: 'Pi Constant (π)', testId: 'cbt-calc-btn-pi' },
              { func: 'fact', label: 'n!', title: 'Factorial (n!)', testId: 'cbt-calc-btn-fact' },
            ].map((btn) => {
              const isPending = pendingFunc === btn.func;
              return (
                <button
                  key={btn.func}
                  id={btn.testId}
                  data-testid={btn.testId}
                  type="button"
                  onClick={() => handleScientific(btn.func)}
                  title={btn.title}
                  aria-label={btn.title}
                  style={{
                    padding: '6px 2px',
                    background: isPending ? 'rgba(194, 65, 12, 0.28)' : 'rgba(255,255,255,0.05)',
                    border: isPending ? '1px solid var(--rust)' : '1px solid rgba(255,255,255,0.08)',
                    color: isPending ? 'var(--rust)' : '#c9d1d9',
                    fontSize: btn.isLn ? '12px' : '11px',
                    fontFamily: btn.isLn ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' : 'inherit',
                    fontStyle: btn.isLn ? 'italic' : 'normal',
                    letterSpacing: btn.isLn ? '0.5px' : 'normal',
                    fontWeight: isPending || btn.isLn ? 700 : 500,
                    borderRadius: '3px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Standard Keypad Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '8px 0',
                background: '#4a1515',
                border: '1px solid #7f1d1d',
                color: '#fecaca',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              C
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#f6f4ee',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleOperator('/')}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--rust)',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ÷
            </button>
            <button
              type="button"
              onClick={() => handleOperator('*')}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--rust)',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            {['7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                style={{
                  padding: '9px 0',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleOperator('-')}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--rust)',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              -
            </button>

            {['4', '5', '6'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                style={{
                  padding: '9px 0',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleOperator('+')}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--rust)',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              +
            </button>

            {['1', '2', '3'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                style={{
                  padding: '9px 0',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={handleEquals}
              style={{
                gridRow: 'span 2',
                background: 'var(--rust)',
                border: '1px solid var(--rust)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              =
            </button>

            <button
              type="button"
              onClick={handleToggleSign}
              style={{
                padding: '9px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              style={{
                padding: '9px 0',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDecimal}
              style={{
                padding: '9px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              .
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

