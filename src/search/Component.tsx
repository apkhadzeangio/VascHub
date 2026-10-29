'use client'

import React from 'react'
import { ArrowRight, SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
export function Search({ query = '', id = 'site-search' }: { query?: string; id?: string }) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      aria-label="გამოქვეყნებული სტატიების ძებნა"
      className="vh-search"
      onSubmit={(event) => {
        const field = event.currentTarget.elements.namedItem('q')
        if (field instanceof HTMLInputElement) field.value = field.value.trim()
      }}
    >
      <Label htmlFor={id} className="sr-only">
        მოძებნე გამოქვეყნებული სტატია ან თემა
      </Label>
      <SearchIcon className="vh-search-icon" size={22} aria-hidden="true" />
      <Input
        key={query}
        id={id}
        name="q"
        type="search"
        defaultValue={query}
        maxLength={160}
        enterKeyHint="search"
        aria-describedby={`${id}-hint`}
        placeholder="მოძებნე სტატია ან თემა"
        className="vh-search-input"
      />
      <Button type="submit" size="lg" className="vh-search-submit" aria-label="ძიება">
        <span>ძიება</span>
        <ArrowRight size={20} aria-hidden="true" />
      </Button>
      <span id={`${id}-hint`} className="sr-only">
        ძიება გამოქვეყნებული სტატიების სათაურებში, აღწერებსა და კატეგორიებში.
        ჩაწერე საძიებო სიტყვა და დააჭირე Enter-ს ან ძიების ღილაკს.
      </span>
    </form>
  )
}
