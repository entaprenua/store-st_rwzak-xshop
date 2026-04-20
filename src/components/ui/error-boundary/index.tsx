/*
 * ErrorBoundary Components
 * 
 * Codeless error handling with context-aware components.
 * 
 * Usage:
 *   <ErrorBoundary fallback={<ErrorFallback />}>
 *     {props.children}
 *   </ErrorBoundary>
 * 
 * ErrorFallback example:
 *   <div>
 *     <ErrorBoundaryResetButton>Reset</ErrorBoundaryResetButton>
 *     An error occurred: <ErrorBoundaryMessage />
 *     Cause: <ErrorBoundaryCause />
 *   </div>
 */

import {
  createContext,
  splitProps,
  useContext,
  type JSX,
} from "solid-js";
import { Show, ErrorBoundary as SolidErrorBoundary } from "solid-js";
import { Button, type ButtonProps } from "./../button"
import ErrorBoundaryWrapper from "./error-boundary-wrapper";
// ErrorBoundary Context
// ============================================================================

type ErrorBoundaryContextValue = {
  error: any;
  reset: () => void;
};

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue>();

const useErrorBoundaryContext = (): ErrorBoundaryContextValue => {
  const ctx = useContext(ErrorBoundaryContext);
  if (!ctx) {
    throw new Error(
      "ErrorBoundary components must be used within ErrorBoundary"
    );
  }
  return ctx;
};

// ErrorBoundary Root
// ============================================================================

type ErrorBoundaryProps = {
  fallback: JSX.Element;
  children: JSX.Element;
};

/*FIXME: Currently having issue with ssr; infinite loading, temporariry wrapped with client only wrapper to avoid ssr */
const ErrorBoundary = (props: ErrorBoundaryProps) => {
  return (
    <ErrorBoundaryWrapper>
      <SolidErrorBoundary
        fallback={(error, reset) => {
          console.error(error)
          return (
            <ErrorBoundaryContext.Provider value={{ error, reset }}>
              {props.fallback}
            </ErrorBoundaryContext.Provider>
          )
        }}
      >
        {props.children}
      </SolidErrorBoundary>
    </ErrorBoundaryWrapper>
  );
};

// ErrorBoundaryResetButton
// ============================================================================

type ErrorBoundaryResetButtonProps = ButtonProps

const ErrorBoundaryResetButton = (props: ErrorBoundaryResetButtonProps) => {
  const { reset } = useErrorBoundaryContext();
  const [local, others] = splitProps(props, ["children", "onClick"]);
  return (
    <Button onClick={reset} {...others}>
      {local.children}
    </Button>
  );
};

// ErrorBoundaryMessage
// ============================================================================

type ErrorBoundaryMessageProps = JSX.HTMLAttributes<HTMLSpanElement>;

const ErrorBoundaryMessage = (props: ErrorBoundaryMessageProps) => {
  const { error } = useErrorBoundaryContext();
  return (
    <Show when={error?.message}>
      <span {...props}>{error.message}</span>
    </Show>
  );
};

// ErrorBoundaryCause
// ============================================================================

type ErrorBoundaryCauseProps = JSX.HTMLAttributes<HTMLSpanElement>;

const ErrorBoundaryCause = (props: ErrorBoundaryCauseProps) => {
  const { error } = useErrorBoundaryContext();
  return (
    <Show when={error?.cause}>
      <span {...props}>{error.cause}</span>
    </Show>
  );
};


export {
  ErrorBoundary,
  ErrorBoundaryResetButton,
  ErrorBoundaryMessage,
  ErrorBoundaryCause,
};
