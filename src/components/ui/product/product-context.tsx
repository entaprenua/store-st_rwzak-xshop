import { createContext, useContext, createEffect, on, type JSX, createMemo } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { useWishlist } from "../wishlist/wishlist-context"
import { useCart } from "../cart/cart-context"
import type { Product } from "~/lib/types"

export type ProductStockStatus = "in_stock" | "low_stock" | "out_of_stock"

export type ProductContextData = Partial<Product> & {
  quantity?: number
  productId?: string
}

type ProductContextValue = {
  data: ProductContextData
  isInCart: () => boolean
  isInWishlist: () => boolean
  cartQuantity: () => number
  update: (updates: Partial<ProductContextData>) => void
  getStockStatus: () => ProductStockStatus
  getAvailableQuantity: () => number
  isBackorderAllowed: () => boolean
}

const ProductContext = createContext<ProductContextValue | undefined>()

export const useProduct = (): ProductContextValue | undefined =>
  useContext(ProductContext)

type ProductProviderProps = {
  data?: ProductContextData
  children?: JSX.Element
}

export const ProductProvider = (props: ProductProviderProps) => {
  let cart: ReturnType<typeof useCart> | undefined
  let wishlist: ReturnType<typeof useWishlist> | undefined

  try {
    cart = useCart()
    wishlist = useWishlist()
  } catch {
    // Cart/Wishlist not available (outside provider)
  }

  const [product, setProduct] = createStore<ProductContextData>({
    id: "",
    storeId: "",
    name: "",
    price: null,
    compareToPrice: null,
    image: null,
    description: null,
    visibility: null,
    sku: null,
    stockQuantity: 0,
    reservedQuantity: 0,
    trackInventory: true,
    allowBackorder: false,
    lowStockThreshold: 10,
    outOfStockThreshold: 0,
    isDeleted: false,
    version: 1,
    insertedAt: "",
    updatedAt: "",
  })

  createEffect(on(() => props.data, (data) => {
    if (data?.id || data?.productId) {
      setProduct(
        produce((state) => {
          Object.assign(state, data)
          if (!state.id && data.productId) {
            state.id = data.productId
          }
        })
      )
    }
  }
  )
  )

  createEffect(
    on(
      () => {
        const id = product.id
        const resolvedId = id || product.productId
        return resolvedId && cart ? cart.findByProductId(resolvedId)?.quantity : undefined
      },
      (qty) => {
        if (qty !== undefined) {
          setProduct("quantity", qty)
        }
      }
    )
  )

  const getStockStatus = createMemo((): ProductStockStatus => {
    if (product.trackInventory === false) return "in_stock"

    const stockQty = product.stockQuantity ?? 0
    const reservedQty = product.reservedQuantity ?? 0
    const available = stockQty - reservedQty

    if (available <= 0) {
      return product.allowBackorder ? "in_stock" : "out_of_stock"
    }

    const threshold = product.lowStockThreshold ?? 10
    if (available <= threshold) {
      return "low_stock"
    }

    return "in_stock"
  })

  const getAvailableQuantity = createMemo((): number => {
    if (product.trackInventory === false) return -1 // Unlimited
    const stockQty = product.stockQuantity ?? 0
    const reservedQty = product.reservedQuantity ?? 0
    return Math.max(0, stockQty - reservedQty)
  })

  const isBackorderAllowed = createMemo((): boolean => {
    if (product.allowBackorder && product.trackInventory === false) return true
    return (product.allowBackorder ?? false) && getAvailableQuantity() <= 0
  })

  const isInCart = createMemo((): boolean => {
    const resolvedId = product.id || product.productId
    return !!(
      resolvedId &&
      cart &&
      typeof cart.hasProduct === "function" &&
      cart.hasProduct(resolvedId)
    )
  })

  const isInWishlist = createMemo((): boolean => {
    const resolvedId = product.id || product.productId
    return !!(
      resolvedId &&
      wishlist &&
      typeof wishlist.hasProduct === "function" &&
      wishlist.hasProduct(resolvedId)
    )
  })

  const cartQuantity = createMemo((): number => {
    const resolvedId = product.id || product.productId
    if (!resolvedId || !cart) return 0
    const item = cart.findByProductId(resolvedId)
    return item?.quantity ?? 0
  })

  const value: ProductContextValue = {
    get data() {
      return product
    },
    isInCart,
    isInWishlist,
    cartQuantity,
    update: (updates) => {
      setProduct(
        produce((state) => {
          Object.assign(state, updates)
        })
      )
    },
    getStockStatus,
    getAvailableQuantity,
    isBackorderAllowed,
  }

  return (
    <ProductContext.Provider value={value}>
      {props.children}
    </ProductContext.Provider>
  )
}

export type { ProductContextValue, ProductProviderProps }
