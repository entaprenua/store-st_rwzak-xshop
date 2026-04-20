import { createContext, useContext, type JSX, type Accessor, createMemo, createSignal, Show, createEffect } from "solid-js"
import { createQuery, createMutation, useQueryClient } from "@tanstack/solid-query"
import { cartsApi, type Cart, type CartItem } from "~/lib/api/carts"
import { sessionsApi } from "~/lib/api/sessions"
import { useStoreId } from "~/lib/store-context"
import { useAuth } from "~/lib/guards/auth"

export type CartItemContextData = {
  id: string
  productId: string
  quantity: number
  price: number
  name: string
  image?: string
  selected: boolean
  subtotal: number
}

export type AddToCartInput = {
  productId: string
  name?: string
  price: number
  image?: string
  quantity?: number
}

type CartContextValue = {
  cart: Accessor<Cart | null>
  cartId: Accessor<string | null>
  items: Accessor<CartItemContextData[]>
  selectedItems: Accessor<CartItemContextData[]>
  count: Accessor<number>
  subtotal: Accessor<number>
  selectedSubtotal: Accessor<number>
  isEmpty: Accessor<boolean>
  isLoading: Accessor<boolean>
  isPending: Accessor<boolean>
  error: Accessor<Error | null>
  addItem: (item: AddToCartInput) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  toggleSelected: (productId: string) => void
  selectAll: () => void
  deselectAll: () => void
  clear: () => void
  clearSelected: () => void
  refetch: () => void
  hasProduct: (productId: string) => boolean
  findByProductId: (productId: string) => CartItemContextData | undefined
}

const CartContext = createContext<CartContextValue>()

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider")
  }
  return ctx
}

const cartItemToContext = (item: CartItem): CartItemContextData => {
  const price = typeof item.price === "string" ? parseFloat(item.price) : (item.price ?? 0)
  const sub = typeof item.subtotal === "string" ? parseFloat(item.subtotal) : (item.subtotal ?? 0)
  return {
    id: item.id ?? item.productId,
    productId: item.productId,
    quantity: item.quantity,
    price,
    name: (item as any).name ?? "",
    image: (item as any).image ?? undefined,
    selected: item.selected ?? true,
    subtotal: sub,
  }
}

type CartProviderProps = {
  children?: JSX.Element
  loadingFallback?: JSX.Element
  errorFallback?: (error: Error) => JSX.Element
}

