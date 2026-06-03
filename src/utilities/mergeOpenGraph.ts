import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Mô hình Tổng kho - Kho khu vực - Trạm giao dịch trung bình mỗi 500-600m giúp gom đơn, giao nhận tinh gọn và tối ưu chi phí trung gian. Kênh phân phối D2C và mạng lưới Trạm giao dịch.',
  images: [
    {
      url: `${getServerSideURL()}/choz-og.png`,
    },
  ],
  siteName: 'Chợ Z',
  title: 'Chợ Z - Kênh phân phối D2C & Mạng lưới Trạm giao dịch',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
