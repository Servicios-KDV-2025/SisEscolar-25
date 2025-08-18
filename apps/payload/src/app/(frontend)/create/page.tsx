import type { Metadata } from 'next/types'

import React from 'react'
import PageClient from './page.client'
import { Stepper } from '@/create/Stepper'

export default async function Page() {
  // const { q: query } = await searchParamsPromise
  // const payload = await getPayload({ config: configPromise })

  // const posts = await payload.find({
  //   collection: 'search',
  //   depth: 1,
  //   limit: 12,
  //   select: {
  //     title: true,
  //     slug: true,
  //     categories: true,
  //     meta: true,
  //   },
  //   // pagination: false reduces overhead if you don't need totalDocs
  //   pagination: false,
  //   ...(query
  //     ? {
  //         where: {
  //           or: [
  //             {
  //               title: {
  //                 like: query,
  //               },
  //             },
  //             {
  //               'meta.description': {
  //                 like: query,
  //               },
  //             },
  //             {
  //               'meta.title': {
  //                 like: query,
  //               },
  //             },
  //             {
  //               slug: {
  //                 like: query,
  //               },
  //             },
  //           ],
  //         },
  //       }
  //     : {}),
  // })

  return (
    <div className="">
      <PageClient />
      <div className="prose dark:prose-invert max-w-none text-center">
        <h1 className="mb-8 lg:mb-16">Esta es la pagina para comprar tu servicio</h1>
      </div>
      <div className="container mb-16">
        <Stepper />
      </div>

      {/* {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs as CardPostData[]} />
      ) : (
        <div className="container">No results found.</div>
      )} */}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Buy Serice Template`,
  }
}
