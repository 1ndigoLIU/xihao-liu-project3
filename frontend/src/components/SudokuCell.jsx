import {useState} from 'react';

/**
 * Individual Sudoku cell component
 * Receives props from parent and manages its own hover state
 */
export default function SudokuCell({
                                       row,
                                       col,
                                       value,
                                       isGiven,
                                       isSelected,
                                       isInvalid,
                                       isHint,
                                       onSelect,
                                       onChange,
                                       size,
                                       isCompleted = false,
                                   }) {
    const [isHovered, setIsHovered] = useState(false);

    // When game is completed, disable all cells (lock the board)
    const isDisabled = isGiven || isCompleted;

    // Determine cell class based on state
    const getCellClass = () => {
        const classes = [];
        if (isGiven) classes.push('given');
        if (isSelected && !isCompleted) classes.push('selected');
        if (isInvalid && !isCompleted) classes.push('invalid');
        if (isHint && !isCompleted) classes.push('hint');
        if (isHovered && !isGiven && !isCompleted) classes.push('hover');
        return classes.join(' ');
    };

    const handleClick = () => {
        if (!isDisabled) {
            onSelect(row, col);
        }
    };

    const handleChange = (e) => {
        const inputValue = e.target.value;
        onChange(row, col, inputValue);
    };

    // Allowed navigation keys
    const NAVIGATION_KEYS = ['Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    const handleKeyDown = (e) => {
        // Allow navigation keys
        if (NAVIGATION_KEYS.includes(e.key)) {
            return;
        }

        // Only allow numbers in valid range
        const num = parseInt(e.key, 10);
        if (isNaN(num) || num < 1 || num > size) {
            e.preventDefault();
        }
    };

    return (<td>
        <input
            aria-label={`r${row + 1}c${col + 1}`}
            className={getCellClass()}
            type="number"
            min="1"
            max={size}
            step="1"
            inputMode="numeric"
            placeholder=" "
            value={value || ''}
            disabled={isDisabled}
            readOnly={isDisabled}
            onClick={handleClick}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{cursor: isDisabled ? 'default' : 'pointer'}}
        />
    </td>);
}

