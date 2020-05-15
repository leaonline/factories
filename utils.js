import { Match } from 'meteor/check'

export const isObject = Match.Where(x => typeof x === 'object' && x !== null)
export const maybe = x => Match.Maybe(x)
export const isNothingStringOrFunction = Match.Where(arg => arg ? (typeof arg === 'string' || typeof arg === 'function') : true)
export const isClass = Match.Where(x => typeof x === 'function' && typeof x.constructor === 'function')
