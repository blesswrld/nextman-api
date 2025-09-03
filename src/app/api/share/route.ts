import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RequestTab } from "@/store/tabs";

export async function POST(request: Request) {
    // Указываем тип для requestData, чтобы TypeScript нам помогал
    const requestData: RequestTab = await request.json();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Проверяем, есть ли у запроса осмысленное имя.
    //    "Untitled Request" не считаем осмысленным.
    // 2. Если имени нет, создаем его из метода и URL.
    // 3. Если и URL пустой, даем запасное имя "Untitled Share".
    const meaningfulName =
        requestData.name && requestData.name !== "Untitled Request"
            ? requestData.name
            : `${requestData.method} ${requestData.url || ""}`.trim() ||
              "Untitled Share";

    const { data, error } = await supabase
        .from("shared_requests")
        .insert({
            request_data: requestData,
            user_id: user.id,
            name: meaningfulName, // <-- ИСПОЛЬЗУЕМ НАШЕ НОВОЕ ИМЯ
        })
        .select("id")
        .single();

    if (error) {
        console.error("Error creating shared request:", error);
        return NextResponse.json(
            { error: "Failed to share request" },
            { status: 500 }
        );
    }

    return NextResponse.json({ id: data.id });
}
