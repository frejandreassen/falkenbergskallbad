import Article from '@/components/Article'
import Blog from '@/components/Blog'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/category_page?filter[status][_eq]=published`).then((res) => res.json())
    const categories = res.data
    return categories.map((category) => ({
        category: category.slug
    }))
  }


async function getData({category}) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/category_page?filter[slug][_eq]=${category}&fields[]=*,articles.*,articles.category.*`, { next: { revalidate: 60 } })

    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
    }
    const result = await res.json()
    if (result.data.length < 1) notFound()
    return result.data[0]
}
  
export default async function Page({ params }) {
    const data = await getData(params)
    return (
        <div>
            <Article content={data.content} />
            {(data.articles.length > 0) ? <>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-sm text-gray-500">Artiklar</span>
                    </div>
                </div>
                <Blog articles={data.articles} title={data.title} description={data.description}/>
            </> : null
            }
        </div>
    )
  }