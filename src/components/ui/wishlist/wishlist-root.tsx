import { Show, splitProps, type JSX, createResource, createMemo } from "solid-js"
import { WishlistProvider } from "./wishlist-context"
import { Collection, CollectionView, CollectionEmpty } from "~/components/ui/collection"
import { useStoreId } from "~/lib/store-context"
import { wishlistsApi, type WishlistResponse } from "~/lib/api/wishlists"
import { WishlistSkeleton } from "./wishlist-skeleton"

export type WishlistRootProps = {
  data?: WishlistResponse
  class?: string
  children?: JSX.Element
}

const WishlistRootContent = (props: { data?: WishlistResponse; class?: string; children?: JSX.Element }) => {
  return (
    <Show when={props.data} fallback={null}>
      <WishlistProvider initialWishlist={props.data}>
        <div class={props.class}>{props.children}</div>
      </WishlistProvider>
    </Show>
  )
}

export const WishlistRoot = (props: WishlistRootProps) => {
  const contextStoreId = useStoreId()
  
  const resolvedStoreId = createMemo(() => {
    return contextStoreId()
  })
  
  const [data] = createResource(
    resolvedStoreId,
    async (storeId) => {
      if (!storeId) return undefined
      return wishlistsApi.get(storeId)
    }
  )

  return (
    <Show when={!props.data} fallback={
      <WishlistRootContent data={props.data} class={props.class}>
        {props.children}
      </WishlistRootContent>
    }>
      <Show when={resolvedStoreId()} fallback={<WishlistSkeleton />}>
        <Show when={!data.loading && !data.error} fallback={<WishlistSkeleton />}>
          <WishlistRootContent data={data()} class={props.class}>
            {props.children}
          </WishlistRootContent>
        </Show>
      </Show>
    </Show>
  )
}

export type WishlistItemsProps = {
  class?: string
  children?: JSX.Element
}

export const WishlistItems = (props: WishlistItemsProps) => {
  const [local] = splitProps(props, ["class", "children"])
  
  return (
    <Collection>
      {local.children}
    </Collection>
  )
}

export type WishlistItemsViewProps = {
  class?: string
  children?: JSX.Element | ((item: any, index: number) => JSX.Element)
}

export const WishlistItemsView = (props: WishlistItemsViewProps) => {
  const [local] = splitProps(props, ["class", "children"])
  
  return (
    <CollectionView class={local.class}>
      {local.children}
    </CollectionView>
  )
}

const DefaultWishlistEmptyMessage = () => (
  <div class="flex flex-col items-center justify-center min-h-[30vh] gap-2">
    <span class="text-muted-foreground text-lg">No wishlist items yet</span>
    <span class="text-muted-foreground">Add products to your wishlist to save them for later</span>
  </div>
)

export const WishlistItemsEmpty = (props: { class?: string; children?: JSX.Element }) => {
  const [local] = splitProps(props, ["class", "children"])
  
  return (
    <CollectionEmpty class={local.class}>
      {local.children ?? <DefaultWishlistEmptyMessage />}
    </CollectionEmpty>
  )
}
