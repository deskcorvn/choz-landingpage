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
  const posts = await payload.find({
    collection: 'posts',
    limit: 3,
    sort: '-createdAt',
  })

  return <ZStationLandingPage posts={posts.docs} />
}
