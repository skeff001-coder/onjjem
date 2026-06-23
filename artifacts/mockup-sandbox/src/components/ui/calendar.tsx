<<<<<<< HEAD
"use client"

import * as React from "react"
=======
"use client";

import * as React from "react";
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
<<<<<<< HEAD
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
=======
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
<<<<<<< HEAD
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()
=======
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
<<<<<<< HEAD
        className
=======
        className,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
<<<<<<< HEAD
          defaultClassNames.months
=======
          defaultClassNames.months,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
<<<<<<< HEAD
          defaultClassNames.nav
=======
          defaultClassNames.nav,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
<<<<<<< HEAD
          defaultClassNames.button_previous
=======
          defaultClassNames.button_previous,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
<<<<<<< HEAD
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown
=======
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
<<<<<<< HEAD
          defaultClassNames.caption_label
=======
          defaultClassNames.caption_label,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
<<<<<<< HEAD
          defaultClassNames.weekday
=======
          defaultClassNames.weekday,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
<<<<<<< HEAD
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-accent rounded-l-md",
          defaultClassNames.range_start
=======
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day,
        ),
        range_start: cn(
          "bg-accent rounded-l-md",
          defaultClassNames.range_start,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
<<<<<<< HEAD
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
=======
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
<<<<<<< HEAD
              {...props}
            />
          )
=======
              {...(props as any)}
            />
          );
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
<<<<<<< HEAD
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
=======
              <ChevronLeftIcon
                className={cn("size-4", className)}
                {...(props as any)}
              />
            );
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
<<<<<<< HEAD
                {...props}
              />
            )
=======
                {...(props as any)}
              />
            );
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
<<<<<<< HEAD
          )
=======
          );
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
<<<<<<< HEAD
          )
=======
          );
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
        },
        ...components,
      }}
      {...props}
    />
<<<<<<< HEAD
  )
=======
  );
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
<<<<<<< HEAD
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
=======
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
<<<<<<< HEAD
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
=======
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
