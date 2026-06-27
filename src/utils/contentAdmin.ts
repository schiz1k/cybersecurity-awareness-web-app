import type { ContentBundle, CyberTest, MaterialItem } from '../types'

export function slugifyValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function createEmptyTest(): CyberTest {
  return {
    slug: `new-test-${Date.now()}`,
    title: 'Новый тест',
    headline: 'Краткий подзаголовок для карточки теста.',
    tag: 'New',
    category: 'Новая категория',
    description: 'Описание теста для каталога и карточки.',
    difficulty: 'База',
    duration: '5 минут',
    metric: 'настраиваемая метрика',
    accent: '#3B82F6',
    benefits: ['Преимущество 1', 'Преимущество 2'],
    deck: ['Тег 1', 'Тег 2'],
    mode: 'quiz',
    status: 'draft',
    questions: [
      {
        prompt: 'Новый вопрос',
        options: ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Вариант 4'],
        answer: 0,
        explanation: 'Пояснение к правильному ответу.',
      },
    ],
  }
}

export function createEmptyMaterial(): MaterialItem {
  return {
    slug: `new-material-${Date.now()}`,
    title: 'Новый материал',
    category: 'Новая категория',
    level: 'База',
    readTime: '6 минут',
    summary: 'Краткое описание материала.',
    highlights: ['Акцент 1', 'Акцент 2'],
    body: ['Первый абзац материала.'],
  }
}

export function serializeBundle(bundle: ContentBundle) {
  return JSON.stringify(bundle, null, 2)
}

export function parseBundle(raw: string): ContentBundle {
  const parsed = JSON.parse(raw) as Partial<ContentBundle>

  if (!Array.isArray(parsed.tests) || !Array.isArray(parsed.materials)) {
    throw new Error('JSON должен содержать поля tests и materials.')
  }

  return {
    tests: parsed.tests as CyberTest[],
    materials: parsed.materials as MaterialItem[],
  }
}
