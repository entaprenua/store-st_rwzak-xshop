import { type JSX, Show } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { useAuthForm } from "./auth-context"
import { useAuth } from "~/lib/guards/auth"
import { useStoreId } from "~/lib/store-context"

export type AuthLoginFormProps = {
  children?: JSX.Element
  onSuccess?: () => void
}

const AuthLoginFormContent = (props: AuthLoginFormProps) => {
  const navigate = useNavigate()
  const auth = useAuth()
  const { formData, setIsLoading, setError } = useAuthForm()

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await auth.login(
        formData().email,
        formData().password
      )

      if (!result.success) {
        setError(result.error || "Login failed")
        return
      }

      props.onSuccess?.()
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {props.children}
    </form>
  )
}

export const AuthLoginForm = (props: AuthLoginFormProps) => {
  const publicId = useStoreId()

  return (
    <Show when={publicId()} fallback={<div>Store not available</div>}>
      <AuthLoginFormContent {...props} />
    </Show>
  )
}