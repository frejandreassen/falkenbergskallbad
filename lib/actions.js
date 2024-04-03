export async function getHeader() {
    const res = await fetch('https://cms.falkenbergskallbad.se/items/header',{ cache: 'no-cache' })
    // The return value is *not* serialized
    // You can return Date, Map, Set, etc.
   
    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch data')
    }
    const result = await res.json()
    return result.data
  }

  export async function getFooter() {
    const res = await fetch('https://cms.falkenbergskallbad.se/items/footer',{ cache: 'no-cache' })
    // The return value is *not* serialized
    // You can return Date, Map, Set, etc.
   
    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch data')
    }
    const result = await res.json()
    return result.data
  }