import { Download, FileJson, RotateCcw, Save, Trash2, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SectionTitle } from '../components/SectionTitle'
import { materials as seedMaterials, tests as seedTests } from '../data/siteData'
import { useContentState } from '../hooks/useContentState'
import type { CyberTest, MaterialItem, QuizQuestion } from '../types'
import {
  createEmptyMaterial,
  createEmptyTest,
  parseBundle,
  serializeBundle,
  slugifyValue,
  splitLines,
} from '../utils/contentAdmin'

type AdminTab = 'tests' | 'materials' | 'import'

function formatQuestions(value?: QuizQuestion[]) {
  return JSON.stringify(value ?? [], null, 2)
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function AdminPage() {
  const {
    tests,
    materials,
    saveTest,
    deleteTest,
    saveMaterial,
    deleteMaterial,
    replaceAllContent,
    resetContent,
  } = useContentState()
  const [tab, setTab] = useState<AdminTab>('tests')
  const [testSourceSlug, setTestSourceSlug] = useState<string | null>(tests[0]?.slug ?? null)
  const [materialSourceSlug, setMaterialSourceSlug] = useState<string | null>(materials[0]?.slug ?? null)
  const [testDraft, setTestDraft] = useState<CyberTest>(tests[0] ?? createEmptyTest())
  const [materialDraft, setMaterialDraft] = useState<MaterialItem>(materials[0] ?? createEmptyMaterial())
  const [questionsText, setQuestionsText] = useState(formatQuestions(tests[0]?.questions))
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('Панель управления контентом готова к работе.')

  const exportText = useMemo(() => serializeBundle({ tests, materials }), [materials, tests])

  const selectTest = (test: CyberTest) => {
    setTestSourceSlug(test.slug)
    setTestDraft(test)
    setQuestionsText(formatQuestions(test.questions))
  }

  const selectMaterial = (material: MaterialItem) => {
    setMaterialSourceSlug(material.slug)
    setMaterialDraft(material)
  }

  const saveCurrentTest = async () => {
    try {
      const parsedQuestions = testDraft.mode === 'quiz' ? (JSON.parse(questionsText) as QuizQuestion[]) : undefined
      const nextSlug = slugifyValue(testDraft.slug) || slugifyValue(testDraft.title) || `test-${Date.now()}`
      await saveTest(
        {
          ...testDraft,
          slug: nextSlug,
          deck: splitLines(testDraft.deck.join('\n')),
          benefits: splitLines(testDraft.benefits.join('\n')),
          questions: parsedQuestions,
        },
        testSourceSlug ?? undefined,
      )
      setTestSourceSlug(nextSlug)
      setTestDraft((current) => ({ ...current, slug: nextSlug, questions: parsedQuestions }))
      setMessage('Тест сохранён.')
    } catch {
      setMessage('Не удалось сохранить тест: проверьте JSON блока вопросов.')
    }
  }

  const saveCurrentMaterial = async () => {
    const nextSlug =
      slugifyValue(materialDraft.slug) ||
      slugifyValue(materialDraft.title) ||
      `material-${Date.now()}`
    await saveMaterial(
      {
        ...materialDraft,
        slug: nextSlug,
        highlights: splitLines(materialDraft.highlights.join('\n')),
        body: splitLines(materialDraft.body.join('\n')),
      },
      materialSourceSlug ?? undefined,
    )
    setMaterialSourceSlug(nextSlug)
    setMaterialDraft((current) => ({ ...current, slug: nextSlug }))
    setMessage('Материал сохранён.')
  }

  const importBundle = async () => {
    try {
      const bundle = parseBundle(importText)
      await replaceAllContent(bundle)
      if (bundle.tests[0]) {
        selectTest(bundle.tests[0])
      }
      if (bundle.materials[0]) {
        selectMaterial(bundle.materials[0])
      }
      setMessage('JSON импортирован. Содержимое сайта обновлено.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось импортировать JSON.')
    }
  }

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Панель управления</span>
          <h1>Управление контентом</h1>
          <p>
            Редактируйте тесты и материалы, импортируйте JSON-пакеты и выгружайте текущую структуру
            контента.
          </p>
        </div>
        <div className="page-hero__aside">
          <div className="card compact-card">
            <strong>{tests.length}</strong>
            <span>тестов в хранилище</span>
          </div>
          <div className="card compact-card">
            <strong>{materials.length}</strong>
            <span>материалов в хранилище</span>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionTitle
          eyebrow="Управление контентом"
          title="Редактирование, импорт и экспорт"
          description="Работайте с тестами и материалами в одном месте и сразу проверяйте результат на страницах сайта."
        />

        <div className="toolbar__chips toolbar__chips--solo">
          <button type="button" className={`chip ${tab === 'tests' ? 'chip--active' : ''}`} onClick={() => setTab('tests')}>
            Тесты
          </button>
          <button
            type="button"
            className={`chip ${tab === 'materials' ? 'chip--active' : ''}`}
            onClick={() => setTab('materials')}
          >
            Материалы
          </button>
          <button type="button" className={`chip ${tab === 'import' ? 'chip--active' : ''}`} onClick={() => setTab('import')}>
            JSON / импорт
          </button>
        </div>

        <div className="admin-status">{message}</div>

        {tab === 'tests' ? (
          <div className="admin-layout">
            <aside className="card admin-sidebar">
              <div className="admin-sidebar__header">
                <h3>Тесты</h3>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    const blank = createEmptyTest()
                    setTestSourceSlug(null)
                    setTestDraft(blank)
                    setQuestionsText(formatQuestions(blank.questions))
                  }}
                >
                  Новый
                </button>
              </div>
              <div className="admin-sidebar__list">
                {tests.map((test) => (
                  <button
                    key={test.slug}
                    type="button"
                    className={`admin-item ${testSourceSlug === test.slug ? 'admin-item--active' : ''}`}
                    onClick={() => selectTest(test)}
                  >
                    <strong>{test.title}</strong>
                    <span>
                      {test.category} · {test.status}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <article className="card admin-editor">
              <div className="admin-editor__grid">
                <label className="field">
                  <span>Название</span>
                  <input
                    value={testDraft.title}
                    onChange={(event) => setTestDraft((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Slug</span>
                  <input
                    value={testDraft.slug}
                    onChange={(event) => setTestDraft((current) => ({ ...current, slug: event.target.value }))}
                  />
                </label>
                <label className="field field--wide">
                  <span>Headline</span>
                  <input
                    value={testDraft.headline}
                    onChange={(event) =>
                      setTestDraft((current) => ({ ...current, headline: event.target.value }))
                    }
                  />
                </label>
                <label className="field field--wide">
                  <span>Описание</span>
                  <textarea
                    value={testDraft.description}
                    onChange={(event) =>
                      setTestDraft((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Категория</span>
                  <input
                    value={testDraft.category}
                    onChange={(event) =>
                      setTestDraft((current) => ({ ...current, category: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Tag</span>
                  <input
                    value={testDraft.tag}
                    onChange={(event) => setTestDraft((current) => ({ ...current, tag: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Сложность</span>
                  <select
                    value={testDraft.difficulty}
                    onChange={(event) =>
                      setTestDraft((current) => ({
                        ...current,
                        difficulty: event.target.value as CyberTest['difficulty'],
                      }))
                    }
                  >
                    <option value="База">База</option>
                    <option value="Средний">Средний</option>
                    <option value="Продвинутый">Продвинутый</option>
                  </select>
                </label>
                <label className="field">
                  <span>Режим</span>
                  <select
                    value={testDraft.mode}
                    onChange={(event) =>
                      setTestDraft((current) => ({
                        ...current,
                        mode: event.target.value as CyberTest['mode'],
                      }))
                    }
                  >
                    <option value="reflex">reflex</option>
                    <option value="sequence">sequence</option>
                    <option value="priority">priority</option>
                    <option value="quiz">quiz</option>
                    <option value="password">password</option>
                    <option value="phishing">phishing</option>
                    <option value="privacy">privacy</option>
                  </select>
                </label>
                <label className="field">
                  <span>Статус</span>
                  <select
                    value={testDraft.status}
                    onChange={(event) =>
                      setTestDraft((current) => ({
                        ...current,
                        status: event.target.value as CyberTest['status'],
                      }))
                    }
                  >
                    <option value="playable">playable</option>
                    <option value="draft">draft</option>
                  </select>
                </label>
                <label className="field">
                  <span>Длительность</span>
                  <input
                    value={testDraft.duration}
                    onChange={(event) =>
                      setTestDraft((current) => ({ ...current, duration: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Метрика</span>
                  <input
                    value={testDraft.metric}
                    onChange={(event) =>
                      setTestDraft((current) => ({ ...current, metric: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Цвет</span>
                  <input
                    value={testDraft.accent}
                    onChange={(event) =>
                      setTestDraft((current) => ({ ...current, accent: event.target.value }))
                    }
                  />
                </label>
                <label className="field field--wide">
                  <span>Deck, по строке</span>
                  <textarea
                    value={testDraft.deck.join('\n')}
                    onChange={(event) =>
                      setTestDraft((current) => ({ ...current, deck: splitLines(event.target.value) }))
                    }
                  />
                </label>
                <label className="field field--wide">
                  <span>Benefits, по строке</span>
                  <textarea
                    value={testDraft.benefits.join('\n')}
                    onChange={(event) =>
                      setTestDraft((current) => ({
                        ...current,
                        benefits: splitLines(event.target.value),
                      }))
                    }
                  />
                </label>
                {testDraft.mode === 'quiz' ? (
                  <label className="field field--wide">
                    <span>Вопросы в JSON</span>
                    <textarea
                      value={questionsText}
                      onChange={(event) => setQuestionsText(event.target.value)}
                    />
                  </label>
                ) : null}
              </div>

              <div className="admin-actions">
                <button type="button" className="button button--primary" onClick={() => void saveCurrentTest()}>
                  <Save size={16} />
                  Сохранить тест
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    if (!testSourceSlug) {
                      return
                    }
                    void deleteTest(testSourceSlug)
                    const next = tests.find((item) => item.slug !== testSourceSlug)
                    if (next) {
                      selectTest(next)
                    } else {
                      setTestSourceSlug(null)
                      const blank = createEmptyTest()
                      setTestDraft(blank)
                      setQuestionsText(formatQuestions(blank.questions))
                    }
                    setMessage('Тест удалён.')
                  }}
                >
                  <Trash2 size={16} />
                  Удалить
                </button>
              </div>
            </article>
          </div>
        ) : null}

        {tab === 'materials' ? (
          <div className="admin-layout">
            <aside className="card admin-sidebar">
              <div className="admin-sidebar__header">
                <h3>Материалы</h3>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    const blank = createEmptyMaterial()
                    setMaterialSourceSlug(null)
                    setMaterialDraft(blank)
                  }}
                >
                  Новый
                </button>
              </div>
              <div className="admin-sidebar__list">
                {materials.map((material) => (
                  <button
                    key={material.slug}
                    type="button"
                    className={`admin-item ${materialSourceSlug === material.slug ? 'admin-item--active' : ''}`}
                    onClick={() => selectMaterial(material)}
                  >
                    <strong>{material.title}</strong>
                    <span>
                      {material.category} · {material.level}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <article className="card admin-editor">
              <div className="admin-editor__grid">
                <label className="field">
                  <span>Название</span>
                  <input
                    value={materialDraft.title}
                    onChange={(event) =>
                      setMaterialDraft((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Slug</span>
                  <input
                    value={materialDraft.slug}
                    onChange={(event) =>
                      setMaterialDraft((current) => ({ ...current, slug: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Категория</span>
                  <input
                    value={materialDraft.category}
                    onChange={(event) =>
                      setMaterialDraft((current) => ({ ...current, category: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Уровень</span>
                  <input
                    value={materialDraft.level}
                    onChange={(event) =>
                      setMaterialDraft((current) => ({ ...current, level: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Время чтения</span>
                  <input
                    value={materialDraft.readTime}
                    onChange={(event) =>
                      setMaterialDraft((current) => ({ ...current, readTime: event.target.value }))
                    }
                  />
                </label>
                <label className="field field--wide">
                  <span>Краткое описание</span>
                  <textarea
                    value={materialDraft.summary}
                    onChange={(event) =>
                      setMaterialDraft((current) => ({ ...current, summary: event.target.value }))
                    }
                  />
                </label>
                <label className="field field--wide">
                  <span>Highlights, по строке</span>
                  <textarea
                    value={materialDraft.highlights.join('\n')}
                    onChange={(event) =>
                      setMaterialDraft((current) => ({
                        ...current,
                        highlights: splitLines(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="field field--wide">
                  <span>Тело статьи, абзац на строку</span>
                  <textarea
                    value={materialDraft.body.join('\n')}
                    onChange={(event) =>
                      setMaterialDraft((current) => ({ ...current, body: splitLines(event.target.value) }))
                    }
                  />
                </label>
              </div>

              <div className="admin-actions">
                <button type="button" className="button button--primary" onClick={() => void saveCurrentMaterial()}>
                  <Save size={16} />
                  Сохранить материал
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    if (!materialSourceSlug) {
                      return
                    }
                    void deleteMaterial(materialSourceSlug)
                    const next = materials.find((item) => item.slug !== materialSourceSlug)
                    if (next) {
                      selectMaterial(next)
                    } else {
                      setMaterialSourceSlug(null)
                      setMaterialDraft(createEmptyMaterial())
                    }
                    setMessage('Материал удалён.')
                  }}
                >
                  <Trash2 size={16} />
                  Удалить
                </button>
              </div>
            </article>
          </div>
        ) : null}

        {tab === 'import' ? (
          <div className="admin-layout admin-layout--single">
            <article className="card admin-editor">
              <div className="admin-actions">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => downloadText('cyber-arena-content.json', exportText)}
                >
                  <Download size={16} />
                  Скачать JSON
                </button>
                <button type="button" className="button button--ghost" onClick={() => setImportText(exportText)}>
                  <FileJson size={16} />
                  Показать текущий JSON
                </button>
                <button type="button" className="button button--ghost" onClick={() => void importBundle()}>
                  <Upload size={16} />
                  Импортировать JSON
                </button>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() => {
                    void resetContent()
                    if (seedTests[0]) {
                      selectTest(seedTests[0])
                    }
                    if (seedMaterials[0]) {
                      selectMaterial(seedMaterials[0])
                    }
                    setMessage('Контент сброшен к базовому набору.')
                  }}
                >
                  <RotateCcw size={16} />
                  Сбросить базовый набор
                </button>
              </div>
              <label className="field field--wide">
                <span>JSON-пакет контента</span>
                <textarea value={importText} onChange={(event) => setImportText(event.target.value)} />
              </label>
            </article>
          </div>
        ) : null}
      </section>
    </div>
  )
}
