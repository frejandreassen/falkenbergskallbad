import Article from '@/components/Article'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/article_page?filter[status][_eq]=published&fields[]=*,category.slug`).then((res) => res.json())
    const articles = res.data
    return articles.map((article) => ({
        category: article.category.slug,
        article: article.slug
    }))
  }


async function getData({article}) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/article_page?filter[slug][_eq]=${article}`)

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
            <div className="my-6 flex border-t border-gray-900/5 pt-6 mx-auto max-w-2xl ">
                <div className="relative flex items-center gap-x-4">
                    <img src='https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' alt="" className="h-10 w-10 rounded-full bg-gray-50" />
                    <div className="text-sm leading-6">
                        <p className="font-semibold text-gray-900">
                            <a href={data.author}>
                                <span className="absolute inset-0" />
                                Författare namn
                            </a>
                        </p>
                        <p className="text-gray-600">{data.author}</p>
                        <time dateTime={data.date_updated} className="text-gray-500">
                            {data.date_updated.slice(0, 10)}
                        </time>
                    </div>
                </div>

            </div>
        </div>
    )
  }