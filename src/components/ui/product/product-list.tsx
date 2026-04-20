import { splitProps, type JSX, For, createMemo } from "solid-js"
import { useContext, Show } from "solid-js"
import { Collection, CollectionView, CollectionEmpty, CollectionContent, useCollectionData, type CollectionViewProps } from "../collection"
import { useQueryState } from "../query"
import { useCategoryOptional } from "./../category/category-context"
import { productsApi, type ProductFilters } from "~/lib/api/products"
import { categoriesApi } from "~/lib/api/categories"
import { useStoreId } from "~/lib/store-context"
import type { Product, PagedResponse } from "~/lib/types"
import { ProductPaginationContext, ProductPaginationProvider } from "./product-pagination-context"

type ProductListProps = {
  storeId?: string
  categoryId?: string
  filters?: ProductFilters
  searchQuery?: string
  pageSize?: number
  queryKey?: unknown[]
  enabled?: boolean
  errorFallback?: JSX.Element
  loadingFallback?: JSX.Element
  children?: JSX.Element
}

const ProductListInner = (props: ProductListProps) => {
  const [local] = splitProps(props, [
    "storeId",
    "categoryId",
    "filters",
    "searchQuery",
    "pageSize",
    "queryKey",
    "enabled",
    "errorFallback",
    "loadingFallback",
    "children",
  ])
  const category = useCategoryOptional()
  const contextStoreId = useStoreId()
  const paginationCtx = useContext(ProductPaginationContext)
  const categoryId = createMemo(() => category?.id())
  const resolvedStoreId = createMemo(() => local.storeId ?? contextStoreId())
  /* TODO: get search and filters from filter and search providers */
  const searchQuery = () => ""
  const filters = () => []

  const queryFn = async (): Promise<Product[] | null> => {
    const storeId = resolvedStoreId()
    if (!storeId) return null

    const apiPage = paginationCtx ? paginationCtx.page() - 1 : 0
    const apiPageSize = 40//paginationCtx ? paginationCtx.pageSize() : (local.pageSize ?? 20)

    let response: PagedResponse<Product> | null = null

    if (searchQuery()) {
      response = await productsApi.search(storeId, searchQuery(), apiPage, apiPageSize, filters())
    } else if (categoryId()) {
      response = await categoriesApi.getCategoryProducts(storeId, categoryId(), apiPage, apiPageSize)
    } else {
      response = await productsApi.getAll(storeId, apiPage, apiPageSize, filters())
    }

    if (paginationCtx && response) {
      paginationCtx.syncTotals(response)
    }

    return response?.content ?? null
  }

  /* FIXME: Instead of random key use stable keys */
  const randomKey = () => crypto.randomUUID()
  const key = local.searchQuery
    ? ["products", "search", resolvedStoreId(), searchQuery(), filters()]
    : local.categoryId
      ? ["products", "category", randomKey(), categoryId()]
      : ["products", "all", randomKey(), filters()]

  return (
    <Collection
      queryFn={queryFn}
      queryKey={local.queryKey ?? key}
      enabled={local.enabled ?? true}
      loadingFallback={local.loadingFallback ?? <DefaultProductListLoading />}
      errorFallback={local.errorFallback}
    >
      {local.children}
    </Collection>
  )
}

const ProductList = (props: ProductListProps) => {
  return (
    <ProductPaginationProvider initialPageSize={props.pageSize}>
      <ProductListInner {...props} />
    </ProductPaginationProvider>
  )
}

const DefaultProductListLoading = () => (
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <For each={[1, 2, 3, 4, 5, 6, 7, 8]}>
      {() => (
        <div class="animate-pulse space-y-3 p-4 border rounded-lg">
          <div class="h-48 bg-muted rounded-md" />
          <div class="h-4 bg-muted rounded w-3/4" />
          <div class="h-4 bg-muted rounded w-1/2" />
        </div>
      )}
    </For>
  </div>
)

type ProductListViewProps = {
  class?: string
  children?: JSX.Element
}

// Passed to ProductList(only shows when list is not null)
const ProductListView = (props: ProductListViewProps) => {
  return (
    <CollectionView class={props.class}>
      {props.children}
    </CollectionView>
  )
}

/* Passsed to ProductList, only shows when product is null */
const ProductListEmptyView = (props: { class?: string; children?: JSX.Element }) => {
  return (
    <CollectionEmpty class={props.class}>
      {props.children ?? <DefaultEmptyMessage />}
    </CollectionEmpty>
  )
}

const DefaultEmptyMessage = () => (
  <div class="flex flex-col items-center justify-center min-h-[30vh] gap-2">
    <span class="text-muted-foreground text-lg">No products found</span>
  </div>
)

const ProductListContent = CollectionContent

export { ProductList, ProductListView, ProductListEmptyView, ProductListContent }
export type { ProductListProps, ProductListViewProps }
