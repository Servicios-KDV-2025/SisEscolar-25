import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/shadcn/command";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover";
import { Check, ChevronsUpDown, X } from "@repo/ui/icons";
import { cn } from "lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

interface GenericMultiSelectProps<T> {
  items: T[];
  value: string[];
  onChange: (value: string[]) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => React.ReactNode;
  getSearchText?: (item: T) => string;
  disabled?: boolean;
  searchable?: boolean;
  placeholder?: string;
  emptyMessage?: string;
}

export function GenericMultiSelect<T>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  getSearchText,
  disabled,
  searchable = false,
  placeholder = "Selecciona...",
  emptyMessage = "No se encontraron resultados",
}: GenericMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const validKeys = useMemo(() => items.map(item => getKey(item)), [items, getKey]);

  useEffect(() => {
    const invalidSelections = value.filter(v => !validKeys.includes(v));

    if (invalidSelections.length > 0) {
      const validSelections = value.filter(v => validKeys.includes(v));
      onChange(validSelections);
    }
  }, [items, value, validKeys, onChange]);

  const toggleItem = useCallback((id: string) => {
    const newValue = value.includes(id)
      ? value.filter(v => v !== id)
      : [...value, id];
    onChange(newValue);
  }, [value, onChange]);

  const removeItem = useCallback((id: string) => {
    onChange(value.filter(v => v !== id));
  }, [value, onChange]);

  const selectedItems = useMemo(
    () => items.filter(item => value.includes(getKey(item))),
    [items, value, getKey]
  );

  const filteredItems = useMemo(() => {
    if (!searchable) return items;

    return items.filter(item => {
      const searchText = getSearchText
        ? getSearchText(item)
        : String(getLabel(item));
      return searchText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchable, items, searchTerm, getSearchText, getLabel]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedItems.length === 0
                ? placeholder
                : `${selectedItems.length} seleccionado(s)`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className=" w-[var(--radix-popover-trigger-width)] p-0 max-h-800 border-gray-200" align="start">
          <Command shouldFilter={false}>
            {searchable && (
              <CommandInput
                placeholder="Buscar..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
            )}
            <CommandList className="max-h-[240px] overflow-y-auto inline-flex">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => {
                  const key = getKey(item);
                  return (
                    <CommandItem
                      key={key}
                      value={key}
                      onSelect={() => toggleItem(key)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value.includes(key) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {getLabel(item)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
        {selectedItems.length > 0 && (
        <div className="relative max-h-32 overflow-y-auto rounded-md p-1 bg-background">
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => {
              const key = getKey(item);
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 gap-1 flex items-start"
                >
                  <div className="max-w-[214px]">{getLabel(item)}</div>
                  {!disabled && (
                    <button
                      type="button"
                      aria-label="Quitar selección"
                      onClick={() => removeItem(key)}
                      className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
      </Popover>

      
    </div>
  );
}