export const CartProvider = (props: CartProviderProps) => {
  const auth = useAuth()
  const contextPublicId = useStoreId()
  const queryClient = useQueryClient()

  const getPublicId = () => contextPublicId()

  const [cart, setCart] = createSignal<Cart | null>(null)
  const [error, setError] = createSignal<Error | null>(null)
  const [optimisticCart, setOptimisticCart] = createSignal<Cart | null>(null)

  const cartId = (): string | null => (optimisticCart() ?? cart())?.id ?? null

  const ensureGuestSession = async (publicId: string): Promise<string | undefined> => {
    if (auth.user()) return undefined
    const session = await sessionsApi.getOrCreate(publicId)
    return session.sessionId
  }

  const fetchCart = async (): Promise<Cart | null> => {
    const publicId = getPublicId()
    if (!publicId) return null

    if (!auth.user()) {
      await ensureGuestSession(publicId)
    }

    const fetchedCart = await cartsApi.get(publicId)
    return fetchedCart
  }

  const cartQuery = createQuery(() => ({
    queryKey: ["cart", getPublicId()],
    queryFn: fetchCart,
    enabled: !!getPublicId(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  }))

  createEffect(() => {
    if (cartQuery.data) {
      setCart(cartQuery.data)
    }
  })

  createEffect(() => {
    if (cartQuery.isError) {
      setError(cartQuery.error as Error)
    }
  })

  const currentCart = () => optimisticCart() ?? cart()
  const isOptimistic = () => optimisticCart() !== null

  const items = createMemo((): CartItemContextData[] => {
    const c = currentCart()
    if (!c?.items) return []
    return c.items.map(cartItemToContext)
  })

  const count = createMemo(() => items().length)

  const subtotal = createMemo(() => {
    return items().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  })

  const selectedItems = createMemo(() => items().filter((item) => item.selected))

  const selectedSubtotal = createMemo(() => {
    return selectedItems().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  })

  const isEmpty = createMemo(() => items().length === 0)

  const ensureCart = async (): Promise<Cart | null> => {
    let current = currentCart()
    const publicId = getPublicId()
    
    if (!current && publicId) {
      if (!auth.user()) {
        await ensureGuestSession(publicId)
      }
      
      try {
        current = await cartsApi.create(publicId)
      } catch {
        current = await cartsApi.get(publicId)
      }
    }
    
    return current
  }

  const createOptimisticCart = (updates: Partial<Cart>): Cart | null => {
    const current = currentCart()
    if (!current) return null
    return { ...current, ...updates, items: updates.items ?? current.items }
  }

  const addItemMutation = createMutation(() => ({
    mutationFn: async (input: AddToCartInput) => {
      const publicId = getPublicId()
      if (!publicId) throw new Error("No store ID")

      const currentCart = await ensureCart()
      if (!currentCart?.id) throw new Error("Cart not available")

      // Always use addItem - server handles upsert logic
      return await cartsApi.addItem(publicId, currentCart.id, {
        productId: input.productId,
        quantity: input.quantity ?? 1,
      })
    },
    onMutate: async (input: AddToCartInput) => {
      const existingItem = items().find(item => item.productId === input.productId)
      const quantity = input.quantity ?? 1

      const optimisticItems = existingItem
        ? items().map(item =>
            item.productId === input.productId
              ? { ...item, quantity: item.quantity + quantity, subtotal: item.price * (item.quantity + quantity) }
              : item
          )
        : [
            ...items(),
            {
              id: crypto.randomUUID?.() ?? `temp-${Date.now()}`,
              productId: input.productId,
              quantity,
              price: input.price,
              name: input.name ?? "",
              image: input.image,
              selected: true,
              subtotal: input.price * quantity,
            }
          ]

      setOptimisticCart(createOptimisticCart({ items: optimisticItems as CartItem[] }))
      return { items: items() }
    },
    onError: (err, input, context) => {
      setOptimisticCart(null)
      setError(err as Error)
      if (context?.items) {
        setCart(createOptimisticCart({ items: context.items as CartItem[] }))
      }
    },
    onSuccess: () => {
      setOptimisticCart(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
    },
  }))

  const removeItemMutation = createMutation(() => ({
    mutationFn: async (productId: string) => {
      const publicId = getPublicId()
      const cid = cartId()
      if (!publicId || !cid) throw new Error("Missing cart info")
      await cartsApi.removeItem(publicId, cid, productId)
    },
    onMutate: async (productId: string) => {
      const snapshot = items()
      const optimisticItems = items().filter(item => item.productId !== productId)
      setOptimisticCart(createOptimisticCart({ items: optimisticItems as CartItem[] }))
      return { snapshot }
    },
    onError: (err, productId, context) => {
      setOptimisticCart(null)
      setError(err as Error)
      if (context?.snapshot) {
        setCart(createOptimisticCart({ items: context.snapshot as CartItem[] }))
      }
    },
    onSuccess: () => {
      setOptimisticCart(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
    },
  }))

  const updateQuantityMutation = createMutation(() => ({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const publicId = getPublicId()
      const cid = cartId()
      if (!publicId || !cid) throw new Error("Missing cart info")

      if (quantity <= 0) {
        await cartsApi.removeItem(publicId, cid, productId)
      } else {
        await cartsApi.updateItem(publicId, cid, productId, { quantity })
      }
    },
    onMutate: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const snapshot = items()
      let optimisticItems: CartItemContextData[]

      if (quantity <= 0) {
        optimisticItems = items().filter(item => item.productId !== productId)
      } else {
        optimisticItems = items().map(item =>
          item.productId === productId
            ? { ...item, quantity, subtotal: item.price * quantity }
            : item
        )
      }

      setOptimisticCart(createOptimisticCart({ items: optimisticItems as CartItem[] }))
      return { snapshot }
    },
    onError: (err, variables, context) => {
      setOptimisticCart(null)
      setError(err as Error)
      if (context?.snapshot) {
        setCart(createOptimisticCart({ items: context.snapshot as CartItem[] }))
      }
    },
    onSuccess: () => {
      setOptimisticCart(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
    },
  }))

  const clearMutation = createMutation(() => ({
    mutationFn: async () => {
      const publicId = getPublicId()
      const cid = cartId()
      if (!publicId || !cid) throw new Error("Missing cart info")
      await cartsApi.delete(publicId, cid)
    },
    onMutate: async () => {
      const snapshot = currentCart()
      setOptimisticCart(createOptimisticCart({ items: [] }))
      return { snapshot }
    },
    onError: (err, _, context) => {
      setOptimisticCart(null)
      setError(err as Error)
      if (context?.snapshot) {
        setCart(context.snapshot)
      }
    },
    onSuccess: () => {
      setOptimisticCart(null)
      setCart(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
    },
  }))

  const clearSelectedMutation = createMutation(() => ({
    mutationFn: async () => {
      const publicId = getPublicId()
      const cid = cartId()
      if (!publicId || !cid) throw new Error("Missing cart info")
      await cartsApi.clearSelectedItems(publicId, cid)
    },
    onMutate: async () => {
      const snapshot = items()
      const nonSelectedItems = items().filter(item => !item.selected)
      setOptimisticCart(createOptimisticCart({ items: nonSelectedItems as CartItem[] }))
      return { snapshot }
    },
    onError: (err, _, context) => {
      setOptimisticCart(null)
      setError(err as Error)
      if (context?.snapshot) {
        setCart(createOptimisticCart({ items: context.snapshot as CartItem[] }))
      }
    },
    onSuccess: () => {
      setOptimisticCart(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
    },
  }))

  const toggleSelectedMutation = createMutation(() => ({
    mutationFn: async (productId: string) => {
      const publicId = getPublicId()
      const cid = cartId()
      if (!publicId || !cid) throw new Error("Missing cart info")
      
      // Get the NEW selected value (after optimistic update already happened)
      const item = items().find(i => i.productId === productId)
      if (!item) throw new Error("Item not found")
      
      await cartsApi.updateItem(publicId, cid, productId, {
        selected: item.selected,
      })
    },
    onError: (err) => {
      setOptimisticCart(null)
      setError(err as Error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
    },
  }))

  const toggleSelected = (productId: string) => {
    // Immediate optimistic update (like before)
    const current = currentCart()
    if (!current?.items) return
    
    const item = items().find(i => i.productId === productId)
    if (!item) return
    
    setOptimisticCart({
      ...current,
      items: current.items.map(i =>
        i.productId === productId ? { ...i, selected: !item.selected } : i
      ),
    })
    
    // Background server sync
    toggleSelectedMutation.mutate(productId)
  }

  const selectAllMutation = createMutation(() => ({
    mutationFn: async () => {
      const publicId = getPublicId()
      const cid = cartId()
      if (!publicId || !cid) throw new Error("Missing cart info")
      
      for (const item of items()) {
        if (!item.selected) {
          await cartsApi.updateItem(publicId, cid, item.productId, { selected: true })
        }
      }
    },
    onMutate: async () => {
      setOptimisticCart({
        ...currentCart()!,
        items: items().map(item => ({ ...item, selected: true })) as CartItem[],
      })
    },
    onError: (err) => {
      setOptimisticCart(null)
      setError(err as Error)
    },
    onSettled: () => {
      setOptimisticCart(null)
      queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
    },
  }))

  const selectAll = () => {
    selectAllMutation.mutate()
  }

  const deselectAllMutation = createMutation(() => ({
    mutationFn: async () => {
      const publicId = getPublicId()
      const cid = cartId()
      if (!publicId || !cid) throw new Error("Missing cart info")
      
      for (const item of items()) {
        if (item.selected) {
          await cartsApi.updateItem(publicId, cid, item.productId, { selected: false })
        }
      }
    },
    onMutate: async () => {
      setOptimisticCart({
        ...currentCart()!,
        items: items().map(item => ({ ...item, selected: false })) as CartItem[],
      })
    },
    onError: (err) => {
      setOptimisticCart(null)
      setError(err as Error)
    },
    onSettled: () => {
      setOptimisticCart(null)
      queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
    },
  }))

  const deselectAll = () => {
    deselectAllMutation.mutate()
  }

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["cart", getPublicId()] })
  }

  const hasProduct = (productId: string) => {
    return items().some((item) => item.productId === productId)
  }

  const findByProductId = (productId: string) => {
    return items().find((item) => item.productId === productId)
  }

  const isPending = createMemo(() => {
    return (
      addItemMutation.isPending ||
      removeItemMutation.isPending ||
      updateQuantityMutation.isPending ||
      clearMutation.isPending ||
      clearSelectedMutation.isPending ||
      toggleSelectedMutation.isPending ||
      selectAllMutation.isPending ||
      deselectAllMutation.isPending
    )
  })

  const value: CartContextValue = {
    cart: currentCart,
    cartId,
    items,
    selectedItems,
    count,
    subtotal,
    selectedSubtotal,
    isEmpty,
    isLoading: () => cartQuery.isLoading,
    isPending,
    error,
    addItem: addItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    updateQuantity: (productId: string, quantity: number) =>
      updateQuantityMutation.mutate({ productId, quantity }),
    toggleSelected,
    selectAll,
    deselectAll,
    clear: clearMutation.mutate,
    clearSelected: clearSelectedMutation.mutate,
    refetch,
    hasProduct,
    findByProductId,
  }

  return (
    <CartContext.Provider value={value}>
      <Show
        when={!cartQuery.isLoading}
        fallback={props.loadingFallback ?? <DefaultCartLoading />}
      >
        {props.children}
      </Show>
    </CartContext.Provider>
  )
}

const DefaultCartLoading = () => (
  <div class="animate-pulse space-y-4 p-4">
    <div class="h-20 bg-muted rounded" />
    <div class="h-20 bg-muted rounded" />
    <div class="h-20 bg-muted rounded" />
  </div>
)

export { CartContext }
export type { CartContextValue, CartProviderProps }
