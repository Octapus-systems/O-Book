---
trigger: always_on
---

# OCTAPUS LIST PAGE STANDARDS
### Version 1.0 — Search, Filter, Sort, Pagination

---

## CRITICAL RULE — READ FIRST

This is NOT a suggestion document. Every rule here is MANDATORY.

When building, modifying, or reviewing any frontend page that displays a collection of items (tables, cards, grids, catalogs, directories, reports, inventories, orders, users, or similar datasets), you MUST enforce the following requirements.

A list page is considered incomplete if ANY of these features are missing:
- Search
- Filter
- Sort
- Pagination

---

## 1. MANDATORY FEATURES

Every list page must include all four features simultaneously:

### 1.1 Search
- Search input must be visible and easily accessible
- Support keyword-based searching across relevant fields
- Use debounced API requests when applicable (300-500ms delay)
- Preserve search state during filtering, sorting, and pagination
- Display an appropriate empty state when no results are found

### 1.2 Filter
- Implement relevant filters based on the dataset
- Support suitable filter types:
  - Single Select
  - Multi Select
  - Date Range
  - Status
  - Category
- Display active filters clearly with visual indicators
- Allow users to remove individual filters
- Provide a "Clear All Filters" action
- Preserve filter state during sorting and pagination

### 1.3 Sort
- Allow sorting on key business fields
- Support ascending and descending order
- Clearly indicate the active sort field and direction (visual indicator)
- Preserve sort state during pagination

### 1.4 Pagination
- Display current page information (e.g., "Page 1 of 10")
- Support navigation between pages (Previous, Next, Page numbers)
- Support page size selection:
  - 10 items per page
  - 25 items per page
  - 50 items per page
  - 100 items per page
- Preserve search, filter, and sort states while navigating
- Handle empty, loading, and edge cases gracefully

---

## 2. REQUIRED LAYOUT STRUCTURE

Maintain the following order consistently on every list page:

1. **Page Title** — Clear, descriptive heading
2. **Primary Actions** — Create, Add, Import, Export, etc.
3. **Search** — Search input field
4. **Filters** — Filter controls and active filter display
5. **Sort Controls** — Sort dropdown or toggle controls
6. **List/Table/Grid Content** — The actual data display
7. **Pagination** — Page navigation and page size selector

**RULE:** Never deviate from this order. Consistency across the application is mandatory.

---

## 3. DESIGN SYSTEM COMPLIANCE

All implementations must:

- Use approved design-system components (Shadcn/UI components)
- Follow existing spacing, typography, color, and layout standards from `frontendrule.md`
- Match established frontend patterns in the O Book codebase
- Be fully responsive for mobile, tablet, and desktop
- Meet accessibility requirements:
  - Keyboard navigation (Tab, Enter, Escape)
  - Focus management (visible focus states)
  - Screen reader support (ARIA labels, roles)
  - Semantic HTML

---

## 4. REQUIRED STATES

Every list page must support all of these states:

### 4.1 Loading State
- Show skeleton loaders or spinners
- Disable interactive elements during loading
- Maintain layout stability (prevent layout shift)

### 4.2 Empty State
- Display when no data exists
- Include clear messaging
- Provide action to create first item (if applicable)
- Use appropriate illustration or icon

### 4.3 No Search Results State
- Display when search returns zero results
- Show clear message: "No results found for [search term]"
- Provide option to clear search
- Suggest alternative search terms or filters

### 4.4 Error State
- Display when API request fails
- Show user-friendly error message
- Provide retry action
- Include error details for debugging (in development)

### 4.5 Success State
- Normal data display
- All features functional
- Clear visual feedback for actions

---

## 5. SEARCH REQUIREMENTS — DETAILED

### 5.1 Search Input
- Position: Top of the page, after primary actions
- Placeholder: "Search by [relevant fields]..."
- Debounce: 300-500ms before API call
- Clear button: Visible when search has value

