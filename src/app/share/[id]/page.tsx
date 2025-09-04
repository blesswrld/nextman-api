import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
    ReadOnlyPage,
    ReadOnlyPageSkeleton,
} from "@/components/share/read-only-page";
import { Suspense } from "react";

interface SharePageProps {
    params: { id: string };
}

export default async function SharePage({ params }: SharePageProps) {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
        cookies: () => cookieStore,
    });

    // Запрашиваем не только request_data, но и name
    const { data, error } = await supabase
        .from("shared_requests")
        .select("request_data, name")
        .eq("id", params.id)
        .single();

    if (error || !data) {
        notFound();
    }

    // Теперь у нас есть и данные запроса, и его "умное" имя
    const requestTab = data.request_data as any;
    const shareName = data.name;

    // Передаем оба значения в компонент
    return (
        <Suspense fallback={<ReadOnlyPageSkeleton />}>
            <ReadOnlyPage requestTab={requestTab} shareName={shareName} />
        </Suspense>
    );
}
