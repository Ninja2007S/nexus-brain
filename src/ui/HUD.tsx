import { useEffect, useRef, useState } from 'react'
import './HUD.css'

interface HUDProps {
  neuronCount: number
  connectionCount: number
}

/** Animates a displayed integer smoothly toward a target value. */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(0)

  useEffect(() => {
    fromRef.current = value
    startRef.current = null
    let raf = 0

    const step = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const t = Math.min(1, (now - startRef.current) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(fromRef.current + (target - fromRef.current) * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}

export default function HUD({ neuronCount, connectionCount }: HUDProps) {
  const displayedNeurons = useCountUp(neuronCount)
  const displayedConnections = useCountUp(connectionCount)

  return (
    <div className="hud">
      <div className="hud-panel hud-brand">
        <div className="hud-wordmark">NEXUS</div>
        <div className="hud-subtitle">AI Neural Core</div>
      </div>

      <div className="hud-panel hud-status">
        <div className="hud-row hud-status-row">
          <span className="hud-status-dot" />
          <span className="hud-label">Status</span>
          <span className="hud-value hud-value-online">Online</span>
        </div>
        <div className="hud-divider" />
        <div className="hud-row">
          <span className="hud-label">Neurons</span>
          <span className="hud-value">{displayedNeurons.toLocaleString()}</span>
        </div>
        <div className="hud-row">
          <span className="hud-label">Connections</span>
          <span className="hud-value">{displayedConnections.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
