import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getFooter, getHeader } from "@/lib/actions";
import "./globals.css";


export const metadata = {
  title: "Falkenbergs Kallbad",
  description: "Föreningen Falkenbergs Kallbadsvänner - Hyr och boka bastu vid Skrea Strand",
};

export default async function RootLayout({ children }) {
  const header = await getHeader()
  const footer = await getFooter()
  return (
    <html lang="en" className="h-full">
      <head>
        <link 
          href='https://fonts.googleapis.com/css2?family=Bodoni+Moda&display=swap' 
          rel="stylesheet"  
        />
        <link 
          href='https://fonts.googleapis.com/css2?family=Montserrat&display=swap' 
          rel="stylesheet"  
        />
      </head>
      <body className="h-full bg-transparent dark:bg-black font-montserrat">
        <div className="bg-white text-gray-700">
          <Header navigation={header.navigation} logo={header.logo}/>
          {children}
          <Footer navigation={footer.navigation} copyright_text={footer.copyright_text}/>
        </div>
      </body>
    </html>
  );
}
