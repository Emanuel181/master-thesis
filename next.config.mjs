/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    domains: ['amz-s3-pdfs-gp.s3.us-east-1.amazonaws.com'],
  },
};

export default nextConfig;
