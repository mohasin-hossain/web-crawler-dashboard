import { motion } from "framer-motion";
import { Globe } from "lucide-react";

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed: _ }: HeaderProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const logoVariants = {
    initial: { rotate: 0, scale: 1 },
    animate: {
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
    hover: {
      rotate: 360,
      scale: 1.1,
      transition: {
        duration: 0.6,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 fixed w-full top-0 z-30">
      <div className="transition-all duration-300 ml-0">
        <div className="pl-4 pr-8">
          <div className="flex justify-between items-center h-16">
            {/* Title */}
            <div className="flex items-center">
              <motion.div
                className="flex items-center space-x-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="relative w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
                  variants={itemVariants}
                  whileHover="hover"
                  animate="animate"
                  initial="initial"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500 opacity-0 rounded-xl"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div variants={logoVariants} className="relative z-10">
                    <Globe className="w-5 h-5 text-white" />
                  </motion.div>
                </motion.div>

                <motion.h1
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-400 dark:via-blue-500 dark:to-indigo-500 bg-clip-text text-transparent tracking-tight cursor-pointer"
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.05,
                    filter: "brightness(1.1)",
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut" as const,
                  }}
                >
                  CrawlDash
                </motion.h1>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
