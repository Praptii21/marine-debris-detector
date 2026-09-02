import { useEffect, useRef, useState } from 'react'
import { drawSonarScene, seedFromString } from '../utils/sonarRender.js'

/**
 * Renders one sonar tile.
 *
 * - If `imageSrc` is provided (a real sonar image URL/blob from the
 *   backend or `/samples/`), it's shown directly — this is the path
 *   production uses. `imageSrc` always takes priority over procedural
 *   rendering.
 * - If `imageSrc` is missing, fails to load, or a `scene` is explicitly
 *   passed, falls back to a procedurally generated placeholder tile —
 *   purely so the UI never shows a blank/broken tile before real imagery
 *   exists at that path. Pass `seed` (any string) for a stable-but-fake
 *   placeholder keyed off e.g. a scan-line id.
 *
 * Defaults to `object-fit: cover` (fine for fixed-box thumbnails). Callers
 * that overlay percentage-positioned bounding boxes need the box to match
 * the image's real aspect ratio exactly — pass `onLoad` to get the image's
 * natural dimensions and size the container accordingly (see
 * AnnotationTool.jsx), and pass `objectFit: 'contain'` via `style` so nothing
 * is ever cropped in the meantime.
 */
export default function SonarCanvas({ imageSrc, scene, seed, style, className, onLoad }) {
  const canvasRef = useRef(null)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [imageSrc])

  const showImage = Boolean(imageSrc) && !imgFailed
  const fallbackScene = scene || (seed != null ? { seed: seedFromString(String(seed)), nadir: 'center', objects: [] } : null)

  useEffect(() => {
    if (showImage || !fallbackScene) return
    const canvas = canvasRef.current
    if (!canvas) return
    const render = () => drawSonarScene(canvas, fallbackScene)
    render()
    const ro = new ResizeObserver(render)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [showImage, fallbackScene])

  if (showImage) {
    return (
      <img
        src={imageSrc}
        alt="Side-scan sonar tile"
        className={className}
        onError={() => setImgFailed(true)}
        onLoad={(e) => onLoad?.({ naturalWidth: e.target.naturalWidth, naturalHeight: e.target.naturalHeight })}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...style }}
      />
    )
  }

  if (fallbackScene) {
    return <canvas ref={canvasRef} className={className} style={{ display: 'block', width: '100%', height: '100%', ...style }} />
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#04121a', color: 'rgba(224,247,242,0.4)', fontSize: 11, ...style }}
    >
      No image
    </div>
  )
}
