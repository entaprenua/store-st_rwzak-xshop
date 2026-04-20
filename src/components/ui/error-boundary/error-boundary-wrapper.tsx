import { clientOnly } from "@solidjs/start"

/* TODO: This is a temporary fix for the current ssr issue, fix it later */
export default clientOnly(async () => ({ default: ErrorBoundaryWrapper }), { lazy: true })

const ErrorBoundaryWrapper = (props) => <div {...props} />

