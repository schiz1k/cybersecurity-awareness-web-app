import type { PoolClient } from 'pg'
import { pool } from '../../db/pool'
import { materials as seedMaterials, tests as seedTests } from '../../../../src/data/siteData'
import type { ContentBundle, CyberTest, MaterialItem, QuizQuestion } from '../../../../src/types'

function difficultyToDb(value: CyberTest['difficulty']) {
  if (value === 'База') return 'base'
  if (value === 'Средний') return 'medium'
  return 'advanced'
}

function difficultyFromDb(value: string): CyberTest['difficulty'] {
  if (value === 'base') return 'База'
  if (value === 'medium') return 'Средний'
  return 'Продвинутый'
}

function levelToDb(value: string) {
  if (value === 'База') return 'base'
  if (value === 'Средний') return 'medium'
  return 'advanced'
}

function levelFromDb(value: string) {
  if (value === 'base') return 'База'
  if (value === 'medium') return 'Средний'
  return 'Продвинутый'
}

function statusToDb(value: CyberTest['status']) {
  return value === 'playable' ? 'playable' : 'draft'
}

function statusFromDb(value: string): CyberTest['status'] {
  return value === 'playable' ? 'playable' : 'draft'
}

function minutesFromLabel(value: string) {
  const match = value.match(/\d+/)
  return Number(match?.[0] ?? 5)
}

function deckValues(items: Array<{ value: string }>) {
  return items.map((item) => item.value)
}

function mapQuestions(items: Array<{ prompt: string; explanation: string; options: Array<{ label: string; is_correct: boolean }> }>): QuizQuestion[] {
  return items.map((item) => ({
    prompt: item.prompt,
    options: item.options.map((option) => option.label),
    answer: Math.max(
      0,
      item.options.findIndex((option) => option.is_correct),
    ),
    explanation: item.explanation ?? '',
  }))
}

function mapTestRow(row: Record<string, unknown>): CyberTest {
  return {
    slug: String(row.slug),
    title: String(row.title),
    headline: String(row.headline),
    tag: String(row.tag),
    category: String(row.category),
    description: String(row.description),
    difficulty: difficultyFromDb(String(row.difficulty)),
    duration: String(row.duration_label),
    metric: String(row.metric_label),
    accent: String(row.accent_color),
    benefits: deckValues((row.benefits as Array<{ value: string }>) ?? []),
    deck: deckValues((row.deck as Array<{ value: string }>) ?? []),
    mode: row.mode as CyberTest['mode'],
    status: statusFromDb(String(row.status)),
    questions: mapQuestions(
      ((row.questions as Array<{ prompt: string; explanation: string; options: Array<{ label: string; is_correct: boolean }> }>) ?? [])
        .map((question) => ({
          ...question,
          options: [...question.options].sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0)),
        })),
    ),
  }
}

function mapMaterialRow(row: Record<string, unknown>): MaterialItem {
  return {
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category),
    level: levelFromDb(String(row.level)),
    readTime: String(row.read_time_label),
    summary: String(row.summary),
    highlights: deckValues((row.highlights as Array<{ value: string }>) ?? []),
    body: ((row.sections as Array<{ body_markdown: string }>) ?? []).map((item) => item.body_markdown),
  }
}

async function insertTest(client: PoolClient, test: CyberTest) {
  const testResult = await client.query(
    `
      insert into tests (
        slug,
        title,
        headline,
        tag,
        category,
        description,
        difficulty,
        duration_minutes,
        duration_label,
        metric_label,
        accent_color,
        mode,
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      returning id
    `,
    [
      test.slug,
      test.title,
      test.headline,
      test.tag,
      test.category,
      test.description,
      difficultyToDb(test.difficulty),
      minutesFromLabel(test.duration),
      test.duration,
      test.metric,
      test.accent,
      test.mode,
      statusToDb(test.status),
    ],
  )

  const testId = testResult.rows[0].id as string

  for (const [index, item] of test.deck.entries()) {
    await client.query(
      'insert into test_deck_items (test_id, sort_order, value) values ($1, $2, $3)',
      [testId, index, item],
    )
  }

  for (const [index, item] of test.benefits.entries()) {
    await client.query(
      'insert into test_benefits (test_id, sort_order, value) values ($1, $2, $3)',
      [testId, index, item],
    )
  }

  for (const [questionIndex, question] of (test.questions ?? []).entries()) {
    const questionResult = await client.query(
      `
        insert into test_questions (test_id, prompt, explanation, sort_order)
        values ($1, $2, $3, $4)
        returning id
      `,
      [testId, question.prompt, question.explanation, questionIndex],
    )

    const questionId = questionResult.rows[0].id as string

    for (const [optionIndex, option] of question.options.entries()) {
      await client.query(
        `
          insert into test_question_options (question_id, label, is_correct, sort_order)
          values ($1, $2, $3, $4)
        `,
        [questionId, option, optionIndex === question.answer, optionIndex],
      )
    }
  }

  return testId
}

