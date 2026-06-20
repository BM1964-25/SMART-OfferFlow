/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  output: isGithubPages ? "export" : undefined,
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  basePath: isGithubPages ? "/SMART-LV" : undefined,
  assetPrefix: isGithubPages ? "/SMART-LV/" : undefined
};

export default nextConfig;
