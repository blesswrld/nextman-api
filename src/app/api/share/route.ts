import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const requestData = await request.json();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("shared_requests")
        .insert({
            request_data: requestData,
            user_id: user.id,
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
