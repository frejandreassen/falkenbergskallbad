export default function Article({content}){
    return(
    <div className="pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="my-24 mx-auto max-w-2xl">
                <article className="
                prose-img:rounded-lg
                 prose lg:prose-lg prose-headings:font-bodoni-moda " >
                    <div dangerouslySetInnerHTML={{ __html: content }}/>
                </article>
            </div>
        </div>
    </div>
    )
}