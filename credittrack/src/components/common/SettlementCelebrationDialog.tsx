import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Check, Sparkles, PartyPopper } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

interface SettlementCelebrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  amountSettled?: number;
}

export function fireSettlementConfetti() {
  try {
    const end = Date.now() + 1000;
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (err) {
    console.error('Confetti trigger failed:', err);
  }
}

export function SettlementCelebrationDialog({
  isOpen,
  onClose,
  customerName,
  amountSettled,
}: SettlementCelebrationDialogProps) {
  useEffect(() => {
    if (isOpen) {
      fireSettlementConfetti();
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="settlement-celebration-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs pointer-events-auto"
          onClick={onClose}
        >
          <motion.div
            id="settlement-celebration-card"
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 24,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-5"
          >
            {/* Pop-in animated checkmark ring */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.1,
                  type: 'spring',
                  stiffness: 300,
                  damping: 18,
                }}
                className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/30 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.25,
                    type: 'spring',
                    stiffness: 500,
                    damping: 20,
                  }}
                  className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30"
                >
                  <Check className="w-8 h-8 stroke-[3]" />
                </motion.div>
              </motion.div>

              {/* Floating sparkles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 pointer-events-none"
              >
                <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1" />
                <PartyPopper className="w-5 h-5 text-emerald-500 absolute -bottom-1 -left-1" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-1.5"
            >
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                100% Zero Balance
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
                Account Fully Settled!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {customerName ? (
                  <>
                    <strong className="text-slate-700 dark:text-slate-200">{customerName}</strong> has cleared all pending dues.
                  </>
                ) : (
                  'Customer has successfully cleared all pending store udhaar.'
                )}
              </p>
            </motion.div>

            {amountSettled !== undefined && amountSettled > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/60"
              >
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  Final Payment Received
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatINR(amountSettled)}
                </span>
              </motion.div>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
