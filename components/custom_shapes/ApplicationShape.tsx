'use client'

import {
  HTMLContainer,
  ShapeUtil,
  TLBaseShape,
  getDefaultColorTheme,
  DefaultColorStyle,
  Rectangle2d,
} from '@tldraw/tldraw'
import React from 'react'

export type ApplicationShape = TLBaseShape<'application', {
  name: string
  icons?: string[]
  w: number
  h: number
  color: DefaultColorStyle
}>

export class ApplicationShapeUtil extends ShapeUtil<ApplicationShape> {
  static override type = 'application' as const

  override isAspectRatioLocked = () => false
  override canResize = () => true

  override getDefaultProps(): ApplicationShape['props'] {
    return {
      name: 'New App',
      icons: [],
      w: 250,
      h: 100,
      color: 'black',
    }
  }

  override component(shape: ApplicationShape) {
    const { name, icons = [], w, h, color } = shape.props
    const theme = getDefaultColorTheme({})

    return (
      <HTMLContainer>
        <div
          style={{
            width: w,
            height: h,
            border: `2px solid ${theme[color].solid}`,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            boxSizing: 'border-box',
            backgroundColor: 'white',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{name}</div>

          {icons.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {icons.map((iconUrl, i) => (
                <img
                  key={i}
                  src={iconUrl}
                  alt={`icon-${i}`}
                  style={{ width: 20, height: 20 }}
                />
              ))}
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  }

  /** ✅ Usa Rectangle2d invece di un oggetto semplice */
  override getGeometry(shape: ApplicationShape) {
    return new Rectangle2d({
      x: 0,
      y: 0,
      width: shape.props.w,
      height: shape.props.h,
    })
  }

  override getOutline(shape: ApplicationShape) {
    const { w, h } = shape.props
    return new Path2D(`M0,0 H${w} V${h} H0 Z`)
  }

  override indicator(shape: ApplicationShape) {
  const { w, h } = shape.props
  return (
    <rect
      x={0}
      y={0}
      width={w}
      height={h}
      stroke="black"
      fill="none"
      strokeWidth={1}
    />
  )
}
}
