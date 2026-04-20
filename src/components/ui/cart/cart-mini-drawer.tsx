import { type JSX, splitProps } from "solid-js"
import { Drawer } from "~/components/ui/drawer"
import { useCartMini } from "./cart-mini-context"

export type CartMiniDrawerProps = {
  children?: JSX.Element
}

export const CartMiniDrawer = (props: CartMiniDrawerProps) => {
  const { open, setOpen } = useCartMini()
  const [_, others] = splitProps(props, ["open", "onOpenChange"])
  return (
    <Drawer open={open()} onOpenChange={setOpen} {...others}>
      {props.children}
    </Drawer>
  )
}
