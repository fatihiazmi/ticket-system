import type { Variants } from 'framer-motion';

/**
 * Common animation variants for consistent motion design across the application
 */

// Page-level animations
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99] as any,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: {
      duration: 0.4,
      ease: [0.6, -0.05, 0.01, 0.99] as any,
    },
  },
};

// Card/Container animations
export const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.175, 0.885, 0.32, 1.275] as any,
    },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Form field animations
export const fieldVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.6, -0.05, 0.01, 0.99] as any,
    },
  },
};

// Button animations
export const buttonVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.6, -0.05, 0.01, 0.99] as any,
    },
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    transition: { duration: 0.2 },
  },
};

// Input focus animations
export const inputVariants = {
  focus: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  blur: {
    scale: 1,
    transition: { duration: 0.2 },
  },
};

// Stagger animations for lists
export const staggerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Alert/notification animations
export const alertVariants: Variants = {
  hidden: { opacity: 0, x: -100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.6, -0.05, 0.01, 0.99] as any,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: 0.3 },
  },
};

// Loading spinner animation
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Fade in/out animations
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Slide animations
export const slideVariants: Variants = {
  slideInLeft: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] as any },
  },
  slideOutLeft: {
    x: -100,
    opacity: 0,
    transition: { duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] as any },
  },
  slideInRight: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] as any },
  },
  slideOutRight: {
    x: 100,
    opacity: 0,
    transition: { duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] as any },
  },
};
