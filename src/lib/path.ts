const REG_IDENTIFIER = /^[A-Za-z0-9_ ]*$/

const REG_INDEX = /^\d+$/

// TODO: allowed chars?
const REG_FILTERED_UPDATE = /^\$\[([a-zA-Z_]+)\]$/

export const PathSegmentKind = Object.freeze({
  /**
   * @example "myProperty"
   */
  IDENTIFIER: 'IDENTIFIER',
  /**
   * @example "0"
   */
  INDEX: 'INDEX',
  /**
   * @example "$"
   */
  POSITIONAL_UPDATE: 'POSITIONAL_UPDATE',
  /**
   * @example "$[]"
   */
  ARRAY_WIDE_UPDATE: 'ARRAY_WIDE_UPDATE',
  /**
   * @example "$[myFilter]"
   */
  FILTERED_UPDATE: 'FILTERED_UPDATE',
})

export interface PathSegment {
  /**
   * See `PathSegmentKind` enum.
   */
  kind: string
  /**
   * Raw segment string (as-is).
   */
  raw: string
  /**
   * Present when `kind` is `INDEX`, otherwise is `-1`.
   */
  index: number
  /**
   * Present when `kind` is `FILTERED_UPDATE`, otherwise is `""`.
   */
  identifier: string
}

export class Path {
  /**
   *
   */
  static parse(raw: string): Path {
    if (raw === '') {
      throw new TypeError(`Invalid path: "${raw}"`)
    }
    return new Path(raw, false)
  }

  /**
   *
   */
  static parseUpdate(raw: string): Path {
    if (raw === '') {
      throw new TypeError(`Invalid path: "${raw}"`)
    }
    return new Path(raw, true)
  }

  /**
   *
   */
  readonly raw: string

  /**
   *
   */
  readonly segments: PathSegment[]

  /**
   * @constructor
   */
  constructor(raw: string, update: boolean) {
    const segments: PathSegment[] = []

    if (raw !== '') {
      for (const chunk of raw.split('.')) {
        if (update && chunk === '$') {
          segments.push({
            kind: PathSegmentKind.POSITIONAL_UPDATE,
            raw: chunk,
            index: -1,
            identifier: '',
          })
        } else if (update && chunk === '$[]') {
          segments.push({
            kind: PathSegmentKind.ARRAY_WIDE_UPDATE,
            raw: chunk,
            index: -1,
            identifier: '',
          })
        } else {
          if (update && REG_INDEX.test(chunk)) {
            segments.push({
              kind: PathSegmentKind.INDEX,
              raw: chunk,
              index: Number.parseInt(chunk, 10),
              identifier: '',
            })
            continue
          }

          if (update) {
            const match = chunk.match(REG_FILTERED_UPDATE)
            if (match) {
              segments.push({
                kind: PathSegmentKind.FILTERED_UPDATE,
                raw: chunk,
                index: -1,
                identifier: match[1],
              })
              continue
            }
          }

          if (REG_IDENTIFIER.test(chunk)) {
            segments.push({
              kind: PathSegmentKind.IDENTIFIER,
              raw: chunk,
              index: -1,
              identifier: '',
            })
            continue
          }

          throw new TypeError(`Invalid path: "${raw}"`)
        }
      }
    }

    this.raw = raw
    this.segments = segments
  }
}
