import type { JSX, ValidComponent } from "solid-js"
import { Show, splitProps, createContext, useContext, type ParentComponent } from "solid-js"

import * as PaginationPrimitive from "@kobalte/core/pagination"
import type { PolymorphicProps } from "@kobalte/core/polymorphic"

import { cn } from "~/lib/utils"
import { buttonVariants } from "~/components/ui/button"

const PaginationItems = PaginationPrimitive.Items

type PaginationItemContextValue = {
  page: number
}

const PaginationItemContext = createContext<PaginationItemContextValue | undefined>(undefined)
const usePaginationItem = () => {
  const ctx = useContext(PaginationItemContext)
  if (!ctx) throw new Error("usePaginationItem must be used within PaginationItemProvider")
  return ctx
}

interface PaginationItemProviderProps {
  page: number
  children?: JSX.Element
}

const PaginationItemProvider: ParentComponent<PaginationItemProviderProps> = (props) => {
  return (
    <PaginationItemContext.Provider value={{ page: props.page }}>
      {props.children}
    </PaginationItemContext.Provider>
  )
}

type PaginationRootProps<T extends ValidComponent = "nav"> =
  PaginationPrimitive.PaginationRootProps<T> & {
    class?: string | undefined
    children?: JSX.Element
  }

const Pagination = <T extends ValidComponent = "nav">(
  props: PolymorphicProps<T, PaginationRootProps<T>>
) => {
  const [local, others] = splitProps(props as PaginationRootProps, ["class", "children"])
  return (
    <PaginationPrimitive.Root
      class={cn("[&>*]:flex [&>*]:flex-row [&>*]:items-center [&>*]:gap-1", local.class)}
      {...others}
    >
      {local.children}
    </PaginationPrimitive.Root>
  )
}

type PaginationItemProps<T extends ValidComponent = "button"> =
  Omit<PaginationPrimitive.PaginationItemProps<T>, "children" | "page"> & {
    class?: string | undefined
    page?: number
    children?: JSX.Element | ((page: number) => JSX.Element)
  }

const PaginationItem = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, PaginationItemProps<T>>
) => {
  const [local, others] = splitProps(props as PaginationItemProps, ["class", "page", "children"])
  const ctx = useContext(PaginationItemContext)
  const page = local.page ?? ctx?.page ?? 0

  const renderContent = () => {
    const child = local.children
    if (typeof child === "function") {
      return (child as (page: number) => JSX.Element)(page)
    }
    if (child) return child
    return page
  }

  return (
    <PaginationPrimitive.Item
      class={cn(
        buttonVariants({
          variant: "ghost"
        }),
        "size-10 data-[current]:border",
        local.class
      )}
      page={page}
      {...others}
    >
      {renderContent()}
    </PaginationPrimitive.Item>
  )
}

type PaginationEllipsisProps<T extends ValidComponent = "div"> =
  PaginationPrimitive.PaginationEllipsisProps<T> & {
    class?: string | undefined
  }

const PaginationEllipsis = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, PaginationEllipsisProps<T>>
) => {
  const [local, others] = splitProps(props as PaginationEllipsisProps, ["class"])
  return (
    <PaginationPrimitive.Ellipsis
      class={cn("flex size-10 items-center justify-center", local.class)}
      {...others}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span class="sr-only">More pages</span>
    </PaginationPrimitive.Ellipsis>
  )
}

type PaginationPreviousProps<T extends ValidComponent = "button"> =
  PaginationPrimitive.PaginationPreviousProps<T> & {
    class?: string | undefined
    children?: JSX.Element
  }

const PaginationPrevious = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, PaginationPreviousProps<T>>
) => {
  const [local, others] = splitProps(props as PaginationPreviousProps, ["class", "children"])
  return (
    <PaginationPrimitive.Previous
      class={cn(
        buttonVariants({
          variant: "ghost"
        }),
        "gap-1 pl-2.5",
        local.class
      )}
      {...others}
    >
      <Show
        when={local.children}
        fallback={
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
            >
              <path d="M15 6l-6 6l6 6" />
            </svg>
            <span>Previous</span>
          </>
        }
      >
        {(children) => children()}
      </Show>
    </PaginationPrimitive.Previous>
  )
}

type PaginationNextProps<T extends ValidComponent = "button"> =
  PaginationPrimitive.PaginationNextProps<T> & {
    class?: string | undefined
    children?: JSX.Element
  }

const PaginationNext = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, PaginationNextProps<T>>
) => {
  const [local, others] = splitProps(props as PaginationNextProps, ["class", "children"])
  return (
    <PaginationPrimitive.Next
      class={cn(
        buttonVariants({
          variant: "ghost"
        }),
        "gap-1 pl-2.5",
        local.class
      )}
      {...others}
    >
      <Show
        when={local.children}
        fallback={
          <>
            <span>Next</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
            >
              <path d="M9 6l6 6l-6 6" />
            </svg>
          </>
        }
      >
        {(children) => children()}
      </Show>
    </PaginationPrimitive.Next>
  )
}

export {
  Pagination,
  PaginationItems,
  PaginationItem,
  PaginationEllipsis,
  PaginationPrevious,
  PaginationNext,
  PaginationItemProvider,
  usePaginationItem
}
