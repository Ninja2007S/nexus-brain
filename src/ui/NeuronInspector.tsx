import type {
  LiveNeuron,
} from '../types'

interface NeuronInspectorProps {
  neuron:
    | LiveNeuron
    | null
}

export default function NeuronInspector({
  neuron,
}: NeuronInspectorProps) {
  if (!neuron) {
    return (
      <div
        style={{
          position:
            'absolute',
          right: 24,
          bottom: 24,
          width: 280,
          padding: 18,
          borderRadius: 16,
          background:
            'rgba(5, 10, 20, 0.82)',
          border:
            '1px solid rgba(56, 189, 248, 0.2)',
          backdropFilter:
            'blur(16px)',
          color: '#e5f3ff',
          fontFamily:
            'Inter, sans-serif',
          pointerEvents:
            'none',
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing:
              '0.18em',
            textTransform:
              'uppercase',
            color:
              '#38bdf8',
          }}
        >
          Neural Inspector
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color:
              'rgba(229,243,255,0.55)',
          }}
        >
          Select a neuron to
          inspect its live
          PyTorch activation.
        </div>
      </div>
    )
  }

  const positive =
    neuron.activation >=
    0

  return (
    <div
      style={{
        position:
          'absolute',
        right: 24,
        bottom: 24,
        width: 280,
        padding: 18,
        borderRadius: 16,
        background:
          'rgba(5, 10, 20, 0.88)',
        border:
          '1px solid rgba(56, 189, 248, 0.25)',
        backdropFilter:
          'blur(18px)',
        boxShadow:
          '0 18px 50px rgba(0,0,0,0.35)',
        color: '#e5f3ff',
        fontFamily:
          'Inter, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing:
                '0.18em',
              textTransform:
                'uppercase',
              color:
                '#38bdf8',
            }}
          >
            Neural Inspector
          </div>

          <div
            style={{
              marginTop: 5,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {neuron.label}
          </div>
        </div>

        <div
          style={{
            width: 10,
            height: 10,
            borderRadius:
              '50%',
            background:
              positive
                ? '#38bdf8'
                : '#a855f7',
            boxShadow:
              positive
                ? '0 0 16px #38bdf8'
                : '0 0 16px #a855f7',
          }}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          display: 'grid',
          gap: 10,
        }}
      >
        <Stat
          label="Layer"
          value={String(
            neuron.layer,
          )}
        />

        <Stat
          label="Neuron"
          value={String(
            neuron.index,
          )}
        />

        <Stat
          label="Activation"
          value={neuron.activation.toFixed(
            6,
          )}
        />

        <Stat
          label="State"
          value={
            positive
              ? 'POSITIVE'
              : 'NEGATIVE'
          }
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        fontSize: 12,
      }}
    >
      <span
        style={{
          color:
            'rgba(229,243,255,0.45)',
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontFamily:
            'JetBrains Mono, monospace',
          color:
            '#dff6ff',
        }}
      >
        {value}
      </span>
    </div>
  )
}