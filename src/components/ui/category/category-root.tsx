import { Show, createEffect, createResource, splitProps, type JSX, createMemo } from "solid-js"
import { A, useParams } from "@solidjs/router"
import { CategoryProvider, useCategory, type CategoryProps } from "./category-context"
import { useCollectionItem } from "../collection"
import { useStoreId } from "~/lib/store-context"
import type { Category } from "~/lib/types"
import { Query, QueryBoundary, useQueryState } from "./../query"
import { categoriesApi } from "~/lib/api/categories"

type CategoryRootProps = {
  storeId?: string
  categorySlug?: string
  data?: CategoryProps | null
  withChildren?: boolean
  withProducts?: boolean
  class?: string
  children?: JSX.Element
}

const CategoryRoot = (props: CategoryRootProps) => {
  const [local, others] = splitProps(props, ["categorySlug", "data", "withChildren", "withProducts", "href", "class", "children"])
  const params = useParams<{ categorySlug?: string; slug?: string }>()
  const contextStoreId = useStoreId()
  const routeCategorySlug = createMemo(() => params.categorySlug ?? params.slug)
  const resolvedStoreId = createMemo(() => contextStoreId())
  const collectionItem = useCollectionItem()
  const hasCollectionItem = () => !!collectionItem?.item
  const hasExplicitData = () => !!local.data
  const hasExplicitFetch = () => !!resolvedStoreId() && (!!local.categorySlug || !!routeCategorySlug())

  const resolvedData = createMemo(() => {
    if (local.data !== undefined) return local.data
    if (collectionItem) return collectionItem.item as CategoryProps
    return null
  })

  const shouldCreateProvider = () =>
    hasExplicitData() || hasCollectionItem() || hasExplicitFetch()

  return (
    <Show
      when={shouldCreateProvider()}
    /*fallback={
      <CategoryWrapper href={resolvedHref()} class={local.class}>
        {local.children}
      </CategoryWrapper>
    }
   */
    >
      <Show
        when={hasCollectionItem() && !hasExplicitData()}
        fallback={
          <CategoryRootWithFetch
            storeId={resolvedStoreId() ?? undefined}
            categorySlug={local.categorySlug ?? routeCategorySlug()}
            withChildren={local.withChildren}
            withProducts={local.withProducts}
            queryKey={local.queryKey}
            errorFallback={local.errorFallback}
            loadingFallback={local.loadingFallback}
            href={local.href}
            class={local.class}
          >
            {local.children}
          </CategoryRootWithFetch>
        }
      >
        <CategoryProvider data={resolvedData()!} >
          <CategoryWrapper class={local.class} href={local.href} >
            {local.children}
          </CategoryWrapper>
        </CategoryProvider>
      </Show >
    </Show >
  )
}

type CategoryWrapperProps = {
  href?: string
  class?: string
  children?: JSX.Element
}



const CategoryWrapper = (props: CategoryWrapperProps) => {
  const category = useCategory()

  const resolvedHref = () => {
    const categorySlug = category?.slug()
    if (!props.href || !categorySlug) return undefined
    let base = props.href
    if (base.endsWith("/")) {
      base = base.slice(0, -1)
    }
    if (!base.startsWith("/")) {
      base = `/${base}`
    }
    return `${base}/${categorySlug}`

  }


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
    "withChildren",
    "withProducts",
    "queryKey",
    "errorFallback",
    "loadingFallback",
    "href",
    "class",
    "children",
  ])

  const queryFn = async (): Promise<any | null> => {
    if (local.storeId && local.categorySlug) {
      return await categoriesApi.getBySlug(
        local.storeId,
        local.categorySlug,
        local.withChildren ?? false,
        local.withProducts ?? false,
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
            local.withChildren,
            local.withProducts,
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

export { CategoryRoot, CategoryRoot as Category, CategoryWrapper }
export type { CategoryRootProps }
