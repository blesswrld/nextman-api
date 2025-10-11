import { openDB, DBSchema, IDBPDatabase } from "idb";

const DB_NAME = "nextman-api-history";
const STORE_NAME = "requests";
const MAX_HISTORY_ITEMS = 100;
export interface HistoryItem {
    id: string;
    url: string;
    method: string;
    name: string;
    timestamp: number;
}

interface HistoryDB extends DBSchema {
    [STORE_NAME]: {
        key: string;
        value: HistoryItem;
        indexes: { "by-timestamp": number };
    };
}

let dbPromise: Promise<IDBPDatabase<HistoryDB>> | null = null;

function getDb() {
    if (!dbPromise) {
        dbPromise = openDB<HistoryDB>(DB_NAME, 1, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                });
                store.createIndex("by-timestamp", "timestamp");
            },
        });
    }
    return dbPromise;
}

export async function addHistoryItem(
    item: Omit<HistoryItem, "id" | "timestamp">
) {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const allItems = await store.getAll();
    const existingItem = allItems.find(
        (historyItem) =>
            historyItem.method === item.method && historyItem.url === item.url
    );

    if (existingItem) {
        await store.delete(existingItem.id);
    }

    const newItem: HistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };

    await store.put(newItem);

    const count = await store.count();
    if (count > MAX_HISTORY_ITEMS) {
        const cursor = await store.index("by-timestamp").openCursor();
        if (cursor) {
            await store.delete(cursor.primaryKey);
        }
    }

    await tx.done;
}

export async function getHistory(): Promise<HistoryItem[]> {
    const db = await getDb();
    return db
        .getAllFromIndex(STORE_NAME, "by-timestamp")
        .then((items) => items.reverse());
}

export async function clearHistory() {
    const db = await getDb();
    await db.clear(STORE_NAME);
}
