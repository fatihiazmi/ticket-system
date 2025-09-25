import React from 'react';
import { motion, type Variants } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, maxWidth = 'md' }) => {
  const containerVariants: Variants = {
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
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.6, -0.05, 0.01, 0.99] as any,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
    hover: {
      y: -5,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '4xl': 'max-w-6xl',
  };

  return (
    <motion.div
      className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-4'
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      {/* Enhanced background decorations */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.3),transparent_70%)]' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_50%)]' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.2),transparent_50%)]' />

      {/* Floating elements */}
      <motion.div
        className='absolute left-20 top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl'
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className='absolute bottom-20 right-20 h-96 w-96 rounded-full bg-purple-300/10 blur-3xl'
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <motion.div
        className={`w-full ${maxWidthClasses[maxWidth]} relative z-10 mx-auto`}
        variants={itemVariants}
      >
        <motion.div
          variants={cardVariants}
          whileHover='hover'
          className='overflow-hidden rounded-2xl border-0 shadow-2xl backdrop-blur-xl'
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AuthLayout;
