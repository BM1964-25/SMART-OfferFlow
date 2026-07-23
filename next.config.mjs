/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  output: isGithubPages ? "export" : undefined,
  serverExternalPackages: ["pdfkit"],
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  basePath: isGithubPages ? "/SMART-OfferFlow" : undefined,
  assetPrefix: isGithubPages ? "/SMART-OfferFlow/" : undefined
};

export default nextConfig;
