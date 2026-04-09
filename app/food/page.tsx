'use client'
import { useState, useEffect, useCallback } from 'react'
import { storage, FoodEntry } from '@/lib/storage'

interface OpenFoodResult {
  product_name: string
  nutriments: {
    'energy-kcal_100g'?: number
    'energy-kcal_serving'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
  }
  serving_size?: string
}

export default function FoodPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<OpenFoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [manualForm, setManualForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingSize: '',
  })
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search')

  useEffect(() => {
    setEntries(storage.getFoodEntries())
  }, [])

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`
      )
      const data = await res.json()
      setSearchResults((data.products || []).filter((p: OpenFoodResult) => p.product_name))
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 600)
    return () => clearTimeout(t)
  }, [search, doSearch])

  const addFromSearch = (product: OpenFoodResult) => {
    const n = product.nutriments
    const cal = n['energy-kcal_100g'] ?? n['energy-kcal_serving'] ?? 0
    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      name: product.product_name,
      calories: Math.round(cal),
      protein: Math.round(n.proteins_100g ?? 0),
      carbs: Math.round(n.carbohydrates_100g ?? 0),
      fat: Math.round(n.fat_100g ?? 0),
      servingSize: product.serving_size,
    }
    storage.saveFoodEntry(entry)
    setEntries(storage.getFoodEntries())
    setSearch('')
    setSearchResults([])
  }

  const addManual = (e: React.FormEvent) => {
    e.preventDefault()
    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      name: manualForm.name,
      calories: Number(manualForm.calories),
      protein: Number(manualForm.protein),
      carbs: Number(manualForm.carbs),
      fat: Number(manualForm.fat),
      servingSize: manualForm.servingSize || undefined,
    }
    storage.saveFoodEntry(entry)
    setEntries(storage.getFoodEntries())
    setManualForm({ name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '' })
  }

  const handleDelete = (id: string) => {
    storage.deleteFoodEntry(id)
    setEntries(storage.getFoodEntries())
  }

  const today = new Date().toISOString().split('T')[0]
  const todayEntries = entries.filter(e => e.date.startsWith(today))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Food Journal 🥗</h1>
        <p className="text-slate-400 mt-1">Track your nutrition</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'search' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            🔍 Search Foods
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'manual' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            ✏️ Manual Entry
          </button>
        </div>

        {activeTab === 'search' ? (
          <div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for food (e.g., banana, chicken breast)..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-green-500 mb-3"
            />
            {searching && <p className="text-slate-400 text-sm mb-2">Searching...</p>}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <div key={i} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{r.product_name}</p>
                      <p className="text-slate-400 text-xs">
                        {Math.round(r.nutriments['energy-kcal_100g'] ?? r.nutriments['energy-kcal_serving'] ?? 0)} kcal
                        {r.serving_size ? ` | ${r.serving_size}` : ' per 100g'}
                        {' '}· P: {Math.round(r.nutriments.proteins_100g ?? 0)}g
                        · C: {Math.round(r.nutriments.carbohydrates_100g ?? 0)}g
                        · F: {Math.round(r.nutriments.fat_100g ?? 0)}g
                      </p>
                    </div>
                    <button
                      onClick={() => addFromSearch(r)}
                      className="ml-3 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={addManual} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="Food name"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <input
                type="number"
                required
                min="0"
                value={manualForm.calories}
                onChange={e => setManualForm({ ...manualForm, calories: e.target.value })}
                placeholder="Calories (kcal)"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                min="0"
                value={manualForm.protein}
                onChange={e => setManualForm({ ...manualForm, protein: e.target.value })}
                placeholder="Protein (g)"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                min="0"
                value={manualForm.carbs}
                onChange={e => setManualForm({ ...manualForm, carbs: e.target.value })}
                placeholder="Carbs (g)"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                min="0"
                value={manualForm.fat}
                onChange={e => setManualForm({ ...manualForm, fat: e.target.value })}
                placeholder="Fat (g)"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={manualForm.servingSize}
                  onChange={e => setManualForm({ ...manualForm, servingSize: e.target.value })}
                  placeholder="Serving size (optional)"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Add Food Entry
            </button>
          </form>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-4">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">
          Today&apos;s Log ({todayEntries.length} items)
        </h2>
        {todayEntries.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No food logged today yet.</p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map(e => (
              <div key={e.id} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{e.name}</p>
                  <p className="text-slate-400 text-xs">
                    {e.calories} kcal · P:{e.protein}g · C:{e.carbs}g · F:{e.fat}g
                    {e.servingSize && ` · ${e.servingSize}`}
                  </p>
                </div>
                <button onClick={() => handleDelete(e.id)} className="text-slate-500 hover:text-red-400 ml-2">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {entries.length > todayEntries.length && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Previous Entries</h2>
          <div className="space-y-2">
            {entries.filter(e => !e.date.startsWith(today)).slice(0, 20).map(e => (
              <div key={e.id} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{e.name}</p>
                  <p className="text-slate-400 text-xs">
                    {new Date(e.date).toLocaleDateString()} · {e.calories} kcal
                  </p>
                </div>
                <button onClick={() => handleDelete(e.id)} className="text-slate-500 hover:text-red-400 ml-2">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
