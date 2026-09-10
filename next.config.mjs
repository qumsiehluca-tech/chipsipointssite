/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/chipsipointssite",
  assetPrefix: "/chipsipointssite/",
  trailingSlash: true,
  images: { unoptimized: true }
};

export default nextConfig;
