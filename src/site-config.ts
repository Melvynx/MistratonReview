export const SiteConfig = {
  title: "MistratonReview",
  description:
    "AI-powered code review for every pull request, powered by Mistral AI",
  prodUrl: "https://mistratonreview.vercel.app",
  appId: "mistraton-review",
  domain: "mistratonreview.vercel.app",
  appIcon: "/images/icon.png",
  company: {
    name: "MistratonReview",
    address: "421 Rue de Paris, France", // Remove if not needed
  },
  brand: {
    primary: "#007291", // You can adjust this to your brand color
  },
  team: {
    image: "https://melvynx.com/images/me/twitter-en.jpg",
    website: "https://melvynx.com",
    twitter: "https://twitter.com/melvyn_me",
    name: "Melvynx",
  },
  features: {
    /**
     * If enable, you need to specify the logic of upload here : src/features/images/uploadImageAction.tsx
     * You can use Vercel Blob Storage : https://vercel.com/docs/storage/vercel-blob
     * Or you can use Cloudflare R2 : https://mlv.sh/cloudflare-r2-tutorial
     * Or you can use AWS S3 : https://mlv.sh/aws-s3-tutorial
     */
    enableImageUpload: false as boolean,
    /**
     * If enable, the user will be redirected to `/orgs` when he visits the landing page at `/`
     * The logic is located in middleware.ts
     */
    enableLandingRedirection: true as boolean,
  },
};
