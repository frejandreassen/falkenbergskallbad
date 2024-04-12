import Image from "next/image";

export default function Sponsors({header, content, logos, assetUrl}) {
    return (
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-x-8 gap-y-16 lg:grid-cols-2">
            <div className="mx-auto w-full max-w-xl lg:mx-0">
              <h2 className="text-3xl font-bodoni-moda font-bold tracking-tight text-gray-900">{header}</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                {content}
              </p>
              {/* <div className="mt-8 flex items-center gap-x-6">
                <a
                  href="#"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Create account
                </a>
                <a href="#" className="text-sm font-semibold text-gray-900">
                  Contact us <span aria-hidden="true">&rarr;</span>
                </a>
              </div> */}
            </div>
            <div className="mx-auto grid w-full max-w-xl grid-cols-2 items-center gap-y-12 sm:gap-y-14 lg:mx-0 lg:max-w-none lg:pl-8">
            {logos.map((logo) => (
              <Image
                key={logo.directus_files_id} // Ensuring each logo has a unique key
                className="max-h-16 w-full object-contain object-left"
                src={`${assetUrl}/${logo.directus_files_id}`}
                alt="Logo" // Consider making this dynamic if possible, e.g., logo.name
                width={120}
                height={80}
              />
            ))}
              
            </div>
          </div>
        </div>
      </div>
    )
  }
  