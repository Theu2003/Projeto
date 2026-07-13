interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange?.(star)}
          disabled={readOnly}
          className={`text-2xl ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
            star <= value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          } ${!readOnly ? 'hover:text-yellow-400' : ''}`}
          aria-label={`Star ${star}`}
          role={readOnly ? 'img' : 'button'}
          data-testid={star <= value ? 'star-filled' : 'star-empty'}
        >
          ★
        </button>
      ))}
    </div>
  );
}
