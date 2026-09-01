import { useEffect, useRef } from 'react'
import { drawSonarScene } from '../utils/sonarRender.js'

/**
 * Renders one sonar tile.
 *
 * - If `imageSrc` is provided (a real sonar image URL/blob from the
 *   backend), it's shown directly — this is the path production will use.
 * - Otherwise it falls back to a procedurally generated placeholder scene,
 *   purely so the UI has something to display before real imagery exists.
 */
export default function SonarCanvas({ imageSrc, scene, style, className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (imageSrc || !scene) return
    const canvas = canvasRef.current
    if (!canvas) return
    const render = () => drawSonarScene(canvas, scene)
    render()
    const ro = new ResizeObserver(render)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [imageSrc, scene])

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt="Side-scan sonar tile"
        className={className}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...style }}
      />
    )
  }

  return <canvas ref={canvasRef} className={className} style={{ display: 'block', width: '100%', height: '100%', ...style }} />
}
