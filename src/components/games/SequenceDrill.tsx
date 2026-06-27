import { useEffect, useState } from 'react'
import type { AttemptPayload } from '../../types'

function randomSequence(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 9))
}

export function SequenceDrill({
  bestScore,
  onComplete,
}: {
  bestScore?: number
  onComplete: (payload: AttemptPayload) => void
}) {
  const [stage, setStage] = useState<'idle' | 'showing' | 'input' | 'done'>('idle')
  const [level, setLevel] = useState(3)
  const [sequence, setSequence] = useState<number[]>([])
  const [activeCell, setActiveCell] = useState<number | null>(null)
  const [inputIndex, setInputIndex] = useState(0)
  const [note, setNote] = useState('Запомните порядок фаз и повторите его.')

  useEffect(() => {
    if (stage !== 'showing') {
      return
    }

    const timers: number[] = []

    sequence.forEach((cell, index) => {
      timers.push(
        window.setTimeout(() => {
          setActiveCell(cell)
        }, index * 650),
      )
      timers.push(
        window.setTimeout(() => {
          setActiveCell(null)
        }, index * 650 + 360),
      )
    })

    timers.push(
      window.setTimeout(() => {
        setStage('input')
        setNote('Теперь воспроизведите цепочку.')
      }, sequence.length * 650 + 160),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [sequence, stage])

  const startLevel = (nextLevel: number) => {
    setLevel(nextLevel)
    setSequence(randomSequence(nextLevel))
    setInputIndex(0)
    setStage('showing')
    setNote('Смотрите на последовательность.')
  }

  const start = () => {
    startLevel(3)
  }

  const finish = (currentLevel: number, success: boolean) => {
    const score = currentLevel * 140 + inputIndex * 30 + (success ? 60 : 0)
    setStage('done')
    setNote('Попытка завершена. Можно начать заново и пройти дальше.')
    onComplete({
      score,
      label: `Уровень ${currentLevel}`,
      summary: success
        ? `Последовательность длиной ${currentLevel} воспроизведена без ошибок.`
        : `Ошибка на уровне ${currentLevel}, шаг ${inputIndex + 1}.`,
    })
  }

  const handleClick = (cell: number) => {
    if (stage !== 'input') {
      return
    }

    if (sequence[inputIndex] === cell) {
      const nextIndex = inputIndex + 1

      if (nextIndex === sequence.length) {
        if (level >= 7) {
          finish(level, true)
          return
        }

        setNote('Есть. Усложняем сценарий.')
        window.setTimeout(() => startLevel(level + 1), 600)
        return
      }

      setInputIndex(nextIndex)
      return
    }

    finish(level, false)
  }

  return (
    <section className="game-panel">
      <div className="game-panel__header">
        <div>
          <span className="eyebrow">Memory lab</span>
          <h3>Запомните kill chain</h3>
        </div>
        <div className="game-panel__metrics">
          <span>Текущий уровень {level}</span>
          <span>Лучший score: {bestScore ?? 'нет'}</span>
        </div>
      </div>

      <p className="game-panel__note">{note}</p>

      <div className="memory-grid">
        {Array.from({ length: 9 }, (_, index) => (
          <button
            key={index}
            type="button"
            className={`memory-grid__cell ${activeCell === index ? 'memory-grid__cell--active' : ''}`}
            onClick={() => handleClick(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="game-panel__actions">
        <button type="button" className="button button--primary" onClick={start}>
          {stage === 'idle' ? 'Начать' : 'Сыграть заново'}
        </button>
        <span className="inline-hint">Шаг воспроизведения: {inputIndex + 1}</span>
      </div>
    </section>
  )
}
