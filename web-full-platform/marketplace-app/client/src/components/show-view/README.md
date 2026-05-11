# Show View Components

These components are extracted from the original show-view.tsx (4615 lines).
Each component contains EXACT original code - no modifications.

## How to Use

Each component is independent and can be commented out in show-view.tsx:

```tsx
// Comment out any component to test:
{/* <ProductsSidebar {...props} /> */}
<VideoCenter {...props} />
<ChatSidebar {...props} />
```

## Components

1. **ProductsSidebar** - Left sidebar with Auction/Buy Now/Giveaway/Sold tabs
2. **VideoCenter** - Middle section with LiveKit video player
3. **ChatSidebar** - Right sidebar with chat and viewers
4. **DialogsContainer** - All modal dialogs (share, buy now, tip, etc.)

All state and handlers remain in the main show-view.tsx file.
