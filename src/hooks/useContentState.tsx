/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useState } from 'react'
import { materials as seedMaterials, tests as seedTests } from '../data/siteData'
import type { ContentBundle, CyberTest, MaterialItem } from '../types'
import { apiGet, apiSend } from '../utils/api'

const defaultBundle: ContentBundle = {
  tests: seedTests,
  materials: seedMaterials,
}

function mergeContentBundle(remote: ContentBundle): ContentBundle {
  return {
    tests: [
      ...seedTests,
      ...remote.tests.filter((test) => !seedTests.some((seedTest) => seedTest.slug === test.slug)),
    ],
    materials: [
      ...seedMaterials,
      ...remote.materials.filter(
        (material) => !seedMaterials.some((seedMaterial) => seedMaterial.slug === material.slug),
      ),
    ],
  }
}

interface ContentContextValue {
  tests: CyberTest[]
  materials: MaterialItem[]
  saveTest: (test: CyberTest, previousSlug?: string) => Promise<void>
  deleteTest: (slug: string) => Promise<void>
  saveMaterial: (material: MaterialItem, previousSlug?: string) => Promise<void>
  deleteMaterial: (slug: string) => Promise<void>
  replaceAllContent: (bundle: ContentBundle) => Promise<void>
  resetContent: () => Promise<void>
}

const ContentContext = createContext<ContentContextValue | null>(null)

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [bundle, setBundle] = useState<ContentBundle>(defaultBundle)

  const refreshBundle = async () => {
    try {
      const next = await apiGet<ContentBundle>('/content/bundle')
      if (next.tests.length || next.materials.length) {
        setBundle(mergeContentBundle(next))
      } else {
        setBundle(defaultBundle)
      }
    } catch {
      setBundle(defaultBundle)
    }
  }

  useEffect(() => {
    void refreshBundle()
  }, [])

  const value: ContentContextValue = {
    tests: bundle.tests,
    materials: bundle.materials,
    saveTest: async (test, previousSlug) => {
      const saved = await apiSend<CyberTest>(
        previousSlug ? `/content/tests/${previousSlug}` : '/content/tests',
        previousSlug ? 'PUT' : 'POST',
        test,
      )

      setBundle((current) => ({
        ...current,
        tests: [saved, ...current.tests.filter((item) => item.slug !== (previousSlug ?? test.slug))],
      }))
    },
    deleteTest: async (slug) => {
      await apiSend<void>(`/content/tests/${slug}`, 'DELETE')
      setBundle((current) => ({
        ...current,
        tests: current.tests.filter((item) => item.slug !== slug),
      }))
    },
    saveMaterial: async (material, previousSlug) => {
      const saved = await apiSend<MaterialItem>(
        previousSlug ? `/content/materials/${previousSlug}` : '/content/materials',
        previousSlug ? 'PUT' : 'POST',
        material,
      )

      setBundle((current) => ({
        ...current,
        materials: [
          saved,
          ...current.materials.filter((item) => item.slug !== (previousSlug ?? material.slug)),
        ],
      }))
    },
    deleteMaterial: async (slug) => {
      await apiSend<void>(`/content/materials/${slug}`, 'DELETE')
      setBundle((current) => ({
        ...current,
        materials: current.materials.filter((item) => item.slug !== slug),
      }))
    },
    replaceAllContent: async (nextBundle) => {
      const saved = await apiSend<ContentBundle>('/content/bundle', 'PUT', nextBundle)
      setBundle(mergeContentBundle(saved))
    },
    resetContent: async () => {
      const saved = await apiSend<ContentBundle>('/content/bundle', 'PUT', defaultBundle)
      setBundle(saved)
    },
  }

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContentState() {
  const context = useContext(ContentContext)

  if (!context) {
    throw new Error('useContentState must be used inside ContentProvider')
  }

  return context
}
