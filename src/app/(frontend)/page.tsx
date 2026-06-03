import type { Metadata } from 'next'
import ZStationLandingPage from '@/components/z-station/ZStationLandingPage'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const metadata: Metadata = {
  title: 'Chợ Z - Kênh phân phối D2C & Mạng lưới Trạm giao dịch',
  description: 'Mô hình Tổng kho - Kho khu vực - Trạm giao dịch trung bình mỗi 500-600m giúp gom đơn, giao nhận tinh gọn và tối ưu chi phí trung gian.',
}

export default async function Home() {
  const payload = await getPayload({ config: configPromise })

  // Automatically delete old mock/seeded posts from database
  try {
    const allPosts = await payload.find({
      collection: 'posts',
      limit: 100,
      depth: 0,
    })
    for (const post of allPosts.docs) {
      if (post.slug !== 'cho-z-kenh-d2c-tu-goc-den-nguoi-dung') {
        await payload.delete({
          collection: 'posts',
          id: post.id,
        })
      }
    }
  } catch (err) {
    console.error('Failed to clean up old posts:', err)
  }

  const posts = await payload.find({
    collection: 'posts',
    limit: 3,
    sort: '-createdAt',
  })

  return <ZStationLandingPage posts={posts.docs} />
}
