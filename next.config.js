/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';



const nextConfig = {

  // Only allow dev origins in development

  ...(isDev && { allowedDevOrigins: ['192.168.1.8'] }),

  

  images: {

    remotePatterns: [

      { protocol: "https", hostname: "*.supabase.co" },

    ],

  },

  

  async headers() {

    // Build CSP connect-src based on environment

    const connectSrc = isDev

      ? "connect-src 'self' http://192.168.1.7:* https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com"

      : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com";



    return [

      {

        source: "/(.*)",

        headers: [

          { key: "X-Frame-Options", value: "DENY" },

          { key: "X-Content-Type-Options", value: "nosniff" },

          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          { key: "X-XSS-Protection", value: "1; mode=block" },

          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

          // Only add HSTS in production

          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),

          {

            key: "Content-Security-Policy",

            value: [

              "default-src 'self'",

              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",

              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              "font-src 'self' https://fonts.gstatic.com",

              "img-src 'self' data: blob: https://*.supabase.co https://wa.me",

              connectSrc,

              "frame-ancestors 'none'",

            ].join("; "),

          },

        ],

      },

      {

        source: "/api/(.*)",

        headers: [

          { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'" },

        ],

      },

    ];

  },

};



module.exports = nextConfig;