interface ResponseHeadersProps {
    headers: Record<string, string>;
}

export function ResponseHeaders({ headers }: ResponseHeadersProps) {
    return (
        <div className="font-mono text-sm space-y-2">
            {Object.entries(headers).map(([key, value]) => (
                <div key={key} className="flex">
                    <span className="font-semibold w-1/3 break-all">
                        {key}:
                    </span>
                    <span className="w-2/3 break-all text-muted-foreground">
                        {value}
                    </span>
                </div>
            ))}
        </div>
    );
}
