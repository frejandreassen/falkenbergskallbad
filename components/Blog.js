import Image from "next/image"
import Link from "next/link"


  export default function Blog({articles, header, content, category}) {
    const filteredArticles = (category) ? articles.filter(a => a.category.id === category) : articles
    return (
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-4xl">
            <h2 className="text-3xl font-bodoni-moda font-bold tracking-tight text-gray-900 sm:text-4xl">{header}</h2>
            <p className="mt-2 text-lg leading-8 text-gray-600">
              {content}
            </p>
            <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-20">
              {filteredArticles.reverse().map((post) => (
                <article key={post.id} className="relative isolate flex flex-col gap-8 lg:flex-row">
                  <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:aspect-square lg:w-64 lg:shrink-0">
                    <Image
                      height={250}
                      width={250}
                      src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${post.featured_image}`}
                      alt=""
                      className="absolute inset-0 h-full w-full rounded-2xl bg-gray-50 object-cover"
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-x-4 text-xs">
                      <time dateTime={post.date_updated} className="text-gray-500">
                        {post.date_updated.slice(0,10)}
                      </time>
                      <Link
                        href={post.category.slug}
                        className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                      >
                        {post.category.title}
                      </Link>
                    </div>
                    <div className="group relative max-w-xl">
                      <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                        <Link href={`${post.category.slug}/${post.slug}`}>
                          <span className="absolute inset-0" />
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-5 text-sm leading-6 text-gray-600">{post.description}</p>
                    </div>
                    {/* <div className="mt-6 flex border-t border-gray-900/5 pt-6">
                      <div className="relative flex items-center gap-x-4">
                        <img src='https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' alt="" className="h-10 w-10 rounded-full bg-gray-50" />
                        <div className="text-sm leading-6">
                          <p className="font-semibold text-gray-900">
                              <span className="absolute inset-0" />
                               Författare namn
                          </p>
                          <p className="text-gray-600">{post.author}</p>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  