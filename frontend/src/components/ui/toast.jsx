import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Minimal toast system usable both inside React and from plain modules
// (e.g. the axios interceptor). A simple subscribe/emit store backs it.

let listeners = [];
let counter = 0;

export function toast({ title, description, variant = 'default' }) {
  const id = ++counter;
  const item = { id, title, description, variant };

  listeners.forEach((l) => l(item));

  return id;
}

function subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

const variantStyles = {
  default: 'border-border bg-card',
  destructive: 'border-red-800 bg-red-950 text-red-200',
  success: 'border-green-800 bg-green-950 text-green-200',
};

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    return subscribe((item) => {
      setItems((prev) => [...prev, item]);

      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }, 4000);
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={`rounded-lg border px-4 py-3 shadow-lg ${
              variantStyles[item.variant] || variantStyles.default
            }`}
          >
            {item.title && (
              <p className="text-sm font-semibold">{item.title}</p>
            )}
            {item.description && (
              <p className="mt-0.5 text-xs opacity-80">{item.description}</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
