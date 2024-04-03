'use server'
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import Hero from "@/components/Hero";
import Sponsors from "@/components/Sponsors";


async function getData() {
  const res = await fetch('https://cms.falkenbergskallbad.se/items/start_page', { next: { revalidate: 60 } })
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}
async function getArticles() {
  const res = await fetch('https://cms.falkenbergskallbad.se/items/article_page?fields[]=*,category.*', { next: { revalidate: 60 } })
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}

export default async function Page() {

  const startPage = await getData()
  const articles = await getArticles()
  const assetUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL + '/assets'
  return (
    <div className="bg-white">
      
      
      <Hero startPage={startPage} assetUrl={assetUrl}/>
      <FAQ />
      <Sponsors />
      <Blog articles={articles} title={startPage.title} description={startPage.description}/>
      <Contact />
      
    </div>
  )
}