### 5.2 Search Behavior
- Search across multiple relevant fields (name, email, title, etc.)
- Case-insensitive matching
- Support partial matches (contains, not exact)
- Highlight search terms in results (optional but recommended)

### 5.3 Search State Preservation
- Search query persists in URL (query parameter)
- Search query persists during filter/sort/page changes
- Clear search resets to full dataset

### 5.4 Empty State for Search
- Message: "No results found for '[query]'"
- Action: "Clear search" button
- Suggestion: "Try different keywords or remove filters"

---

## 6. FILTER REQUIREMENTS — DETAILED

### 6.1 Filter Types

**Single Select Filter**
- Dropdown with one selection
- Default: "All" or "Any"
- Example: Status, Category

**Multi Select Filter**
- Checkbox list or multi-select dropdown
- Show count of selected items
- Example: Tags, Multiple categories

**Date Range Filter**
- Start date and end date inputs
- Preset ranges: Today, This Week, This Month, Last Month, Custom
- Validate end date ≥ start date

**Status Filter**
- Badges with color coding
- Example: Active, Inactive, Pending, Completed

**Category Filter**
- Hierarchical if applicable
- Show item counts per category

### 6.2 Filter Display
- Active filters shown as removable chips/badges
- Each filter shows: Filter name + Value + Remove (×) button
- "Clear All Filters" button when any filter is active
- Filter panel collapsible on mobile

### 6.3 Filter State Preservation
- Filter selections persist in URL (query parameters)
- Filters persist during search/sort/page changes
- Clear individual filter removes only that filter
- Clear all filters resets all filters to default

---

## 7. SORT REQUIREMENTS — DETAILED

### 7.1 Sort Controls
- Dropdown or button group for field selection
- Toggle button for ascending/descending
- Visual indicator for active sort (icon, color, or text)

### 7.2 Sort Fields
- Sort on key business fields (name, date, amount, status, etc.)
- Default sort: Most relevant field (usually date or name)
- Sort direction: Default to descending for dates, ascending for names

### 7.3 Sort State Preservation
- Sort field and direction persist in URL (query parameters)
- Sort persists during search/filter/page changes

---

## 8. PAGINATION REQUIREMENTS — DETAILED

### 8.1 Pagination Controls
- Previous button (disabled on first page)
- Next button (disabled on last page)
- Page numbers (1, 2, 3, ..., 10)
- Current page highlighted
- "Showing X-Y of Z items" text

### 8.2 Page Size Selector
- Dropdown: 10, 25, 50, 100 items per page
- Default: 25 items per page
- Changing page size resets to page 1

### 8.3 Pagination State Preservation
- Current page and page size persist in URL (query parameters)
- Pagination persists during search/filter/sort changes
- Search/filter/sort changes reset to page 1

### 8.4 Edge Cases
- Empty dataset: Hide pagination, show empty state
- Single page: Disable Previous/Next buttons
- Large page count: Show abbreviated page numbers (1, 2, ..., 9, 10)

---

## 9. RESPONSIVE BEHAVIOR

### 9.1 Mobile (< 768px)
- Stack controls vertically
- Collapse filter panel into drawer/modal
- Reduce page size options (10, 25, 50)
- Simplified pagination (Previous/Next only)
- Horizontal scroll for tables if needed

### 9.2 Tablet (768px - 1024px)
- Side-by-side search and filters
- Full pagination controls
- Filter panel collapsible

### 9.3 Desktop (> 1024px)
- All controls visible
- Full feature set
- Optimal spacing

---

## 10. ACCESSIBILITY REQUIREMENTS

### 10.1 Keyboard Navigation
- Tab order: Title → Actions → Search → Filters → Sort → Content → Pagination
- Enter/Space to activate buttons and dropdowns
- Escape to close modals/dropdowns
- Focus trap in modals

### 10.2 Focus Management
- Visible focus states on all interactive elements
- Focus moves to content after page change
- Focus returns to trigger after closing dropdown/modal

