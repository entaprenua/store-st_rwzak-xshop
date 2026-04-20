import { createContext, useContext, type ParentComponent, createSignal, createMemo, createEffect } from "solid-js"
import { wishlistsApi, type WishlistResponse } from "~/lib/api/wishlists"
import { useStoreId } from "~/lib/store-context"
import { useAuth } from "~/lib/guards/auth"
import type { WishlistItem } from "~/lib/types"

const GUEST_CART_KEY = 'guest_wishlist_id'

function getGuestId(): string {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem(GUEST_CART_KEY)
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem(GUEST_CART_KEY, id)
  return id
}

export type WishlistItemContextData = {
  id: string
  productId: string
  quantity: number
  name: string
  image?: string
  selected: boolean
}

type WishlistContextValue = {
  wishlist: Accessor<WishlistResponse | null>
  items: Accessor<WishlistItemContextData[]>
  count: Accessor<number>
  isEmpty: Accessor<boolean>
  isLoading: Accessor<boolean>
  isPending: Accessor<boolean>
  error: Accessor<Error | null>
  addItem: (input: { productId: string; name?: string; image?: string }) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  toggleSelected: (productId: string) => void
  selectAll: () => void
  deselectAll: () => void
  clear: () => Promise<void>
  refetch: () => Promise<void>
  hasProduct: (productId: string) => boolean
  findByProductId: (productId: string) => WishlistItemContextData | undefined
}

const WishlistContext = createContext<WishlistContextValue>()

export const useWishlist = (): WishlistContextValue => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}

const wishlistItemToContext = (item: WishlistItem): WishlistItemContextData => ({
  id: item.id ?? "",
  productId: item.productId,
  quantity: 1,
  name: "",
  image: undefined,
  selected: true,
})

type WishlistProviderProps = {
  children?: ParentComponent<any>["children"]
  loadingFallback?: any
  initialWishlist?: WishlistResponse
}

export const WishlistProvider: WishlistProviderProps = (props) => {
  const auth = useAuth()
  const contextStoreId = useStoreId()

  const storeId = () => contextStoreId()

  const [wishlist, setWishlist] = createSignal<WishlistResponse | null>(props.initialWishlist ?? null)
  const [isLoading, setIsLoading] = createSignal(!props.initialWishlist)
  const [isPending, setIsPending] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  const loadWishlist = async () => {
    const sid = storeId()
    if (!sid) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const fetchedWishlist = await wishlistsApi.get(sid)
      setWishlist(fetchedWishlist)
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  createEffect(() => {
    const sid = storeId()
    if (sid && !props.initialWishlist) {
      loadWishlist()
    }
  })

  const items = createMemo((): WishlistItemContextData[] => {
    const w = wishlist()
    if (!w?.items) return []
    return w.items.map(wishlistItemToContext)
  })

  const count = createMemo(() => items().length)
  const isEmpty = createMemo(() => items().length === 0)

  const saveWishlist = async (itemsToSave: WishlistItem[]) => {
    const sid = storeId()
    if (!sid) return

    const currentWishlist = wishlist()
    try {
      const saved = await wishlistsApi.save(sid, {
        id: currentWishlist?.id,
        storeId: sid,
        customerId: currentWishlist?.customerId,
        items: itemsToSave,
      })
      setWishlist(saved)
    } catch (e) {
      setError(e as Error)
      throw e
    }
  }

  const addItem = async (input: { productId: string; name?: string; image?: string }) => {
    const currentWishlist = wishlist()
    const sid = storeId()
    if (!sid) return

    if (items().some(item => item.productId === input.productId)) return

    setIsPending(true)
    setError(null)

    try {
      const newItem: WishlistItem = {
        id: crypto.randomUUID(),
        wishlistId: currentWishlist?.id ?? "",
        productId: input.productId,
        insertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }

      const updatedItems = [...(currentWishlist?.items ?? []), newItem]
      await saveWishlist(updatedItems)
    } catch (e) {
      setError(e as Error)
      throw e
    } finally {
      setIsPending(false)
    }
  }

  const removeItem = async (productId: string) => {
    const currentWishlist = wishlist()
    const sid = storeId()
    if (!sid) return

    setIsPending(true)
    setError(null)

    try {
      const updatedItems = (currentWishlist?.items ?? []).filter(
        item => item.productId !== productId
      )
      await saveWishlist(updatedItems)
    } catch (e) {
      setError(e as Error)
      throw e
    } finally {
      setIsPending(false)
    }
  }

  const toggleSelected = (productId: string) => {
    // Wishlist items don't have selected state in current implementation
  }

  const selectAll = () => {
    // Wishlist items don't have selected state in current implementation
  }

  const deselectAll = () => {
    // Wishlist items don't have selected state in current implementation
  }

  const clear = async () => {
    const sid = storeId()
    if (!sid) return

    setIsPending(true)
    setError(null)

    try {
      await saveWishlist([])
    } catch (e) {
      setError(e as Error)
      throw e
    } finally {
      setIsPending(false)
    }
  }

  const refetch = async () => {
    await loadWishlist()
  }

  const hasProduct = (productId: string) => {
    return items().some(item => item.productId === productId)
  }

  const findByProductId = (productId: string) => {
    return items().find(item => item.productId === productId)
  }

  const value: WishlistContextValue = {
    wishlist,
    items,
    count,
    isEmpty,
    isLoading,
    isPending,
    error,
    addItem,
    removeItem,
    toggleSelected,
    selectAll,
    deselectAll,
    clear,
    refetch,
    hasProduct,
    findByProductId,
  }

  return (
    <WishlistContext.Provider value={value}>
      {props.children}
    </WishlistContext.Provider>
  )
}

export { WishlistContext }
export type { WishlistContextValue, WishlistProviderProps }
