import { QueryClient as TanStackQueryClient, QueryClientProvider } from "@tanstack/solid-query";
const queryClient = new TanStackQueryClient()
import { splitProps } from "solid-js";

const QueryClient = (props) => {

  const [local, others] = splitProps(props, ["children"])
  return (
    <QueryClientProvider client={queryClient}>
      {local.children}
    </QueryClientProvider>
  )

}

export { QueryClient }
