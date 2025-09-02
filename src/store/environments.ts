"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

type Environment = Database["public"]["Tables"]["environments"]["Row"];

interface EnvironmentsState {
    environments: Environment[];
    activeEnvironment: Environment | null;
    loading: boolean;
    fetchEnvironments: () => Promise<void>;
    setActiveEnvironment: (id: string | null) => void;
    createEnvironment: (name: string) => Promise<void>;
    updateEnvironment: (
        id: string,
        variables: Record<string, string>
    ) => Promise<void>;
    deleteEnvironment: (id: string) => Promise<void>;
}

export const useEnvironmentsStore = create<EnvironmentsState>((set, get) => ({
    environments: [],
    activeEnvironment: null,
    loading: true,

    fetchEnvironments: async () => {
        set({ loading: true });
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            set({ environments: [], activeEnvironment: null, loading: false });
            return;
        }

        const { data, error } = await supabase
            .from("environments")
            .select("*")
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching environments", error);
            set({ environments: [], loading: false });
            return;
        }

        set({ environments: data, loading: false });
    },

    setActiveEnvironment: (id) => {
        if (!id) {
            set({ activeEnvironment: null });
            return;
        }
        const activeEnv = get().environments.find((env) => env.id === id);
        set({ activeEnvironment: activeEnv || null });
    },

    createEnvironment: async (name) => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: newEnv, error } = await supabase
            .from("environments")
            // @ts-ignore
            .insert({ name, user_id: user.id }) // Передаем только то, что нужно
            .select()
            .single();

        if (error) {
            console.error("Error creating environment:", error);
            return;
        }

        if (newEnv) {
            set((state) => ({ environments: [...state.environments, newEnv] }));
        }
    },

    updateEnvironment: async (id, variables) => {
        const supabase = createClient();
        const { data: updatedEnv, error } = await supabase
            .from("environments")
            // @ts-ignore
            .update({ variables }) // Просто передаем объект, supabase-js сам справится с JSON
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating environment:", error);
            return;
        }

        if (updatedEnv) {
            set((state) => ({
                environments: state.environments.map((env) =>
                    env.id === id ? updatedEnv : env
                ),
                activeEnvironment:
                    state.activeEnvironment?.id === id
                        ? updatedEnv
                        : state.activeEnvironment,
            }));
        }
    },

    deleteEnvironment: async (id) => {
        const supabase = createClient();
        const { error } = await supabase
            .from("environments")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting environment:", error);
            return;
        }

        set((state) => ({
            environments: state.environments.filter((env) => env.id !== id),
            // Сбрасываем активное окружение, если оно было удалено
            activeEnvironment:
                state.activeEnvironment?.id === id
                    ? null
                    : state.activeEnvironment,
        }));
    },
}));
