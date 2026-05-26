import React, { useRef } from 'react'
import ColorPicker, { Panel1, Swatches, Preview, HueSlider } from 'reanimated-color-picker'


type Props = {
  color: string
  onSelect: (color: string) => void
}

export const TagColorPicker = ({ color, onSelect }: Props) => {
  const lastHexRef = useRef(color.toLowerCase())

  return (
    <ColorPicker
      value={color}
      onChangeJS={(c) => {
          const nextHex = (c.hex ?? '').toLowerCase()
          if (!nextHex || nextHex === lastHexRef.current) return
          lastHexRef.current = nextHex
          onSelect(c.hex)
      }}
    >
        <Preview />
        <Panel1 />
        <HueSlider />
        <Swatches />
    </ColorPicker>
  )
}
