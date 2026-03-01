"use client";

import { BentoGrid, BentoGridItem } from "@/components/nowts/bentoo";
import { Loader } from "@/components/nowts/loader";
import { Typography } from "@/components/nowts/typography";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  MessageSquareCode,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import { SectionLayout } from "./section-layout";

export function BentoGridSection() {
  return (
    <SectionLayout>
      <BentoGrid className="mx-auto max-w-4xl md:auto-rows-[20rem]">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={cn("[&>p:text-lg]", item.className)}
            icon={item.icon}
          />
        ))}
      </BentoGrid>
    </SectionLayout>
  );
}

const Skeleton1 = () => {
  const variants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full flex-col gap-2"
    >
      <motion.div className="border-border bg-background flex flex-row items-start gap-2 rounded-2xl border p-3">
        <img
          alt="avatar"
          src="https://melvynx.com/_next/image?url=%2Fimages%2Fmy-face.png&w=828&q=75"
          className="size-6 shrink-0 rounded-full"
        />
        <div>
          <p className="text-xs text-neutral-500">
            Review PR #42: add user authentication
          </p>
        </div>
      </motion.div>
      <motion.div
        variants={variants}
        className="border-border bg-background flex flex-row items-start justify-end gap-2 rounded-2xl border p-3"
      >
        <p className="text-xs text-neutral-500">
          Line 42: potential SQL injection - use parameterized queries instead
          of string concatenation.
        </p>
        <div className="size-6 shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
      </motion.div>
    </motion.div>
  );
};

const Skeleton2 = () => {
  const variants: Variants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
  };
  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full flex-col gap-2"
    >
      <motion.div>
        <Alert variant="default" className="">
          <Loader size={20} />
          <AlertTitle>Analyzing PR diff...</AlertTitle>
        </Alert>
      </motion.div>
      <motion.div variants={variants}>
        <Alert variant="success" className="">
          <CheckCircle size={20} />
          <AlertTitle>Review posted - 3 comments on 2 files</AlertTitle>
        </Alert>
      </motion.div>
    </motion.div>
  );
};
const Skeleton3 = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex size-full min-h-24 flex-1 flex-col space-y-2 rounded-lg"
      style={{
        background:
          "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="size-full rounded-lg"></motion.div>
    </motion.div>
  );
};
const Skeleton4 = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 flex-row gap-4"
    >
      <motion.div
        variants={first}
        className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4"
      >
        <Typography variant="large">Critical</Typography>
        <Typography variant={"muted"}>2 issues</Typography>
        <Typography variant={"muted"} className="text-red-500">
          Fix now
        </Typography>
      </motion.div>
      <motion.div className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4">
        <Typography variant="large">Warning</Typography>
        <Typography variant={"muted"}>5 issues</Typography>
        <Typography variant={"muted"} className="text-yellow-500">
          Review
        </Typography>
      </motion.div>
      <motion.div
        variants={second}
        className="border-border bg-background flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border p-4"
      >
        <Typography variant="large">Suggestion</Typography>
        <Typography variant="large">8 notes</Typography>
        <Typography variant={"muted"}>Optional</Typography>
        <Typography variant={"muted"} className="text-green-500">
          Consider
        </Typography>
      </motion.div>
    </motion.div>
  );
};

const Skeleton5 = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-col gap-2"
    >
      <motion.div
        variants={variants}
        className="border-border bg-background flex flex-row items-start gap-2 rounded-2xl border p-3"
      >
        <img
          src="https://melvynx.com/_next/image?url=%2Fimages%2Fmy-face.png&w=828&q=75"
          alt="avatar"
          height="100"
          width="100"
          className="size-10 rounded-full"
        />
        <p className="text-xs text-neutral-500">
          Which files should be excluded from reviews?
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="border-border bg-background flex flex-row items-start justify-end gap-2 rounded-2xl border p-3"
      >
        <div>
          <p className="text-xs text-neutral-500">Filtering...</p>
          <motion.p
            className="text-xs text-neutral-500"
            variants={{
              initial: {
                opacity: 0,
              },
              animate: {
                opacity: 1,
              },
            }}
          >
            Skipping: package-lock.json, *.min.js, *.d.ts, generated files.
            Reviewing: 4 changed source files.
          </motion.p>
        </div>
        <div className="size-6 shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
      </motion.div>
    </motion.div>
  );
};

const items = [
  {
    title: "AI Analysis",
    description: (
      <span className="text-sm">
        Intelligent code review powered by Mistral AI with senior-level
        feedback.
      </span>
    ),
    header: <Skeleton1 />,
    className: "md:col-span-1",
    icon: <Sparkles size={20} />,
  },
  {
    title: "Inline Comments",
    description: (
      <span className="text-sm">
        Feedback posted directly on the exact lines that need attention.
      </span>
    ),
    header: <Skeleton2 />,
    className: "md:col-span-1",
    icon: <MessageSquareCode size={20} />,
  },
  {
    title: "Security Scan",
    description: (
      <span className="text-sm">
        Detects SQL injection, XSS, hardcoded secrets, and other
        vulnerabilities.
      </span>
    ),
    header: <Skeleton3 />,
    className: "md:col-span-1",
    icon: <ShieldAlert size={20} />,
  },
  {
    title: "Summary Report",
    description: (
      <span className="text-sm">
        Every comment categorized as critical, warning, or suggestion so you
        know what to fix first.
      </span>
    ),
    header: <Skeleton4 />,
    className: "md:col-span-2",
    icon: <AlertTriangle size={20} />,
  },

  {
    title: "File Filtering",
    description: (
      <span className="text-sm">
        Automatically skips lockfiles, minified files, and generated code to
        focus on what matters.
      </span>
    ),
    header: <Skeleton5 />,
    className: "md:col-span-1",
    icon: <Filter size={20} />,
  },
];
