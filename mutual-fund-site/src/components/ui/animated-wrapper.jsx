'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const slideInFromLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export function AnimatedWrapper({ 
  children, 
  className, 
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.5,
  ...props 
}) {
  const animations = {
    fadeInUp,
    fadeIn,
    slideInFromLeft,
    scaleIn,
    staggerContainer,
    staggerItem
  };

  const selectedAnimation = animations[animation] || fadeInUp;

  return (
    <motion.div
      className={cn(className)}
      initial={selectedAnimation.initial}
      animate={selectedAnimation.animate}
      exit={selectedAnimation.exit}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className, ...props }) {
  return (
    <motion.div
      className={cn(className)}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }) {
  return (
    <motion.div
      className={cn(className)}
      variants={staggerItem}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HoverCard({ children, className, ...props }) {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedButton({ children, className, ...props }) {
  return (
    <motion.button
      className={cn(className)}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
