import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Country codes
const COUNTRY_CODES = [
  { code: "+1" },
  { code: "+91" },
  { code: "+65" },
  { code: "+84" },
  { code: "+61" },
] as const;

const DEFAULT_COUNTRY_CODE = "+1";

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  className?: string;
  error?: boolean;
}

/**
 * PhoneInput component with country code selector
 * Combines country code and phone number into a single value
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = "",
      onChange,
      countryCode: controlledCountryCode,
      onCountryCodeChange,
      className,
      error,
      placeholder = "1234567890",
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalCountryCode, setInternalCountryCode] =
      React.useState<string>(DEFAULT_COUNTRY_CODE);
    const [internalPhoneNumber, setInternalPhoneNumber] = React.useState<string>("");

    // Use controlled or uncontrolled country code
    const countryCode = controlledCountryCode ?? internalCountryCode;
    const setCountryCode = onCountryCodeChange ?? setInternalCountryCode;

    // Parse value to extract country code and phone number
    React.useEffect(() => {
      if (value) {
        // Remove any non-digit characters except the leading + for country code matching
        const cleanedValue = value.replace(/[^\d+]/g, "");

        // Check if value starts with any country code
        const matchedCode = COUNTRY_CODES.find((cc) => cleanedValue.startsWith(cc.code));
        if (matchedCode) {
          setCountryCode(matchedCode.code);
          // Extract phone number part (digits only, no decimals)
          const phonePart = cleanedValue.slice(matchedCode.code.length).replace(/\D/g, "");
          setInternalPhoneNumber(phonePart);
        } else {
          // If no country code found, assume default and use digits only
          const digitsOnly = cleanedValue.replace(/\D/g, "");
          setInternalPhoneNumber(digitsOnly);
        }
      } else {
        setInternalPhoneNumber("");
      }
    }, [value, setCountryCode]);

    // Combine country code and phone number when either changes
    const handlePhoneNumberChange = (phoneNumber: string) => {
      // Remove any non-digit characters (including decimals)
      const digitsOnly = phoneNumber.replace(/\D/g, "");
      setInternalPhoneNumber(digitsOnly);
      const fullNumber = digitsOnly.trim() ? `${countryCode}${digitsOnly.trim()}` : "";
      onChange?.(fullNumber);
    };

    const handleCountryCodeChange = (code: string) => {
      setCountryCode(code);
      const fullNumber = internalPhoneNumber.trim() ? `${code}${internalPhoneNumber.trim()}` : "";
      onChange?.(fullNumber);
    };

    return (
      <div className={cn("flex gap-2 w-full", className)}>
        <Select value={countryCode} onValueChange={handleCountryCodeChange} disabled={disabled}>
          <SelectTrigger className="w-[80px] sm:w-[90px] flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((cc) => (
              <SelectItem key={cc.code} value={cc.code}>
                {cc.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          type="tel"
          placeholder={placeholder}
          value={internalPhoneNumber}
          onChange={(e) => handlePhoneNumberChange(e.target.value)}
          disabled={disabled}
          className={cn(error && "border-destructive", "flex-1 min-w-0")}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { COUNTRY_CODES, DEFAULT_COUNTRY_CODE };
