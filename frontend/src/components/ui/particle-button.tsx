import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { MousePointerClick } from "lucide-react";
import * as React from "react";
import { useRef, useState } from "react";

interface ParticleButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  onSuccess?: () => void;
  successDuration?: number;
}

function SuccessParticles({
  buttonRef,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return (
    <AnimatePresence>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed w-1 h-1 bg-black dark:bg-white rounded-full"
          style={{ left: centerX, top: centerY }}
          initial={{
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            scale: [0, 1, 0],
            x: [0, (i % 2 ? 1 : -1) * (Math.random() * 50 + 20)],
            y: [0, -Math.random() * 50 - 20],
          }}
          transition={{
            duration: 0.6,
            delay: i * 0.1,
            ease: "easeOut",
          }}
        />
      ))}
    </AnimatePresence>
  );
}

function ParticleButton({
  children,
  onClick,
  onSuccess,
  successDuration = 1000,
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ParticleButtonProps) {
  const [showParticles, setShowParticles] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setShowParticles(true);

    // Call the original onClick if provided
    if (onClick) {
      await onClick(e);
    }

    // Call onSuccess callback after a brief delay
    setTimeout(() => {
      onSuccess?.();
    }, 100);

    setTimeout(() => {
      setShowParticles(false);
    }, successDuration);
  };

  return (
    <>
      {showParticles && <SuccessParticles buttonRef={buttonRef} />}
      <Button
        ref={buttonRef}
        onClick={handleClick}
        variant={variant}
        size={size}
        asChild={asChild}
        className={cn(
          "relative",
          showParticles && "scale-95",
          "transition-transform duration-100",
          className
        )}
        {...props}
      >
        {children}
        <MousePointerClick className="h-4 w-4" />
      </Button>
    </>
  );
}

export { ParticleButton };
