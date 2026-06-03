import { describe, expect, it } from 'vitest'

import { formatCountUpValue, getCountUpFrameValue } from '../../src/components/z-station/count-up-utils'

describe('formatCountUpValue', () => {
  it('formats integer count-up values with Vietnamese separators and suffix', () => {
    expect(formatCountUpValue(1250, '+')).toBe('1.250+')
  })

  it('formats decimal count-up values with Vietnamese decimal comma', () => {
    expect(formatCountUpValue(4.8, '/5')).toBe('4,8/5')
  })
})

describe('getCountUpFrameValue', () => {
  it('starts at zero before animation progress', () => {
    expect(getCountUpFrameValue(600, 0)).toBe(0)
  })

  it('returns the target value when animation completes', () => {
    expect(getCountUpFrameValue(600, 1)).toBe(600)
  })

  it('keeps decimal precision for decimal metrics', () => {
    expect(getCountUpFrameValue(4.8, 1, 1)).toBe(4.8)
  })
})