### 10.3 Screen Reader Support
- ARIA labels on all controls
- ARIA roles for lists, tables, grids
- Live regions for dynamic content updates
- Descriptive text for icons (alt text, aria-label)

### 10.4 Semantic HTML
- Use `<table>` for tabular data
- Use `<ul>`/`<ol>` for lists
- Use `<nav>` for pagination
- Use `<button>` for actions, `<a>` for links

---

## 11. VALIDATION CHECKLIST — BEFORE GENERATING CODE

Before generating any list page code, verify ALL of these:

- [ ] Search input exists and is accessible
- [ ] Search supports keyword-based searching
- [ ] Search has debounce (300-500ms)
- [ ] Search state persists in URL
- [ ] Empty state for no search results exists
- [ ] At least one filter exists (relevant to dataset)
- [ ] Filter type is appropriate (single/multi select, date range, status, category)
- [ ] Active filters are displayed clearly
- [ ] Individual filters can be removed
- [ ] "Clear All Filters" action exists
- [ ] Filter state persists in URL
- [ ] Sort control exists (dropdown or toggle)
- [ ] Sort supports ascending and descending
- [ ] Active sort field and direction are indicated
- [ ] Sort state persists in URL
- [ ] Pagination controls exist (Previous, Next, Page numbers)
- [ ] Page size selector exists (10, 25, 50, 100)
- [ ] Current page information is displayed
- [ ] Pagination state persists in URL
- [ ] Layout order is correct: Title → Actions → Search → Filters → Sort → Content → Pagination
- [ ] Design system components are used (Shadcn/UI)
- [ ] Spacing, typography, colors match frontendrule.md
- [ ] Responsive behavior is implemented (mobile, tablet, desktop)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states are visible
- [ ] ARIA labels and roles are present
- [ ] Semantic HTML is used
- [ ] Loading state is implemented
- [ ] Empty state is implemented
- [ ] No search results state is implemented
- [ ] Error state is implemented
- [ ] Success state is implemented

If ANY box is unchecked → fix before output.

---

## 12. EXAMPLE URL STRUCTURE

List page URLs should include query parameters for state:

```
/transactions?search=payment&status=completed&sort=date&order=desc&page=2&pageSize=25
```

Parameters:
- `search`: Search query string
- `status`: Filter value (or multiple: `status=completed&status=pending`)
- `category`: Filter value
- `startDate`: Date range start
- `endDate`: Date range end
- `sort`: Sort field
- `order`: Sort direction (asc/desc)
- `page`: Current page number
- `pageSize`: Items per page

---

## 13. PROHIBITED IMPLEMENTATIONS

| Prohibited | Reason |
|---|---|
| List page without search | Users cannot find specific items |
| List page without filters | Users cannot narrow down results |
| List page without sort | Users cannot organize data |
| List page without pagination | Performance issues, poor UX |
| Hardcoded page size | Users need control over data density |
| Search without debounce | Unnecessary API calls |
| Filters without clear all | Frustrating to reset manually |
- Sort without direction indicator | Users don't know current sort order
- Pagination without page size selector | Inflexible for different use cases
- State not in URL | Cannot share or bookmark filtered views
- Loading state without skeleton | Jarring UX, layout shift
- Empty state without action | Users don't know what to do
- No keyboard navigation | Inaccessible to keyboard users
- No ARIA labels | Inaccessible to screen readers
- Non-semantic HTML | Poor accessibility and SEO

---

## 14. INTEGRATION WITH EXISTING RULES

This rule document complements `frontendrule.md` and `project-architeture.md`:

- **frontendrule.md**: Design tokens, colors, typography, shapes, components
- **project-architeture.md**: Architecture, database, API structure
- **listpage-rule.md**: List page specific features and behavior

When building list pages, follow ALL three rule documents.

---

*Octapus Intelligence Powerhouse — List Page Standards v1.0*
*Search · Filter · Sort · Pagination — Mandatory on All List Pages*
