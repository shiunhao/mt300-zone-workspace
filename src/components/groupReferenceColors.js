const palette = [
  '#f5a623', // G1: amber
  '#55c8ac', // G2: teal
  '#b596f4', // G3: purple
  '#e8ce68',
  '#87c86f',
  '#db91bb',
  '#c8b68f',
  '#8fcec0',
  '#c29eda',
  '#c1cc79',
]

// Use group identity, never the filtered list position or current view.
export function getGroupReferenceColor(groupId) {
  const identity = String(groupId ?? '').trim().toUpperCase()
  const match = /^G([1-9]\d*)$/.exec(identity)
  const number = match ? Number(match[1]) : NaN
  if (Number.isSafeInteger(number)) return palette[(number - 1) % palette.length]

  let hash = 0
  for (let index = 0; index < identity.length; index += 1) {
    hash = (hash * 31 + identity.charCodeAt(index)) >>> 0
  }
  return palette[hash % palette.length]
}
