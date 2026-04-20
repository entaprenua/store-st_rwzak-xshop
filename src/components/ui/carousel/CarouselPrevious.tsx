import type { Component, ComponentProps, JSX } from "solid-js"
import { Show, splitProps } from "solid-js"
import { cn } from "~/lib/utils"
import { useCarousel } from "./CarouselContext"
import { Button } from "../button"
import ChevronLeft from "lucide-solid/icons/chevron-left"

type CarouselPreviousProps = Omit<ComponentProps<"button">, "children"> & {
  /** Custom icon */
  children?: JSX.Element
}

export const CarouselPrevious: Component<CarouselPreviousProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "onClick", "children"])
  const carousel = useCarousel()

  const handleClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (e) => {
    carousel.scrollPrev()
    if (typeof local.onClick === "function") {
      local.onClick(e)
    }
  }

  return (
    <Show when={carousel.canScrollPrev()}>
      <Button
        variant="outline"
        size="icon"
        class={cn(
          "absolute z-10 size-8 touch-manipulation rounded-full",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          carousel.orientation === "horizontal"
            ? "-left-12 top-1/2 -translate-y-1/2"
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
          local.class
        )}
        onClick={handleClick}
        aria-label="Previous slide"
        {...others}
      >
        <Show when={local.children} fallback={<ChevronLeft class="size-4" />}>
          {local.children}
        </Show>
      </Button>
    </Show>
  )
}
