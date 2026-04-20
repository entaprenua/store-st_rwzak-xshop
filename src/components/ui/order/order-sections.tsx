import { Show, type JSX, splitProps, createContext, useContext, Accessor } from "solid-js"
import { useOrder } from "./order-context"
import { useCheckout } from "./checkout-context"
import { Text } from "../text"
import { Button } from "../button"
import { Link } from "../link"
import { cn } from "~/lib/utils"
import { Collection, CollectionView } from "../collection"

// ============================================================================
// Payment Context
// ============================================================================

type CheckoutPaymentContextValue = {
  selected: Accessor<string>
  isSelected: (value: string) => boolean
  select: (value: string) => void
}

const CheckoutPaymentContext = createContext<CheckoutPaymentContextValue>()

export const useCheckoutPayment = (): CheckoutPaymentContextValue => {
  const ctx = useContext(CheckoutPaymentContext)
  if (!ctx) {
    throw new Error("useCheckoutPayment must be used within CheckoutPaymentProvider")
  }
  return ctx
}

type CheckoutPaymentProviderProps = {
  class?: string
  children?: JSX.Element
}

export const CheckoutPaymentProvider = (props: CheckoutPaymentProviderProps) => {
  const checkout = useCheckout()

  const selected = () => checkout.formData().paymentMethod
  const isSelected = (value: string) => selected() === value
  const select = (value: string) => checkout.setFormData({ paymentMethod: value as "mpesa" })

  return (
    <CheckoutPaymentContext.Provider value={{ selected, isSelected, select }}>
      {props.children}
    </CheckoutPaymentContext.Provider>
  )
}

// ============================================================================
// Order Items Components (Collection Pattern)
// ============================================================================

export type OrderItemsProps = {
  class?: string
  children?: JSX.Element
}

export const OrderItems = (props: OrderItemsProps) => {
  const order = useOrder()
  const [local] = splitProps(props, ["class", "children"])

  return (
    <Collection data={order.items()}>
      {local.children}
    </Collection>
  )
}

export type OrderItemsViewProps = {
  class?: string
  children?: JSX.Element | ((item: ReturnType<ReturnType<typeof useOrder>["items"]>[number], index: number) => JSX.Element)
}

export const OrderItemsView = (props: OrderItemsViewProps) => {
  const [local] = splitProps(props, ["class", "children"])

  return (
    <div class={cn("flex flex-col gap-4", local.class)}>
      <CollectionView>
        {local.children}
      </CollectionView>
    </div>
  )
}

// ============================================================================
// Order Empty
// ============================================================================

type OrderEmptyProps = {
  class?: string
  variant?: "order" | "checkout"
  children?: JSX.Element
}

export const OrderEmpty = (props: OrderEmptyProps) => {
  const order = useOrder()
  const [local] = splitProps(props, ["class", "variant", "children"])

  const variant = local.variant ?? "order"

  return (
    <Show when={order.isEmpty()}>
      <div class={cn("flex flex-col items-center justify-center min-h-[30vh] gap-2", local.class)}>
        {local.children ?? (
          <>
            <Text variant="h3" class="text-muted-foreground">
              {variant === "order" ? "Your order is empty" : "Your cart is empty"}
            </Text>
            <Text variant="body2" class="text-muted-foreground">
              {variant === "order"
                ? "Add some products to your cart"
                : "Add some products to your cart before checking out"
              }
            </Text>
            {variant === "checkout" && (
              <Button as={Link} href="/products">Browse Products</Button>
            )}
          </>
        )}
      </div>
    </Show>
  )
}

// ============================================================================
// Order Summary
// ============================================================================

type OrderSubtotalProps = {
  class?: string
}

export const OrderSubtotal = (props: OrderSubtotalProps) => {
  const order = useOrder()

  return (
    <Text class={props.class}>
      {order.subtotal().toFixed(2)}
    </Text>
  )
}

type OrderCountProps = {
  class?: string
}

export const OrderCount = (props: OrderCountProps) => {
  const order = useOrder()

  return (
    <Text class={props.class}>
      {order.items().length}
    </Text>
  )
}

// ============================================================================
// Payment Method Components
// ============================================================================

export type CheckoutMpesaPaymentProps = {
  class?: string
}

export const CheckoutMpesaPayment = (props: CheckoutMpesaPaymentProps) => {
  const checkout = useCheckout()

  return (
    <Show when={checkout.formData().paymentMethod === "mpesa"}>
      <input
        type="tel"
        placeholder="254700000000"
        value={checkout.formData().paymentPhone}
        onInput={(e) => checkout.setFormData({ paymentPhone: e.currentTarget.value })}
        class={cn("max-w-xs", props.class)}
      />
    </Show>
  )
}

export type CheckoutPaymentMethodSelectProps = {
  class?: string
  children?: JSX.Element
}

/* TODO USE ../select kobalte components */
export const CheckoutPaymentMethodSelect = (props: CheckoutPaymentMethodSelectProps) => {
  const [local] = splitProps(props, ["class", "children"])
  return (
    <div class={cn("space-y-3", local.class)}>
      {local.children}
    </div>
  )
}

