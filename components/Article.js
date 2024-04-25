import React from 'react';
import Image from 'next/image';
import parse from 'html-react-parser';

export default function Article({ content }) {
    const transform = (node) => {
        if (node.type === 'tag' && node.name === 'img') {
          const src = node.attribs.src;
          const alt = node.attribs.alt || '';
    
          // Extract width and height from the src URL
          const urlParams = new URLSearchParams(new URL(src).search);
          const width = urlParams.get('width');
          const height = urlParams.get('height');
    
          return (
            <Image
              src={src}
              alt={alt}
              width={width || 'auto'}
              height={height || 'auto'}
              layout="responsive"
              unoptimized={true} // Use if your external images are not optimized
            />
          );
        }
      };

  const parsedContent = parse(content, { replace: transform });

  return (
    <div className="pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="my-24 mx-auto max-w-2xl">
          <article className="prose-img:rounded-lg prose lg:prose-lg prose-headings:font-bodoni-moda">
            {parsedContent}
          </article>
        </div>
      </div>
    </div>
  );
}
