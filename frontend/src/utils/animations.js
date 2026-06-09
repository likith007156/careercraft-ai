export const fadeUp = {
  hidden: { 
    opacity: 0, 
    y: 24,
    scale: 0.98
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const cardHover = {
  rest: { 
    y: 0,
    boxShadow: 'rgba(4,23,43,0.05) 0px 0px 0px 1px, rgba(0,0,0,0.1) 0px 4px 6px -2px'
  },
  hover: { 
    y: -4,
    boxShadow: 'rgba(4,23,43,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 20px 25px -5px, rgba(0,0,0,0.1) 0px 8px 10px -6px',
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity
    }
  }
};
