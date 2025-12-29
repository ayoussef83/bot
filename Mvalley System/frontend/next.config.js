/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For Amplify deployment
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mzmeyp2cw9.us-east-1.awsapprunner.com/api',
  },
}

module.exports = nextConfig

