"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface EditableTextProps {
    initialValue: string;
    onSave: (newValue: string) => void;
    className?: string;
    inputClassName?: string;
}

export function EditableText({
    initialValue,
    onSave,
    className,
    inputClassName,
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (value.trim() && value.trim() !== initialValue) {
            onSave(value.trim());
        } else {
            setValue(initialValue); // Сбрасываем, если пусто или не изменилось
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setValue(initialValue);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={inputClassName || "h-7 text-sm"}
            />
        );
    }

    return (
        <span onDoubleClick={() => setIsEditing(true)} className={className}>
            {initialValue}
        </span>
    );
}
