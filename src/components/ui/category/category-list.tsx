import { splitProps, createEffect, createResource, type JSX, Match, Switch, createMemo, createContext, useContext, type Accessor, mergeProps, Show } from "solid-js"
import { Collection, CollectionEmpty, CollectionView, CollectionContent, useCollectionItem, useCollectionData } from "../collection"
import { useCategory } from "./category-context"
import { categoriesApi } from "~/lib/api/categories"
import { useStoreId } from "~/lib/store-context"
import type { Category } from "~/lib/types"

const ModeContext = createContext()
const useMode = () => useContext(ModeContext)
const ModeProvider = (props: { value: string, children?: JSX.Element }) => {
  return (
    <ModeContext.Provider value={() => props.value}>
      {props.children}
    </ModeContext.Provider>
  )
}

type CategoryListProps = {
  mode?: string
  queryKey?: unknown[]
  enabled?: boolean
  errorFallback?: JSX.Element
  loadingFallback?: JSX.Element
  children?: JSX.Element
}

const CategoryList = (rawProps: CategoryListProps) => {

  const props = mergeProps({
    mode: "tree",
  }, rawProps)
  const [local] = splitProps(props, [
    "mode",
    "queryKey",
    "enabled",
    "errorFallback",
    "loadingFallback",
    "children",
  ])

  const isRootMode = () => local.mode === "root"
  const isTreeMode = () => local.mode === "tree"
  const contextStoreId = useStoreId()
  const resolvedStoreId = createMemo(() => contextStoreId())

  const queryFn = async (): Promise<Category[] | null> => {
    const storeId = resolvedStoreId()
    if (!storeId) return null
    let data: any = undefined
    if (isRootMode()) {
      data = await (categoriesApi.getRoot(storeId))
    }
    else if (isTreeMode()) {
      data = await (categoriesApi.getTree(storeId))
    }
    return data?.content ?? []
  }
  const queryKeys = () => {
    const storeId = resolvedStoreId()
    if (isRootMode()) return ["categories", "list", storeId]
    else if (isTreeMode()) return ["categories", "tree", storeId]
  }

  return (
    <Collection
      queryFn={queryFn}
      queryKey={queryKeys()}
      enabled={local.enabled ?? true}
      loadingFallback={local.loadingFallback ?? <DefaultCategoryListLoading />}
      errorFallback={local.errorFallback}
    >
      <ModeProvider value={local.mode}>
        {local.children}
      </ModeProvider>
    </Collection>
  )
}

type CategoryListViewProps = {
  class?: string
  children?: JSX.Element
}

const CategoryListView = (props: CategoryListViewProps) => {
  return (
    <CollectionView class={props.class}>
      {props.children}
    </CollectionView>
  )
}

type CategorySubcategoriesProps = {
  storeId?: string
  page?: number
  pageSize?: number
  queryKey?: unknown[]
  enabled?: boolean
  errorFallback?: JSX.Element
  loadingFallback?: JSX.Element
  class?: string
  children?: JSX.Element
}

const CategorySubcategories = (props: CategorySubcategoriesProps) => {
  const [local] = splitProps(props, [
    "page",
    "pageSize",
    "queryKey",
    "enabled",
    "errorFallback",
    "loadingFallback",
    "class",
    "children",
  ])
  const parentCategory = useCategory()
  const mode = useMode()
  const parentCategoryId = createMemo(() => parentCategory.id())
  if (!parentCategoryId()) return null

  const contextStoreId = useStoreId()
  const resolvedStoreId = createMemo(() => contextStoreId())


  const queryFn = async (): Promise<Category[] | null> => {
    const storeId = resolvedStoreId()
    if (!storeId || !parentCategoryId()) return []
    const response = await categoriesApi.getByParent(storeId, parentCategoryId(), local.page ?? 0, local.pageSize ?? 20)
    return response.content
  }

  const subcategories = createMemo(() => {
    return parentCategory?.data()?.subcategories ?? null
  })

  const hasSubcategories = () => {
    const subs = subcategories()
    return subs && subs.length > 0
  }
  const forRootMode = () => mode?.() === "root"
  const forTreeMode = () => mode?.() === "tree"

  return (
    <Switch>
      <Match when={forRootMode() || subcategories() == null}>
        <Collection
          queryFn={queryFn}
          queryKey={["categories", "subcategories", resolvedStoreId(), parentCategoryId()]}
        >
          {local.children}
        </Collection>
      </Match>
      <Match when={hasSubcategories()/*Includes tree mode */}>
        <Collection
          data={subcategories()}
        >
          {local.children}
        </Collection>
      </Match>
    </Switch>
  )
}
/* Passsed to ProductList, only shows when product is null */
const CategoryListEmptyView = (props: { class?: string; children?: JSX.Element }) => {
  return (
    <CollectionEmpty class={props.class}>
      {props.children ?? <DefaultEmptyMessage />}
    </CollectionEmpty>
  )
}

const DefaultEmptyMessage = () => (
  <div class="flex flex-col items-center justify-center min-h-[30vh] gap-2">
    <span class="text-muted-foreground text-lg">No categories found</span>
  </div>
)

const DefaultCategoryListLoading = (props: { class?: string }) => (
  <div class={props.class ?? "flex flex-col gap-2 p-2"}>
    <div class="animate-pulse h-12 bg-muted rounded" />
    <div class="animate-pulse h-12 bg-muted rounded" />
  </div>
)

const CategoryListContent = CollectionContent

export { CategoryList, CategoryListView, CategoryListEmptyView, CategorySubcategories, CategoryListContent, DefaultCategoryListLoading }
export type { CategoryListProps, CategoryListViewProps, CategorySubcategoriesProps }
