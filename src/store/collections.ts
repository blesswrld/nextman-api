"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

// Типы, импортированные из сгенерированного файла
type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type SavedRequest = Database["public"]["Tables"]["requests"]["Row"];

// Расширенный тип для удобства работы в UI
export type CollectionWithRequests = Collection & {
    requests: SavedRequest[];
};

interface CollectionsState {
    collections: CollectionWithRequests[];
    loading: boolean;
    fetchCollections: () => Promise<void>;
    createCollection: (name: string) => Promise<void>;
    saveRequest: (
        collectionId: string,
        requestData: Omit<
            SavedRequest,
            "id" | "created_at" | "collection_id" | "user_id"
        >
    ) => Promise<void>;
    deleteCollection: (collectionId: string) => Promise<void>;
    deleteRequest: (requestId: string) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
    collections: [],
    loading: true,

    fetchCollections: async () => {
        set({ loading: true });
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            set({ collections: [], loading: false });
            return;
        }

        const { data: collections, error: collectionsError } = await supabase
            .from("collections")
            .select(`*, requests!inner(*)`)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        if (collectionsError) {
            console.error("Error fetching collections:", collectionsError);
            set({ collections: [], loading: false });
            return;
        }

        set({
            collections: collections as CollectionWithRequests[],
            loading: false,
        });
    },

    createCollection: async (name) => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("collections")
            // @ts-ignore
            .insert({ name, user_id: user.id })
            .select("*, requests(*)")
            .single();

        if (error) {
            console.error("Error creating collection:", error);
            return;
        }

        if (data) {
            set((state) => ({
                collections: [
                    ...state.collections,
                    data as CollectionWithRequests,
                ],
            }));
        }
    },

    saveRequest: async (collectionId, requestData) => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("requests")
            // @ts-ignore
            .insert({
                ...requestData,
                collection_id: collectionId,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Error saving request:", error);
            return;
        }

        if (data) {
            // Обновляем состояние, чтобы новый запрос появился в UI
            get().fetchCollections();
        }
    },

    deleteCollection: async (collectionId) => {
        const supabase = createClient();
        const { error } = await supabase
            .from("collections")
            .delete()
            .eq("id", collectionId);

        if (error) {
            console.error("Error deleting collection:", error);
            return;
        }

        // Обновляем состояние локально для мгновенного отклика UI
        set((state) => ({
            collections: state.collections.filter((c) => c.id !== collectionId),
        }));
    },

    deleteRequest: async (requestId) => {
        const supabase = createClient();
        const { error } = await supabase
            .from("requests")
            .delete()
            .eq("id", requestId);

        if (error) {
            console.error("Error deleting request:", error);
            return;
        }

        // Обновляем состояние локально
        set((state) => ({
            collections: state.collections.map((c) => ({
                ...c,
                requests: c.requests.filter((r) => r.id !== requestId),
            })),
        }));
    },
}));
