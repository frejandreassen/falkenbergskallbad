'use server'
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import Hero from "@/components/Hero";
import Membership from "@/components/Membership";
import Sponsors from "@/components/Sponsors";


async function getData() {
  const res = await fetch('https://cms.falkenbergskallbad.se/items/start_page')
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}
async function getLogos() {
  const res = await fetch('https://cms.falkenbergskallbad.se/items/start_page_files')
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}
async function getArticles() {
  const res = await fetch('https://cms.falkenbergskallbad.se/items/article_page?fields[]=*,category.*')
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}

export default async function Page() {

  const startPage = await getData()
  const logos = await getLogos()
  const articles = await getArticles()
  const assetUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL + '/assets'
  return (
    <div className="bg-white">
      
      
      <Hero startPage={startPage} assetUrl={assetUrl}/>
      {(startPage.include_faq) ? <FAQ faqs={startPage.faqs} header={startPage.faq_header}/> : null}
      {(startPage.include_membership) ? <Membership startPage={startPage} assetUrl={assetUrl} email={startPage.contact_email}/> : null}
      {(startPage.include_sponsors) ? <Sponsors header={startPage.sponsor_header} content={startPage.sponsor_content} logos={logos} assetUrl={assetUrl}/> : null }
      {(startPage.include_blog) ? <Blog articles={articles} header={startPage.blog_header} content={startPage.blog_content} category={startPage.blog_category}/> : null }
      {(startPage.include_contact) ? <Contact header={startPage.contact_header} content={startPage.contact_content} email={startPage.contact_email} /> : null }
      
    </div>
  )
}
