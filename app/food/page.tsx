'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { storage, FoodEntry } from '@/lib/storage'
import type { FoodSearchItem } from '@/lib/foodSearchTypes'
import { caloriesFromMacros } from '@/lib/macroCalories'
import { localDateKey, localDateKeyNow, parseEntryDateMs } from '@/lib/dateHelpers'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function defaultDateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function defaultTimeStr() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildLocalMealIso(dateStr: string, timeStr: string): string {
  const [y, mo, day] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const d = new Date(y, mo - 1, day, hh, mm, 0, 0)
  return d.toISOString()
}

export default function FoodPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<FoodSearchItem[]>([])
  const [searchSource, setSearchSource] = useState<'fatsecret' | 'openfoodfacts' | null>(null)
  const [searching, setSearching] = useState(false)
  const [manualForm, setManualForm] = useState({
    name: '',
    mealDate: defaultDateStr(),
    mealTime: defaultTimeStr(),
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

  const computedCalories = useMemo(() => {
    const p = Number(manualForm.protein) || 0
    const c = Number(manualForm.carbs) || 0
    const f = Number(manualForm.fat) || 0
    if (p + c + f <= 0) return null
    return caloriesFromMacros(p, c, f)
  }, [manualForm.protein, manualForm.carbs, manualForm.fat])

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchSource(null)
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.results ?? [])
      setSearchSource(data.source ?? null)
    } catch {
      setSearchResults([])
      setSearchSource(null)
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 600)
    return () => clearTimeout(t)
  }, [search, doSearch])

  const addFromSearch = (item: FoodSearchItem) => {
    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      servingSize: item.servingSize,
    }
    storage.saveFoodEntry(entry)
    setEntries(storage.getFoodEntries())
    setSearch('')
    setSearchResults([])
    setSearchSource(null)
  }

  const addManual = (e: React.FormEvent) => {
    e.preventDefault()
    const p = Number(manualForm.protein) || 0
    const c = Number(manualForm.carbs) || 0
    const f = Number(manualForm.fat) || 0
    const hasMacros = p + c + f > 0
    const overrideCal = manualForm.calories.trim()
    let calories = 0
    if (hasMacros) {
      calories =
        overrideCal !== '' && Number.isFinite(Number(overrideCal))
          ? Math.round(Number(overrideCal))
          : caloriesFromMacros(p, c, f)
    } else {
      calories = Math.round(Number(manualForm.calories))
    }

    if (!manualForm.name.trim() || !Number.isFinite(calories) || calories <= 0) {
      return
    }

    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      date: buildLocalMealIso(manualForm.mealDate, manualForm.mealTime),
      name: manualForm.name.trim(),
      calories,
      protein: Math.round(p),
      carbs: Math.round(c),
      fat: Math.round(f),
      servingSize: manualForm.servingSize || undefined,
    }
    storage.saveFoodEntry(entry)
    setEntries(storage.getFoodEntries())
    setManualForm({
      name: '',
      mealDate: defaultDateStr(),
      mealTime: defaultTimeStr(),
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      servingSize: '',
    })
  }

  const handleDelete = (id: string) => {
    storage.deleteFoodEntry(id)
    setEntries(storage.getFoodEntries())
  }

  const todayKey = localDateKeyNow()
  const todayEntries = entries
    .filter((e) => localDateKey(parseEntryDateMs(e.date)) === todayKey)
    .sort((a, b) => parseEntryDateMs(b.date) - parseEntryDateMs(a.date))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Food Journal 🥗</h1>
        <p className="text-slate-400 mt-1">
          Manual entry infers calories from protein, carbs, and fat (4 / 4 / 9 kcal per gram) when macros are filled.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'search' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            🔍 Search Foods
          </button>
          <button
            type="button"
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for food (e.g., banana, chicken breast)..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-green-500 mb-3"
            />
            {searching && <p className="text-slate-400 text-sm mb-2">Searching...</p>}
            {searchResults.length > 0 && (
              <div>
                {searchSource && (
                  <p className="text-slate-500 text-xs mb-2">
                    {searchSource === 'fatsecret' ? (
                      <>
                        Results via <span className="text-emerald-400">FatSecret</span>
                      </>
                    ) : (
                      <>
                        Results via <span className="text-amber-400">Open Food Facts</span> (FatSecret
                        unavailable)
                      </>
                    )}
                  </p>
                )}
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {searchResults.map((r) => (
                    <div
                      key={r.id}
                      className="bg-slate-700 rounded-lg p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{r.name}</p>
                        <p className="text-slate-400 text-xs">
                          {r.calories} kcal · {r.servingSize} · P: {r.protein}g · C: {r.carbs}g · F:{' '}
                          {r.fat}g
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addFromSearch(r)}
                        className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
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
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="Food name"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={manualForm.mealDate}
                  onChange={(e) => setManualForm({ ...manualForm, mealDate: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={manualForm.mealTime}
                  onChange={(e) => setManualForm({ ...manualForm, mealTime: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <input
                type="number"
                min="0"
                value={manualForm.protein}
                onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })}
                placeholder="Protein (g)"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                min="0"
                value={manualForm.carbs}
                onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })}
                placeholder="Carbs (g)"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                min="0"
                value={manualForm.fat}
                onChange={(e) => setManualForm({ ...manualForm, fat: e.target.value })}
                placeholder="Fat (g)"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Calories (kcal){' '}
                  {computedCalories != null && (
                    <span className="text-green-400">→ from macros: {computedCalories}</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualForm.calories}
                  onChange={(e) => setManualForm({ ...manualForm, calories: e.target.value })}
                  placeholder={
                    computedCalories != null
                      ? 'Optional override if macros set'
                      : 'Required if macros are all 0'
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={manualForm.servingSize}
                  onChange={(e) => setManualForm({ ...manualForm, servingSize: e.target.value })}
                  placeholder="Serving size (optional)"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <p className="text-slate-500 text-xs">
              If protein, carbs, or fat are entered, saved calories use the macro formula. Otherwise
              enter calories only.
            </p>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Add food entry
            </button>
          </form>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-4">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">
          Today&apos;s log ({todayEntries.length} items)
        </h2>
        {todayEntries.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No food logged for today yet.</p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((e) => (
              <div
                key={e.id}
                className="bg-slate-700 rounded-lg p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-white font-medium">{e.name}</p>
                  <p className="text-slate-400 text-xs">
                    {new Date(e.date).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    · {e.calories} kcal · P:{e.protein}g · C:{e.carbs}g · F:{e.fat}g
                    {e.servingSize && ` · ${e.servingSize}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(e.id)}
                  className="text-slate-500 hover:text-red-400 ml-2 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {entries.length > todayEntries.length && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Previous entries</h2>
          <div className="space-y-2">
            {entries
              .filter((e) => localDateKey(parseEntryDateMs(e.date)) !== todayKey)
              .slice(0, 30)
              .map((e) => (
                <div
                  key={e.id}
                  className="bg-slate-700 rounded-lg p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm">{e.name}</p>
                    <p className="text-slate-400 text-xs">
                      {new Date(e.date).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      · {e.calories} kcal
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    className="text-slate-500 hover:text-red-400 ml-2 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
