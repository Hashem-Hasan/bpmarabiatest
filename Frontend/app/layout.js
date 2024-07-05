import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbarr";
import Footer from "./components/Footer";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BPMN Arabia",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-white">
      
      <body className={inter.className}>
      <Navbar />
        {children}
        <Footer />
        </body>
        
        
    </html>
  );
}
