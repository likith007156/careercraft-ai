import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--color-bg-default)',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        padding: '24px'
      }}
    >
      <div style={{
        fontFamily: 'serif',
        fontSize: '96px',
        color: 'var(--color-text-primary)',
        letterSpacing: '-4px',
        lineHeight: 1,
        fontWeight: 700
      }}>
        404
      </div>
      <div style={{ fontSize: '16px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        This page does not exist
      </div>
      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '280px', lineHeight: 1.6 }}>
        The URL you visited doesn't match any page in CareerCraft AI.
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/dashboard')}
        style={{
          marginTop: '16px',
          background: '#17191c',
          color: '#fff',
          border: 'none',
          padding: '12px 28px',
          borderRadius: '9999px',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600'
        }}
      >
        Back to Dashboard
      </motion.button>
    </motion.div>
  );
}
