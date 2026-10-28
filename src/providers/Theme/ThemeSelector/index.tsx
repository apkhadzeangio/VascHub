'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import React, { useSyncExternalStore } from 'react'

import type { Theme } from './types'

import { useTheme } from '..'
import { themeLocalStorageKey } from './types'

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  const value = useSyncExternalStore(subscribe, getSnapshot, () => 'auto')

  const onThemeChange = (themeToSet: Theme & 'auto') => {
    if (themeToSet === 'auto') {
      setTheme(null)
      window.dispatchEvent(new Event('vaschub-theme'))
    } else {
      setTheme(themeToSet)
      window.dispatchEvent(new Event('vaschub-theme'))
    }
  }

  return (
    <Select onValueChange={onThemeChange} value={value}>
      <SelectTrigger
        aria-label="Select a theme"
        className="w-auto bg-transparent gap-2 pl-0 md:pl-3 border-none"
      >
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">Auto</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  )
}

function getSnapshot() {
  return window.localStorage.getItem(themeLocalStorageKey) ?? 'auto'
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('vaschub-theme', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('vaschub-theme', callback)
  }
}
