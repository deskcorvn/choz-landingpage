export const convertVietnameseToSlug = (str: string): string => {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '') // remove special chars except spaces, hyphens, numbers, lowercase letters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // trim hyphens from ends
    .trim()
}

export const customSlugify = ({ valueToSlugify }: { valueToSlugify?: any }) => {
  if (typeof valueToSlugify === 'string') {
    return convertVietnameseToSlug(valueToSlugify)
  }
  return undefined
}
