# Tiptap UI Primitives

A collection of UI components for building rich text editors with Tiptap.

---

## Table of Contents

- [Toolbar](#add-a-toolbar-ui-component-into-tiptap)
- [Tooltip](#add-a-tooltip-ui-component-to-your-editor)

---

# Add a toolbar UI component into Tiptap

A container for organizing actions and controls in a horizontal or vertical layout.

## Install

You can add the primitive via Tiptap CLI

```bash
npx @tiptap/cli@latest add toolbar
```

## Usage

```jsx
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@/components/tiptap-ui-primitive/toolbar'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { BoldIcon } from '@/components/icons/bold-icon'
import { ItalicIcon } from '@/components/icons/italic-icon'
import { Spacer } from '@/components/tiptap-ui-primitive/spacer'

export default function MyComponent() {
  return (
    <Toolbar variant="default">
      <ToolbarGroup>
        <Button data-style="ghost">
          <BoldIcon className="tiptap-button-icon" />
        </Button>
        <Button data-style="ghost">
          <ItalicIcon className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button data-style="ghost">Format</Button>
      </ToolbarGroup>

      <Spacer />

      <ToolbarGroup>
        <Button data-style="primary">Save</Button>
      </ToolbarGroup>
    </Toolbar>
  )
}
```

## Props

### Toolbar

| Name | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'default'` \| `'floating'` | `'default'` | Toolbar style variant |
| data-plain | `boolean` | `undefined` | Whether to use plain styling |

### ToolbarSeparator

| Name | Type | Default | Description |
|------|------|---------|-------------|
| orientation | `'horizontal'` \| `'vertical'` | `'vertical'` | Orientation of the separator |

---

# Add a tooltip UI component to your Editor

A small informational popup that appears when hovering over an element.

## Install

You can add the primitive via Tiptap CLI

```bash
npx @tiptap/cli@latest add tooltip
```

## Usage

```jsx
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/tiptap-ui-primitive/tooltip'
import { Button } from '@/components/tiptap-ui-primitive/button'

export default function MyComponent() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button data-style="ghost">Hover Me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Tooltip content</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

## Props

### Tooltip

| Name | Type | Default | Description |
|------|------|---------|-------------|
| open | `boolean` | `undefined` | Controlled open state |
| onOpenChange | `(open: boolean) => void` | `undefined` | Callback when open state changes |
| defaultOpen | `boolean` | `false` | Default open state |
| delayDuration | `number` | `300` | Delay before tooltip appears (ms) |
| skipDelayDuration | `number` | `300` | Skip delay when moving between tooltips |

### TooltipTrigger

| Name | Type | Default | Description |
|------|------|---------|-------------|
| asChild | `boolean` | `false` | Whether to merge props with child |

### TooltipContent

| Name | Type | Default | Description |
|------|------|---------|-------------|
| side | `'top'` \| `'right'` \| `'bottom'` \| `'left'` | `'top'` | Preferred side to display content |
| align | `'start'` \| `'center'` \| `'end'` | `'center'` | Alignment along the edge |