async function insertMaterial(client: PoolClient, material: MaterialItem) {
  const materialResult = await client.query(
    `
      insert into materials (
        slug,
        title,
        category,
        level,
        read_time_minutes,
        read_time_label,
        summary,
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7, 'playable')
      returning id
    `,
    [
      material.slug,
      material.title,
      material.category,
      levelToDb(material.level),
      minutesFromLabel(material.readTime),
      material.readTime,
      material.summary,
    ],
  )

  const materialId = materialResult.rows[0].id as string

  for (const [index, item] of material.highlights.entries()) {
    await client.query(
      'insert into material_highlights (material_id, sort_order, value) values ($1, $2, $3)',
      [materialId, index, item],
    )
  }

  for (const [index, item] of material.body.entries()) {
    await client.query(
      'insert into material_sections (material_id, sort_order, title, body_markdown) values ($1, $2, $3, $4)',
      [materialId, index, null, item],
    )
  }

  return materialId
}

export async function ensureMaterialIdBySlug(slug: string) {
  const existing = await pool.query('select id from materials where slug = $1 limit 1', [slug])

  if (existing.rows[0]) {
    return existing.rows[0].id as string
  }

  const seedMaterial = seedMaterials.find((material) => material.slug === slug)

  if (!seedMaterial) {
    throw new Error('Материал не найден.')
  }

  const client = await pool.connect()
  try {
    await client.query('begin')
    const materialId = await insertMaterial(client, seedMaterial)
    await client.query('commit')
    return materialId
  } catch (error) {
    await client.query('rollback')
    const raced = await pool.query('select id from materials where slug = $1 limit 1', [slug])
    if (raced.rows[0]) {
      return raced.rows[0].id as string
    }
    throw error
  } finally {
    client.release()
  }
}

export async function ensureTestIdBySlug(slug: string) {
  const existing = await pool.query('select id from tests where slug = $1 limit 1', [slug])

  if (existing.rows[0]) {
    return existing.rows[0].id as string
  }

  const seedTest = seedTests.find((test) => test.slug === slug)

  if (!seedTest || !['reflex', 'sequence', 'priority', 'quiz'].includes(seedTest.mode)) {
    throw new Error('Тест не найден.')
  }

  const client = await pool.connect()
  try {
    await client.query('begin')
    const testId = await insertTest(client, seedTest)
    await client.query('commit')
    return testId
  } catch (error) {
    await client.query('rollback')
    const raced = await pool.query('select id from tests where slug = $1 limit 1', [slug])
    if (raced.rows[0]) {
      return raced.rows[0].id as string
    }
    throw error
  } finally {
    client.release()
  }
}

export async function listTests() {
  const result = await pool.query(
    `
      select
        t.*,
        coalesce(
          (
            select json_agg(json_build_object('sort_order', sort_order, 'value', value) order by sort_order)
            from test_deck_items
            where test_id = t.id
          ),
          '[]'::json
        ) as deck,
        coalesce(
          (
            select json_agg(json_build_object('sort_order', sort_order, 'value', value) order by sort_order)
            from test_benefits
            where test_id = t.id
          ),
          '[]'::json
        ) as benefits,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'prompt', q.prompt,
                'explanation', q.explanation,
                'sort_order', q.sort_order,
                'options',
                coalesce(
                  (
                    select json_agg(
                      json_build_object(
                        'label', o.label,
                        'is_correct', o.is_correct,
                        'sort_order', o.sort_order
                      )
                      order by o.sort_order
                    )
                    from test_question_options o
                    where o.question_id = q.id
                  ),
                  '[]'::json
                )
              )
              order by q.sort_order
            )
            from test_questions q
            where q.test_id = t.id
          ),
          '[]'::json
        ) as questions
      from tests t
      order by t.created_at desc
    `,
  )

  return result.rows.map((row) => mapTestRow(row))
}

