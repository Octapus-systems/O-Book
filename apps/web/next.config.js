/** @type {import('next').NextConfig} */
const path = require('path')
const { config } = require('dotenv')

config({ path: path.resolve(__dirname, '../../.env') })

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@o-book/database'],
  serverExternalPackages: ['bcrypt'],
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
