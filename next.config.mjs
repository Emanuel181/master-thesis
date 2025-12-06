/** @type {import('next').NextConfig} */
const nextConfig = {
    reactCompiler: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "amz-s3-pdfs-gp.s3.us-east-1.amazonaws.com",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com", 
            }
        ],
    },
};

export default nextConfig;
