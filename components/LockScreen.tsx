
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LockScreenProps {
  onUnlock: () => void;
  targetPin: string;
}

const PIN_LENGTH = 4;

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, targetPin }) => {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input
    inputRef.current?.focus();
    const focusInterval = setInterval(() => {
        if (!isExiting) inputRef.current?.focus();
    }, 1000);
    return () => clearInterval(focusInterval);
  }, [isExiting]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= PIN_LENGTH && /^\d*$/.test(val)) {
      setPin(val);
      setError(false);
      
      if (val.length === PIN_LENGTH) {
        if (val === targetPin) {
          setIsExiting(true);
          setTimeout(onUnlock, 800); // Wait for exit animation
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 500);
        }
      }
    }
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.77, 0, 0.175, 1] } }}
          className="fixed inset-0 z-50 bg-blue-base flex flex-col items-center justify-center text-white select-none"
          onClick={() => inputRef.current?.focus()}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold mb-10 tracking-[4px] uppercase"
          >
            Enter Passcode
          </motion.div>

          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex gap-5 relative"
          >
            {[...Array(PIN_LENGTH)].map((_, i) => (
              <div
                key={i}
                className={`w-[60px] h-[80px] border-4 border-white rounded-lg flex items-center justify-center text-4xl font-bold transition-all duration-200 ${
                  i < pin.length ? 'bg-white text-blue-base' : 'bg-transparent text-white'
                }`}
              >
                {i < pin.length ? '•' : ''}
              </div>
            ))}
            
            <input
              ref={inputRef}
              type="tel"
              value={pin}
              onChange={handleInput}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              inputMode="numeric"
              autoComplete="off"
            />
          </motion.div>
          
          {error && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute bottom-20 text-red-300 font-bold uppercase tracking-widest text-sm"
            >
                Access Denied
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
