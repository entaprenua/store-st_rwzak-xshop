import { createContext, useContext, createMemo, type Accessor, type JSX, createSignal, createEffect } from "solid-js"
import { storesApi, type Store } from "~/lib/api/stores"

type StoreContextValue = {
  data: Accessor<Store | null>
  id: Accessor<string | null>
  name: Accessor<string | null>
  description: Accessor<string | null>
  domain: Accessor<string | null>
  subdomain: Accessor<string | null>
}

type StoreIdContextValue = {
  publicId: Accessor<string | null>
  storeId: Accessor<string | null>
  store: Accessor<Store | null>
  isLoading: Accessor<boolean>
  error: Accessor<Error | null>
}

const StoreIdContext = createContext<StoreIdContextValue>()
const StoreContext = createContext<StoreContextValue>()

export const useStoreId = (): Accessor<string | null> => {
  const ctx = useContext(StoreIdContext)
  if (!ctx) {
    throw new Error("useStoreId must be used within StoreProvider")
  }
  return ctx.publicId
}

export const useStore = (): StoreContextValue => {
  const ctx = useContext(StoreContext)
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider")
  }
  return ctx
}

type StoreIdProviderProps = {
  publicId?: string
  store?: Store
  children?: JSX.Element
  loadingFallback?: JSX.Element
  errorFallback?: (error: Error) => JSX.Element
}

export const StoreProvider = (props: StoreIdProviderProps) => {
  const [store, setStore] = createSignal<Store | null>(props.store ?? null)
  const [isLoading, setIsLoading] = createSignal(!props.store && !props.publicId)
  const [error, setError] = createSignal<Error | null>(null)

  const publicId = (): string | null => store()?.publicId ?? props.store?.publicId ?? null
  const storeId = (): string | null => store()?.id ?? props.store?.id ?? null

  const loadStore = async (publicId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedStore = await storesApi.getByPublicId(publicId)
      setStore(fetchedStore)
    } catch (e) {
      setError(e as Error)
      setStore(null)
    } finally {
      setIsLoading(false)
    }
  }

  createEffect(() => {
    if (props.store) {
      setStore(props.store)
    } else if (props.publicId) {
      loadStore(props.publicId)
    }
  })

  const storeIdValue: StoreIdContextValue = {
    publicId,
    storeId,
    store,
    isLoading,
    error,
  }

  const data = createMemo(() => store())
  const name = createMemo(() => data()?.name ?? null)
  const description = createMemo(() => data()?.description ?? null)
  const domain = createMemo(() => data()?.domainName ?? null)
  const subdomain = createMemo(() => null)

  const storeValue: StoreContextValue = {
    data,
    id: storeId,
    name,
    description,
    domain,
    subdomain,
  }

  if (isLoading()) {
    return props.loadingFallback ?? <DefaultLoading />
  }

  if (error() && !store()) {
    return props.errorFallback ? props.errorFallback(error()!) : <DefaultError error={error()!} />
  }

  return (
    <StoreIdContext.Provider value={storeIdValue}>
      <StoreContext.Provider value={storeValue}>
        {props.children}
      </StoreContext.Provider>
    </StoreIdContext.Provider>
  )
}

const DefaultLoading = () => (
  <div class="flex items-center justify-center min-h-[50vh]">
    <div class="animate-pulse text-muted-foreground">Loading...</div>
  </div>
)

const DefaultError = (props: { error: Error }) => (
  <div class="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
    <p class="text-destructive mb-2">Failed to load store</p>
    <p class="text-muted-foreground text-sm">{props.error.message}</p>
  </div>
)

export { StoreContext }
