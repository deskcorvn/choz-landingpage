import { FieldHook } from 'payload'

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

export const formatSlug = (fallbackField: string): FieldHook => ({ data, value }) => {
  const fallbackValue = data?.[fallbackField]
  if (typeof fallbackValue === 'string' && fallbackValue.length > 0) {
    const correctSlug = convertVietnameseToSlug(fallbackValue)
    
    // If the slug is empty, we set it to the correct Vietnamese slug
    if (!value || typeof value !== 'string' || value.length === 0) {
      return correctSlug
    }
    
    // Check if the current value is the default bad slugified version of the fallback field.
    // The default client-side slugify replaces spaces with hyphens and strips non-ASCII.
    const badGeneratedSlug = fallbackValue
      ?.replace(/([a-z])([A-Z])/g, '$1-$2')
      ?.replace(/[^a-zA-Z0-9-\s]/g, '')
      ?.replace(/\s+/g, '-')
      ?.toLowerCase()
      
    // If the value matches the bad slug, or contains '---' (from ' - '), we replace it
    if (value === badGeneratedSlug || value.includes('---') || value === correctSlug.replace(/-/g, '')) {
      return correctSlug
    }
  }
  return value
}
