export default function NotFound() {
    return (
      <>
        <main className="relative isolate min-h-screen">
          <img
            src="/ant-rozetsky-q-DJ9XhKkhA-unsplash.jpg"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover object-top"
          />
          <div className="mx-auto max-w-7xl px-6 py-32 text-center sm:py-40 lg:px-8">
            <p className="text-base font-semibold leading-8">404</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight font-bodoni-moda sm:text-5xl">Sidan hittades inte</h1>
            <p className="mt-4 text-base sm:mt-6">Förlåt, vi kunde inte hitta sidan du letar efter.</p>
            <div className="mt-10 flex justify-center">
              <a href="/" className="text-sm font-semibold leading-7">
                <span aria-hidden="true">&larr;</span> Tillbaka till start
              </a>
            </div>
          </div>
        </main>
      </>
    )
  }
  