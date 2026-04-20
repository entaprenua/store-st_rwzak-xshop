import type { JSX } from "solid-js"
import { Search } from "@kobalte/core/search"
import { SearchProvider, SearchItemProvider, useSearch } from "../search"
import { productsApi } from "~/lib/api/products"
import { useStoreId } from "~/lib/store-context"
import { Product } from "./product-root"
import type { Product as ProductType } from "~/lib/types"


export type ProductSearchProps = {
  placeholder?: string
  class?: string
  itemComponent?: JSX.Element
  children?: JSX.Element
}

export function ProductSearch(props: ProductSearchProps) {
  const storeId = useStoreId()
  
  const searchFn = async (query: string): Promise<ProductType[]> => {
    const id = storeId()
    if (!id) return []
    const response = await productsApi.search(id, query, 0, 10)
    return response.content
  }
  
  return (
    <SearchProvider<ProductType> searchFn={searchFn}>
      <ProductSearchInner {...props} />
    </SearchProvider>
  )
}

function ProductSearchInner(props: ProductSearchProps) {
  const searchCtx = useSearch<ProductType>()
  
  return (
    <Search<ProductType>
      options={searchCtx.results()}
      onInputChange={searchCtx.setQuery}
      optionValue="id"
      optionLabel="name"
      itemComponent={(itemProps) => (
        <SearchItemProvider item={itemProps.item}>
          {props.itemComponent}
        </SearchItemProvider>
      )}
    >
      {props.children}
    </Search>
  )
}
