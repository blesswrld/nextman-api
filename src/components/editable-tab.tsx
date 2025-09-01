"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface EditableTabProps {
    initialName: string;
    onNameChange: (newName: string) => void;
}

export function EditableTab({ initialName, onNameChange }: EditableTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (name.trim() === "") {
            setName(initialName); // Возвращаем старое имя, если ввели пустое
        } else {
            onNameChange(name);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleBlur();
        }
        if (e.key === "Escape") {
            setName(initialName);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-6 text-xs ml-2 w-32"
            />
        );
    }

    return (
        <span onDoubleClick={() => setIsEditing(true)} className="text-xs ml-2">
            {initialName}
        </span>
    );
}