export async function getTestBySlug(slug: string) {
  const result = await pool.query(
    `
      select
        t.*,
        coalesce(
          (
            select json_agg(json_build_object('sort_order', sort_order, 'value', value) order by sort_order)
            from test_deck_items
            where test_id = t.id
          ),
          '[]'::json
        ) as deck,
        coalesce(
          (
            select json_agg(json_build_object('sort_order', sort_order, 'value', value) order by sort_order)
            from test_benefits
            where test_id = t.id
          ),
          '[]'::json
        ) as benefits,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'prompt', q.prompt,
                'explanation', q.explanation,
                'sort_order', q.sort_order,
                'options',
                coalesce(
                  (
                    select json_agg(
                      json_build_object(
                        'label', o.label,
                        'is_correct', o.is_correct,
                        'sort_order', o.sort_order
                      )
                      order by o.sort_order
                    )
                    from test_question_options o
                    where o.question_id = q.id
                  ),
                  '[]'::json
                )
              )
              order by q.sort_order
            )
            from test_questions q
            where q.test_id = t.id
          ),
          '[]'::json
        ) as questions
      from tests t
      where t.slug = $1
      limit 1
    `,
    [slug],
  )

  return result.rows[0] ? mapTestRow(result.rows[0]) : null
}

export async function listMaterials() {
  const result = await pool.query(
    `
      select
        m.*,
        coalesce(
          (
            select json_agg(json_build_object('sort_order', h.sort_order, 'value', h.value) order by h.sort_order)
            from material_highlights h
            where h.material_id = m.id
          ),
          '[]'::json
        ) as highlights,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'sort_order', s.sort_order,
                'title', s.title,
                'body_markdown', s.body_markdown
              )
              order by s.sort_order
            )
            from material_sections s
            where s.material_id = m.id
          ),
          '[]'::json
        ) as sections
      from materials m
      order by m.created_at desc
    `,
  )

  return result.rows.map((row) => mapMaterialRow(row))
}

export async function getMaterialBySlug(slug: string) {
  const result = await pool.query(
    `
      select
        m.*,
        coalesce(
          (
            select json_agg(json_build_object('sort_order', h.sort_order, 'value', h.value) order by h.sort_order)
            from material_highlights h
            where h.material_id = m.id
          ),
          '[]'::json
        ) as highlights,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'sort_order', s.sort_order,
                'title', s.title,
                'body_markdown', s.body_markdown
              )
              order by s.sort_order
            )
            from material_sections s
            where s.material_id = m.id
          ),
          '[]'::json
        ) as sections
      from materials m
      where m.slug = $1
      limit 1
    `,
    [slug],
  )

  return result.rows[0] ? mapMaterialRow(result.rows[0]) : null
}

export async function createTest(test: CyberTest) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await insertTest(client, test)
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }

  return getTestBySlug(test.slug)
}

export async function updateTest(previousSlug: string, test: CyberTest) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const existing = await client.query('select id from tests where slug = $1 limit 1', [previousSlug])

    if (!existing.rows[0]) {
      throw new Error('Тест для обновления не найден.')
    }

    const testId = existing.rows[0].id as string
    await client.query('delete from tests where id = $1', [testId])
    await insertTest(client, test)
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }

  return getTestBySlug(test.slug)
}

export async function deleteTest(slug: string) {
  await pool.query('delete from tests where slug = $1', [slug])
}

export async function createMaterial(material: MaterialItem) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await insertMaterial(client, material)
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }

  return getMaterialBySlug(material.slug)
}

export async function updateMaterial(previousSlug: string, material: MaterialItem) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const existing = await client.query('select id from materials where slug = $1 limit 1', [previousSlug])

    if (!existing.rows[0]) {
      throw new Error('Материал для обновления не найден.')
    }

    const materialId = existing.rows[0].id as string
    await client.query('delete from materials where id = $1', [materialId])
    await insertMaterial(client, material)
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }

  return getMaterialBySlug(material.slug)
}

export async function deleteMaterial(slug: string) {
  await pool.query('delete from materials where slug = $1', [slug])
}

export async function getContentBundle(): Promise<ContentBundle> {
  const [tests, materials] = await Promise.all([listTests(), listMaterials()])
  return { tests, materials }
}

export async function replaceAllContent(bundle: ContentBundle) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('delete from materials')
    await client.query('delete from tests')

    for (const test of bundle.tests) {
      await insertTest(client, test)
    }

    for (const material of bundle.materials) {
      await insertMaterial(client, material)
    }

    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }

  return getContentBundle()
}
