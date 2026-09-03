interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-body-md text-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline">
          Try again
        </button>
      )}
    </div>
  )
}
