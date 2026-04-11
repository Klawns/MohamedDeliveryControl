interface VisibilityBounds {
    top: number;
    bottom: number;
}

interface ElementBounds {
    top: number;
    bottom: number;
}

export function isElementTopVisibleWithinBounds(
    elementBounds: ElementBounds,
    visibilityBounds: VisibilityBounds,
) {
    return (
        elementBounds.top >= visibilityBounds.top &&
        elementBounds.top < visibilityBounds.bottom &&
        elementBounds.bottom > visibilityBounds.top
    );
}
