import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ReadOnlyPage } from "@/components/read-only-page";

interface SharePageProps {
    params: { id: string };
}

export default async function SharePage({ params }: SharePageProps) {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
        cookies: () => cookieStore,
    });

    const { data, error } = await supabase
        .from("shared_requests")
        .select("request_data")
        .eq("id", params.id)
        .single();

    if (error || !data) {
        notFound(); // Показываем 404, если не найдено
    }

    const requestTab = data.request_data as any; // any, так как структура нам известна

    return <ReadOnlyPage requestTab={requestTab} />;
}
