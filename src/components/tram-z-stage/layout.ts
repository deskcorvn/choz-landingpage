/** Fixed 1920×1080 stage layout (the whole stage is scaled to fit the window). */
import { MAP_H, MAP_W } from './geometry'

export const STAGE_W = 1920
export const STAGE_H = 1080
export const HEADER_H = 88
export const BOTTOM_H = 200
export const MAIN_Y = HEADER_H
export const MAIN_H = STAGE_H - HEADER_H - BOTTOM_H // 792
export const MAP_X = 0
export const MAP_Y = MAIN_Y

export const CARDS_X = MAP_W + 20 // 1172
export const CARDS_W = STAGE_W - CARDS_X - 20 // 728
export const CARD_GAP = 10
export const CARDS_PAD_Y = 16
export const CARD_H = Math.floor((MAIN_H - CARDS_PAD_Y * 2 - CARD_GAP * 5) / 6) // 118

export const cardTop = (i: number) => MAIN_Y + CARDS_PAD_Y + i * (CARD_H + CARD_GAP)
export const cardAnchor = (i: number) => ({ x: CARDS_X, y: cardTop(i) + CARD_H / 2 })

/** The pixel map fills the main band exactly. */
export const MAP_FITS = MAP_H === MAIN_H && MAP_W === CARDS_X - 20
