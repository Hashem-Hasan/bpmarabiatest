import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbarr";
import Footer from "./components/Footer";
import ScreenSizeWarning from "./components/ScreenSizeWarning"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BPMArabia App | Simplifying BPMN Solutions",
  description: "BPMArabia is the leading platform for managing, designing, and optimizing BPMN solutions. Explore tools, resources, and guides to improve your business processes efficiently.",
  keywords: [
    "BPMArabia",
    "BPMN solutions",
    "Business process management",
    "BPM tools",
    "process optimization",
    "workflow management"
  ],
  openGraph: {
    title: "BPMArabia App",
    description: "Leading platform for BPMN solutions, tools, and resources.",
    url: "https://app.bpmarabia.com",
    type: "website",
    images: [
      {
        url: "/Cover.jpg", // Provide a path to an Open Graph image
        width: 1200,
        height: 630,
        alt: "BPMArabia App",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BPMArabia App",
    description: "Leading platform for BPMN solutions, tools, and resources.",
    site: "@BPMArabia", // Replace with actual Twitter handle
    images: ["/Cover.jpg"], // Provide a path to a Twitter Card image
  },
  link: [
    {
      rel: "icon",
      href: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      href: "/icons/apple-touch-icon.png",
      sizes: "180x180",
    },
    {
      rel: "canonical",
      href: "https://app.bpmarabia.com",
    },
  ],
  robots: "index, follow",
  charset: "UTF-8",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className=" bg-white">
      <head>
        {/* Add metadata here */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords.join(", ")} />
        {/* Open Graph tags */}
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta property="og:description" content={metadata.openGraph.description} />
        <meta property="og:url" content={metadata.openGraph.url} />
        <meta property="og:type" content={metadata.openGraph.type} />
        <meta property="og:image" content={metadata.openGraph.images[0].url} />
        {/* Twitter Card tags */}
        <meta name="twitter:card" content={metadata.twitter.card} />
        <meta name="twitter:title" content={metadata.twitter.title} />
        <meta name="twitter:description" content={metadata.twitter.description} />
        <meta name="twitter:image" content={metadata.twitter.images[0]} />
        {metadata.link.map((link, index) => (
          <link key={index} rel={link.rel} href={link.href} sizes={link.sizes || ''} />
        ))}
        <title>{metadata.title}</title>
      </head>
      <body className={inter.className}>
        <ScreenSizeWarning /> 
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
