"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useEnvironmentsStore } from "@/store/environments";

// Мы получаем тип пропсов напрямую из компонента Input
type InputProps = React.ComponentPropsWithoutRef<typeof Input>;

export function VariableInput(props: InputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { activeEnvironment } = useEnvironmentsStore();

    const variables =
        (activeEnvironment?.variables as Record<string, string>) || {};
    const variableKeys = Object.keys(variables);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.endsWith("{{")) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
        props.onChange?.(e);
    };

    const handleSuggestionClick = (key: string) => {
        const currentValue = (props.value as string) || "";
        const newValue = currentValue.slice(0, -2) + `{{${key}}}`;

        const event = {
            target: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>;
        props.onChange?.(event);
        setShowSuggestions(false);
    };

    return (
        <div className="relative w-full">
            <Input
                {...props}
                onChange={handleValueChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && variableKeys.length > 0 && (
                <div className="absolute z-50 w-full bg-popover border rounded-md shadow-lg mt-1">
                    <ul className="py-1">
                        {variableKeys.map((key) => (
                            <li
                                key={key}
                                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-accent"
                                onMouseDown={() => handleSuggestionClick(key)}
                            >
                                {key}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
