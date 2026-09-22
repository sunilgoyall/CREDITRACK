import React, { useEffect, useState, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { formatINR } from '../../lib/formatters';

interface AnimatedCounterProps {
  value: number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  isCurrency = false,
  prefix = '',
  suffix = '',
  className = '',
  duration = 1.0,
}: AnimatedCounterProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(shouldReduceMotion ? value : 0);
  const prevValueRef = useRef<number>(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const controls = animate(startVal, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
      onComplete: () => {
        setDisplayValue(value);
        prevValueRef.current = value;
      },
    });

    return () => controls.stop();
  }, [value, duration, shouldReduceMotion]);

  const formattedText = isCurrency
    ? formatINR(displayValue)
    : `${prefix}${displayValue.toLocaleString('en-IN')}${suffix}`;

  return <span className={className}>{formattedText}</span>;
}
