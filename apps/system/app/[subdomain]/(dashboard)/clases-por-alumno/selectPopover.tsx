import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/shadcn/command"
import { cn } from "lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover"
import { Button } from "@repo/ui/components/shadcn/button"
import { Check } from "@repo/ui/icons"

interface SelectPopoverProps<T> {
  items: T[]
  value: string | undefined
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  renderItem: (item: T) => React.ReactNode
  getKey: (item: T) => string
  getLabel: (item: T) => string
}

export function SelectPopover<T extends { _id: string }>({
  items,
  value,
  onChange,
  placeholder,
  disabled,
  renderItem,
  getKey,
  getLabel,
}: SelectPopoverProps<T>) {
  const [open, setOpen] = useState(false)

  const selectedItem = items.find((item) => item._id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedItem ? getLabel(selectedItem) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-md p-0 sm:w-[400px] md:w-[500px]">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>No se encontró nada.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={getKey(item)}
                  value={getLabel(item)}
                  onSelect={() => {
                    onChange(item._id)
                    setOpen(false)
                  }}
                >
                  {renderItem(item)}

                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === item._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}