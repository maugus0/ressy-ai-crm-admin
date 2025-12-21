import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getTimeFromDateTime } from "@/lib/utils/timezone";

interface DateTimePickerProps {
  value: string; // datetime-local format: YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  error,
  disabled,
  minDate,
  maxDate,
  className,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  // Parse the datetime-local value
  // value is in format YYYY-MM-DDTHH:mm
  const dateValue = value
    ? (() => {
        const [datePart] = value.split("T");
        if (!datePart) return undefined;
        const [year, month, day] = datePart.split("-").map(Number);
        return new Date(year, month - 1, day);
      })()
    : undefined;
  const timeValue = getTimeFromDateTime(value); // HH:mm format

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Format date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Combine with existing time or use current time
    const newValue = timeValue ? `${dateStr}T${timeValue}` : `${dateStr}T12:00`;
    onChange(newValue);
    setIsCalendarOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value; // HH:mm format
    if (!value) {
      // If no date selected, use today
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}T${time}`);
    } else {
      // Combine with existing date
      const datePart = value.split("T")[0];
      onChange(`${datePart}T${time}`);
    }
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 w-full">
        {/* Date Picker */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 min-w-0 justify-start text-left font-normal",
                !dateValue && "text-muted-foreground",
                error && "border-destructive"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {dateValue ? format(dateValue, "PPP") : "Pick a date"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              disabled={disabled}
              fromDate={minDate}
              toDate={maxDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Time Picker */}
        <div className="relative flex-shrink-0 w-[140px]">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled || !dateValue}
            className={cn("pl-9 w-full", error && "border-destructive")}
            placeholder="Time"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
