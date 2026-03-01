import { EmailFormSection } from "@/features/email/email-form-section";
import { BentoGridSection } from "@/features/landing/bento-section";
import { CTASectionCard } from "@/features/landing/cta/cta-card-section";
import { CTAImageSection } from "@/features/landing/cta/cta-image-section";
import { CtaSection } from "@/features/landing/cta/cta-section";
import { FAQSection } from "@/features/landing/faq-section";
import { FeaturesSection } from "@/features/landing/feature-section";
import { Hero } from "@/features/landing/hero";
import { LandingHeader } from "@/features/landing/landing-header";
import { PainSection } from "@/features/landing/pain";
import { ReviewGrid } from "@/features/landing/review/review-grid";
import { ReviewSingle } from "@/features/landing/review/review-single";
import { ReviewTriple } from "@/features/landing/review/review-triple";
import { SectionDivider } from "@/features/landing/section-divider";
import { StatsSection } from "@/features/landing/stats-section";
import { Footer } from "@/features/layout/footer";
import { Pricing } from "@/features/plans/pricing-section";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground relative flex h-fit flex-col">
      <div className="mt-16"></div>

      <LandingHeader />

      <Hero />

      <StatsSection />

      <BentoGridSection />

      <PainSection />

      <SectionDivider />

      <ReviewTriple
        reviews={[
          {
            image: "https://i.pravatar.cc/300?u=a1",
            name: "Sarah",
            review: `MistratonReview **catches bugs that would have slipped through** our manual reviews. It saved us from deploying a critical SQL injection vulnerability last week.`,
            role: "CTO",
          },
          {
            image: "https://i.pravatar.cc/300?u=a2",
            name: "Marcus",
            review: `**The inline comments are incredibly specific.** Instead of vague suggestions, it points to the exact line and explains the issue with a fix.`,
            role: "Senior Developer",
          },
          {
            image: "https://i.pravatar.cc/300?u=a3",
            name: "Elena",
            review: `**Our review turnaround dropped from days to minutes.** MistratonReview handles the first pass so our team can focus on architecture decisions.`,
            role: "Engineering Lead",
          },
        ]}
      />

      <SectionDivider />

      <ReviewSingle
        image="https://i.pravatar.cc/300?u=5"
        name="David"
        review={`MistratonReview **has become an essential part of our CI pipeline.** Every PR gets a thorough AI review before any human looks at it.`}
        role="VP of Engineering"
        compagnyImage="https://1000logos.net/wp-content/uploads/2017/03/McDonalds-Logo-2003.png"
        key={1}
      />

      <FeaturesSection
        features={[
          {
            badge: "⚡ Instant Review",
            title: "AI reviews your PR in seconds",
            description:
              "Open a pull request and get detailed code review comments within seconds, not hours.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt=""
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
          {
            badge: "💬 Inline Comments",
            title: "Comments on the exact lines that matter",
            description:
              "Get specific, actionable feedback posted directly on the lines that need attention.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt=""
                width={200}
                height={100}
                className="h-auto w-full object-cover"
              />
            ),
          },
          {
            badge: "🔒 Security Scanner",
            title: "Catch vulnerabilities before production",
            description:
              "Detects SQL injection, XSS, hardcoded secrets, and other security issues automatically.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt=""
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
          {
            badge: "🎯 Severity Levels",
            title: "Prioritize what matters most",
            description:
              "Every comment is categorized as critical, warning, or suggestion so you know what to fix first.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt=""
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
        ]}
      />

      <CTAImageSection />

      <CTASectionCard />

      <CtaSection />

      <Pricing />

      <FAQSection
        faq={[
          {
            question: "What is MistratonReview?",
            answer:
              "MistratonReview is an AI-powered GitHub App that automatically reviews every pull request using Mistral AI. It posts inline code review comments directly on the lines that need attention.",
          },
          {
            question: "How does the AI review work?",
            answer:
              "When you open or update a pull request, MistratonReview automatically fetches the code changes, sends them to Mistral AI for analysis, and posts inline comments on specific lines with actionable feedback.",
          },
          {
            question: "What issues does it catch?",
            answer:
              "MistratonReview identifies bugs, security vulnerabilities, performance issues, and best practice violations. It does not comment on code style or formatting - that is your linter's job.",
          },
          {
            question: "How long does a review take?",
            answer:
              "Most reviews complete within 10-30 seconds of opening a pull request, depending on the size of the changes.",
          },
          {
            question: "Which languages are supported?",
            answer:
              "MistratonReview works with any programming language. The AI analyzes code diffs regardless of the language, with particularly strong results for TypeScript, JavaScript, Python, Go, and Rust.",
          },
          {
            question: "Is my code secure?",
            answer:
              "Your code is sent to Mistral AI for analysis and is not stored. MistratonReview only accesses the diff of changed files, not your entire repository.",
          },
          {
            question: "What are the pricing plans?",
            answer:
              "MistratonReview offers a free tier for open source projects and affordable plans for teams. Check the pricing section for details.",
          },
        ]}
      />

      <SectionDivider />

      <ReviewGrid
        reviews={[
          {
            image: "https://i.pravatar.cc/300?u=b1",
            name: "Priya",
            review:
              "MistratonReview caught a race condition in our async code that none of us spotted during manual review. It saved us from a nasty production bug on day one.",
            role: "Backend Engineer",
          },
          {
            image: "https://i.pravatar.cc/300?u=b2",
            name: "Tom",
            review:
              "As an open source maintainer, I get dozens of PRs a week. MistratonReview handles the first pass so I can focus on design decisions instead of hunting for typos and basic bugs.",
            role: "Open Source Maintainer",
          },
          {
            image: "https://i.pravatar.cc/300?u=b3",
            name: "Fatima",
            review:
              "The security scanning is genuinely impressive. It flagged a hardcoded API key that had been in a branch for two days without anyone noticing.",
            role: "Security Engineer",
          },
          {
            image: "https://i.pravatar.cc/300?u=b4",
            name: "Ryan",
            review:
              "I was skeptical about AI code review, but the inline comments are precise and actionable. It does not leave vague feedback - it tells you exactly what to fix and why.",
            role: "Full Stack Developer",
          },
          {
            image: "https://i.pravatar.cc/300?u=b5",
            name: "Aiko",
            review:
              "Our junior developers have improved so much faster since we added MistratonReview. The detailed feedback on every PR acts like a mentor guiding their code.",
            role: "Engineering Manager",
          },
          {
            image: "https://i.pravatar.cc/300?u=b6",
            name: "Carlos",
            review:
              "Setup took less than two minutes. I installed the GitHub App, and the next PR my team opened already had a full review posted in seconds.",
            role: "DevOps Engineer",
          },
          {
            image: "https://i.pravatar.cc/300?u=b7",
            name: "Nina",
            review:
              "The severity levels are a great touch. I can immediately see what is critical versus what is just a suggestion, so I know exactly where to focus my attention.",
            role: "Senior Developer",
          },
          {
            image: "https://i.pravatar.cc/300?u=b8",
            name: "Ben",
            review:
              "We reduced our average PR review cycle from 4 hours to under 30 minutes. MistratonReview does the heavy lifting so human reviewers can add real value.",
            role: "Tech Lead",
          },
          {
            image: "https://i.pravatar.cc/300?u=b9",
            name: "Lena",
            review:
              "Perfect for solo developers too. Having an AI reviewer on every PR has made me a much more careful and thoughtful programmer.",
            role: "Indie Developer",
          },
          {
            image: "https://i.pravatar.cc/300?u=b10",
            name: "Kwame",
            review:
              "The file filtering is smart - it skips package-lock.json and generated files automatically. Reviews stay focused on the code that actually matters.",
            role: "Software Architect",
          },
        ]}
      />

      <EmailFormSection />

      <SectionDivider />

      <Footer />
    </div>
  );
}
