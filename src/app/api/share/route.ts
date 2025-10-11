import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RequestTab } from "@/store/tabs";

export async function POST(request: Request) {
    const requestData: RequestTab = await request.json();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
            name: meaningfulName,
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
