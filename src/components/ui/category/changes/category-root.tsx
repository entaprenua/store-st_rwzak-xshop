import { Show, splitProps, type JSX, createMemo } from "solid-js"
import { A } from "@solidjs/router"
import { CategoryProvider, ParentCategoryContext, type CategoryProps } from "./category-context"
import { useCollectionItem } from "../collection"

type CategoryRootProps = {
  storeId?: string
  categorySlug?: string
  data?: CategoryProps | null
  class?: string
  children?: JSX.Element
}

const Category = (props: CategoryRootProps) => {
  const [local, others] = splitProps(props, ["storeId", "categorySlug", "data", "class", "children"])

  const collectionItem = useCollectionItem()

  const resolvedData = createMemo(() => {
    if (local.data !== undefined) return local.data
    if (collectionItem) return collectionItem.item as CategoryProps
    return null
  })

  const shouldCreateProvider = () =>
    local.data !== undefined || !!collectionItem

  return (
    <Show
      when={shouldCreateProvider()}
    >
      <CategoryProvider data={resolvedData()}>
        <ParentCategoryContext.Provider value={resolvedData()?.id}>
          <CategoryWrapper class={local.class}>
            {local.children}
          </CategoryWrapper>
        </ParentCategoryContext.Provider>
      </CategoryProvider>
    </Show>
  )
}

type CategoryWrapperProps = {
  href?: string
  class?: string
  children?: JSX.Element
}

const CategoryWrapper = (props: CategoryWrapperProps) => {
  const collectionItem = useCollectionItem()

  const resolvedHref = createMemo(() => {
    if (props.href) return props.href
    const slug = collectionItem?.item?.slug as string | undefined
    if (!slug) return undefined
    return `/${slug}`
  })

  return (
    <Show
      when={resolvedHref()}
      fallback={<div class={props.class}>{props.children}</div>}
    >
      <A href={resolvedHref()!} class={props.class}>
        {props.children}
      </A>
    </Show>
  )
}
const CategoryRootWithFetch = (props: Omit<CategoryRootProps, "data">) => {
  const [local, others] = splitProps(props, [
    "storeId",
    "categorySlug",
    "includeMedia",
    "includeMetadata",
    "queryKey",
    "errorFallback",
    "loadingFallback",
    "href",
    "class",
    "children",
  ])

  const queryFn = async (): Promise<Category | null> => {
    if (local.storeId && local.categorySlug) {
      return categorysApi.getBySlug(
        local.storeId,
        local.categorySlug,
        local.includeMedia ?? false,
        local.includeMetadata ?? false
      )
    }
    return null
  }

  return (
    <Show
      when={local.storeId && local.categorySlug}
      fallback={
        <div class="text-destructive text-sm">
          Category requires either data or storeId + categorySlug
        </div>
      }
    >
      <Query
        queryFn={queryFn}
        queryKey={
          local.queryKey ?? [
            "category",
            local.storeId,
            local.categorySlug,
            local.includeMedia,
            local.includeMetadata,
          ]
        }
      >
        <QueryBoundary
          loadingFallback={
            local.loadingFallback ?? <DefaultCategoryLoading />
          }
          errorFallback={local.errorFallback}
        >
          <CategoryRootContent
            href={local.href}
            class={local.class}
          >
            {local.children}
          </CategoryRootContent>
        </QueryBoundary>
      </Query>
    </Show>
  )
}
const CategoryRootContent = (props: { href?: string; class?: string; children?: JSX.Element }) => {
  const [local, others] = splitProps(props, ["href", "class", "children"])

  const query = useQueryState()

  const categoryData = (): Category | null => {
    return (query?.data as Category) ?? null
  }

  return (
    <Show
      when={categoryData()}
      fallback={
        <div class="text-destructive text-sm">Failed to load category</div>
      }
    >
      <CategoryProvider data={categoryData() as CategoryContextData}>
        <CategoryWrapper href={local.href} class={local.class}>
          {local.children}
        </CategoryWrapper>
      </CategoryProvider>
    </Show>
  )
}

const DefaultCategoryLoading = () => (
  <div class="animate-pulse space-y-3 p-4">
    <div class="h-48 bg-muted rounded-md" />
    <div class="h-4 bg-muted rounded w-3/4" />
    <div class="h-4 bg-muted rounded w-1/2" />
    <div class="h-8 bg-muted rounded w-1/3 mt-4" />
  </div>
)

export { Category, Category as CategoryRoot, CategoryWrapper }
export type { CategoryRootProps }
