// This file acts as a placeholder module to disable the Supabase client,
// allowing your local Flask backend to be used instead.

// --- PLACEHOLDER FOR SUPABASE CLIENT ---
// Define a dummy client structure to prevent other components from crashing.
const supabaseClient = {
    from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }) }) }) 
};

// Export the dummy client. We use the type assertion to satisfy TypeScript 
// for any component that expects a full SupabaseClient type.
// We disable the Eslint warning as this is a deliberate workaround.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = supabaseClient as any; 

// --- TYPE DEFINITIONS (THESE ARE SAFE TO KEEP) ---

export interface Article {
    id: string;
    title: string;
    source: string;
    posted_time: string;
    impact_level: 'low' | 'medium' | 'high';
    summary: string;
    full_content: string;
    created_at: string;
}

export interface Keyword {
    id: string;
    keyword: string;
    created_at: string;
}

export interface Todo {
    id: string;
    task: string;
    completed: boolean;
    reminder_days: number | null;
    created_at: string;
}