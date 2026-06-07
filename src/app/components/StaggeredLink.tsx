import React from 'react';
import { motion } from 'framer-motion';

const heavySpring = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 28,
  mass: 1.4,
};

const lightSpring = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 28,
  mass: 0.9,
};

interface StaggeredLinkProps {
  text: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
  subtle?: boolean;
}

export function StaggeredLink({
  text,
  onMouseEnter,
  onMouseLeave,
  style,
  subtle = false,
}: StaggeredLinkProps) {
  const spring = subtle ? lightSpring : heavySpring;
  const delayMult = subtle ? 0.018 : 0.028;

  const letters = text.split('').map((l, i) => {
    const char = l === ' ' ? '\u00A0' : l;
    return (
      <span
        key={i}
        style={{
          display: 'inline-block',
          clipPath: 'inset(0)',
          height: '1.4em',
          position: 'relative',
        }}
      >
        <motion.span
          variants={{ initial: { y: '0%' }, hovered: { y: '-100%' } }}
          transition={{ ...spring, delay: delayMult * i }}
          style={{ display: 'block', lineHeight: 1.4 }}
        >
          {char}
        </motion.span>
        <motion.span
          variants={{ initial: { y: '100%' }, hovered: { y: '0%' } }}
          transition={{ ...spring, delay: delayMult * i }}
          style={{
            display: 'block',
            lineHeight: 1.4,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {char}
        </motion.span>
      </span>
    );
  });

  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      style={{
        position: 'relative',
        display: 'block',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span>{letters}</span>
    </motion.span>
  );
}
