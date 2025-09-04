
function hasMessage(err: unknown): err is { message: string } {
    return (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message: unknown }).message === "string"
    )
  }
  
export function parseConvexErrorMessage(err: unknown): string {
    const defaultMessage = "Ocurrió un error inesperado"
  
    if (typeof err === "string") return err
  
    if (err instanceof Error) {
      const match = err.message.match(/Uncaught (.+?)\n/)
      return match?.[1] ?? err.message
    }
  
    if (hasMessage(err)) {
      const msg = err.message
      const match = msg.match(/Uncaught (.+?)\n/)
      return match?.[1] ?? msg
    }
  
    return defaultMessage
  }
  