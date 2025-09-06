# Auto Component Names

## Search Functionality

This plugin features an advanced fuzzy search system that allows you to quickly find components using partial matches across multiple data fields.

### Fuzzy Search Capabilities

The search algorithm uses intelligent scoring to rank results by relevance:

- **Exact matches** get the highest priority (100 points)
- **Starts-with matches** get high priority (90 points)  
- **Contains matches** get medium priority (70 points)
- **Character sequence matches** get lower priority (up to 60 points)

### Search Fields

The search works across multiple component properties with weighted importance:

1. **Component Name** (highest priority)
2. **Node ID** (high priority)
3. **Component Type** (medium priority)
4. **Hierarchical Path** (lower priority)
5. **Parent Name** (lowest priority)

### Search Examples

**Fuzzy matching finds partial matches like:**

- `"head"` matches `"Page heading"`
- `"0:5"` matches node ID `"0:57"`
- `"fram"` matches type `"FRAME"`
- `"shop"` matches hierarchical path containing `"Shopping cart"`

**Advanced search patterns:**

- `"button"` finds all components with "button" in the name
- `"text"` finds all TEXT components and components with "text" in names
- `"cart"` finds components in shopping cart hierarchy
- `"0:"` finds all components with node IDs starting with "0:"

### Search Features

**Keyboard Shortcuts:**
- `⌘K` (Mac) / `Ctrl+K` (Windows) - Focus search input
- `Escape` - Clear search when search is focused
- `⌘S` (Mac) / `Ctrl+S` (Windows) - Save changes
