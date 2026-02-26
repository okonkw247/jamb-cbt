const DB_NAME = "jambQuestions";
const DB_VERSION = 1;
const STORE_NAME = "questions";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "subject" });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveQuestions = async (subject: string, questions: any[]) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ subject, questions, savedAt: Date.now() });
  } catch (err) {
    console.log("Cache save error:", err);
  }
};

export const getQuestions = async (subject: string): Promise<any[] | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const request = store.get(subject);
      request.onsuccess = () => resolve(request.result?.questions || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
};

export const getAllCachedSubjects = async (): Promise<string[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
};
