import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/choz-og.png'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  if (url.includes('website-template-OG.webp')) {
    url = serverUrl + '/choz-og.png'
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image)

  let docTitle = doc?.meta?.title
  if (docTitle === 'Payload Website Template') {
    docTitle = undefined
  }

  let docDescription = doc?.meta?.description
  if (
    !docDescription ||
    docDescription === 'An open-source website built with Payload and Next.js.'
  ) {
    docDescription =
      'Mô hình Tổng kho - Kho khu vực - Trạm giao dịch trung bình mỗi 500-600m giúp gom đơn, giao nhận tinh gọn và tối ưu chi phí trung gian. Kênh phân phối D2C và mạng lưới Trạm giao dịch.'
  }

  const title = docTitle
    ? docTitle + ' | Chợ Z'
    : 'Chợ Z - Kênh phân phối D2C & Mạng lưới Trạm giao dịch'

  return {
    description: docDescription,
    openGraph: mergeOpenGraph({
      description: docDescription,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
