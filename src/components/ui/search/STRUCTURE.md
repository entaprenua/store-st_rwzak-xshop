# Search Components Architecture

## Overview

Zero-code ready search components built on top of Kobalte's Search primitives. Provides a generic `SearchProvider` that can wrap any search function, and `ProductSearch` which is pre-configured for product search.

## Design Principles

1. **Generic Provider** - `SearchProvider` accepts any search function
2. **Kobalte-Aligned** - Uses Kobalte's search primitives for accessibility
3. **Composable** - Full control over UI with primitive components
4. **Debounced** - Built-in debouncing for search queries
5. **No Provider Wrapping** - ProductSearch handles provider internally

## Directory Structure

```
components/ui/
├── search.tsx              # Generic SearchProvider, useSearch, all primitives
└── search/
    └── STRUCTURE.md        # This file
```

## SearchProvider

Generic search context provider that wraps any search function.

```typescript
type SearchFn<T = unknown> = (query: string) => Promise<T[]>

type SearchProviderProps<T = unknown> = {
  searchFn: SearchFn<T>           // Search function to call
  debounceMs?: number             // Debounce delay (default: 300ms)
  minQueryLength?: number         // Minimum query length (default: 2)
  children?: JSX.Element
}
```

### useSearch Hook

```typescript
type SearchContextValue<T = unknown> = {
  query: Accessor<string>         // Current search query
  results: Accessor<T[]>          // Search results
  isLoading: Accessor<boolean>   // Loading state
  setQuery: (query: string) => void
  clear: () => void
}

const searchCtx = useSearch<ProductType>()
```

### Usage

```tsx
<SearchProvider<ProductType> searchFn={async (q) => {
  const res = await api.search(q)
  return res.content
}}>
  <Search<ProductType>
    options={searchCtx.results()}
    onInputChange={searchCtx.setQuery}
    optionValue="id"
    optionLabel="name"
  >
    <SearchControl>
      <SearchInput placeholder="Search..." />
      <SearchIndicator>🔍</SearchIndicator>
    </SearchControl>
    <SearchContent>
      <SearchListbox>
        <SearchItem>Result 1</SearchItem>
        <SearchItem>Result 2</SearchItem>
      </SearchListbox>
    </SearchContent>
  </Search>
</SearchProvider>
```

## Kobalte Primitives

All Kobalte search primitives are re-exported:

| Component | Description |
|-----------|-------------|
| `Search` | Root search component |
| `SearchControl` | Wraps input and indicators |
| `SearchInput` | Styled input element |
| `SearchLabel` | Accessible label |
| `SearchDescription` | Help text |
| `SearchIcon` | Icon wrapper |
| `SearchIndicator` | Loading/clear indicators |
| `SearchContent` | Dropdown content (with Portal) |
| `SearchListbox` | Results list container |
| `SearchItem` | Individual result |
| `SearchItemLabel` | Item text label |
| `SearchItemDescription` | Item description |
| `SearchSection` | Section header |
| `SearchNoResult` | Empty state |
| `SearchArrow` | Navigation arrow |
| `SearchPortal` | Portal wrapper |

## Custom Components

### SearchItem

Extends Kobalte's SearchItem with context support:

```tsx
<SearchItem item={product}>
  {(item) => (
    <div class="flex items-center gap-2">
      <ProductImage src={item.image} />
      <span>{item.name}</span>
    </div>
  )}
</SearchItem>
```

### SearchContent

Pre-styled dropdown content with Portal:

```tsx
<SearchContent class="w-96">
  <SearchListbox>
    <SearchItem>Result</SearchItem>
  </SearchListbox>
</SearchContent>
```

### SearchInput

Pre-styled input with focus ring:

```tsx
<SearchInput placeholder="Search..." class="w-full" />
```

## ProductSearch

For product search, use the pre-configured `ProductSearch` component:

```tsx
import { ProductSearch } from "./product/product-search"

<ProductSearch placeholder="Search products..." />
```

ProductSearch uses `SearchProvider` internally with `productsApi.search`. No wrapper needed.

## Props Reference

### SearchProvider

```typescript
SearchProviderProps<T> {
  searchFn: (query: string) => Promise<T[]>
  debounceMs?: number       // Default: 300
  minQueryLength?: number   // Default: 2
  children?: JSX.Element
}
```

### SearchItem

```typescript
SearchItemProps {
  class?: string
  item?: unknown
  children?: JSX.Element | ((item: unknown) => JSX.Element)
}
```

### SearchInput

```typescript
SearchInputProps {
  class?: string
  placeholder?: string
  // ... Kobalte SearchInput props
}
```

### SearchContent

```typescript
SearchContentProps {
  class?: string
  // ... Kobalte SearchContent props
}
```

## Best Practices

1. **Use ProductSearch for products** - No config needed
2. **Use SearchProvider for custom searches** - Pass your own searchFn
3. **Customize via children** - Override any component inside
4. **Use debounce for API calls** - Prevents excessive requests

## TypeScript

All components are fully typed:

```tsx
<SearchProvider<MyType> searchFn={mySearchFn}>
  <Search<MyType>
    options={searchCtx.results()}
    optionValue="id"
    optionLabel="name"
  >
    {/* ... */}
  </Search>
</SearchProvider>
```
