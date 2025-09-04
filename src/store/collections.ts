"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

// --- ТИПЫ ---
type Collection = Database["public"]["Tables"]["collections"]["Row"];
type CollectionUpdate = Database["public"]["Tables"]["collections"]["Update"];
export type SavedRequest = Database["public"]["Tables"]["requests"]["Row"];
type RequestUpdate = Database["public"]["Tables"]["requests"]["Update"];

// Расширенный тип для удобства работы в UI, где у коллекции есть вложенные запросы
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
    // Используем общие имена функций для обновления
    updateCollection: (
        collectionId: string,
        updates: CollectionUpdate
    ) => Promise<void>;
    updateRequest: (requestId: string, updates: RequestUpdate) => Promise<void>;
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
        const { data: collections, error } = await supabase
            .from("collections")
            .select(`*, requests(*)`)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
        if (error) {
            console.error("Error fetching collections:", error);
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
            .select("*, requests(*)") // Получаем пустой массив requests
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
        // @ts-ignore
        const { error } = await supabase.from("requests").insert({
            ...requestData,
            collection_id: collectionId,
            user_id: user.id,
        });
        if (error) {
            console.error("Error saving request:", error);
            return;
        }
        // После сохранения просто перезагружаем все данные, чтобы UI был консистентным
        get().fetchCollections();
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

    updateCollection: async (collectionId, updates) => {
        const supabase = createClient();
        const { data: updatedCollection, error } = await supabase
            .from("collections")
            // @ts-ignore
            .update(updates)
            .eq("id", collectionId)
            .select("*, requests(*)") // Возвращаем с запросами для консистентности
            .single();
        if (error) {
            console.error("Error updating collection:", error);
            return;
        }
        if (updatedCollection) {
            set((state) => ({
                collections: state.collections.map((c) =>
                    c.id === collectionId
                        ? (updatedCollection as CollectionWithRequests)
                        : c
                ),
            }));
        }
    },

    updateRequest: async (requestId, updates) => {
        const supabase = createClient();
        const { data: updatedRequest, error } = await supabase
            .from("requests")
            // @ts-ignore
            .update(updates)
            .eq("id", requestId)
            .select()
            .single();
        if (error) {
            console.error("Error updating request name:", error);
            return;
        }
        if (updatedRequest) {
            set((state) => ({
                collections: state.collections.map((c) => ({
                    ...c,
                    requests: c.requests.map((r) =>
                        r.id === requestId ? updatedRequest : r
                    ),
                })),
            }));
        }
    },
}));
