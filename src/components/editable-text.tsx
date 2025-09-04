"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface EditableTextProps {
    initialValue: string;
    onSave: (newValue: string) => void;
    className?: string;
    inputClassName?: string;
    onEditStart?: () => void;
    onEditEnd?: () => void;
}

export function EditableText({
    initialValue,
    onSave,
    className,
    inputClassName,
    onEditStart, // <-- Получаем коллбэк
    onEditEnd, // <-- Получаем коллбэк
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

    const handleStartEditing = () => {
        setIsEditing(true);
        onEditStart?.(); // <-- Вызываем коллбэк при начале редактирования
    };

    const handleSave = () => {
        setIsEditing(false);
        onEditEnd?.(); // <-- Вызываем коллбэк при завершении редактирования
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
            onEditEnd?.(); // <-- Вызываем коллбэк и здесь
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
                // Останавливаем всплытие события, чтобы клик не закрыл аккордеон
                onClick={(e) => e.stopPropagation()}
            />
        );
    }

    return (
        // Используем новую функцию для начала редактирования
        <span onDoubleClick={handleStartEditing} className={className}>
            {initialValue}
        </span>
    );
}
