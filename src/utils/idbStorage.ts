import { get, set, del } from 'idb-keyval';

export async function saveFileToIDB(id: string, fileBlob: Blob | File | string): Promise<void> {
  if (!fileBlob) return;
  try {
    const blobToStore: Blob = fileBlob instanceof Blob ? fileBlob : new Blob([fileBlob]);
    console.log("-> Début sauvegarde IndexedDB", blobToStore);
    await set(`file_${id}`, blobToStore);
    console.log("-> Fin sauvegarde réussie");
  } catch (err: any) {
    console.error(`[IndexedDB] Error saving file for ID ${id}:`, err);
    alert("Erreur IndexedDB : " + (err?.message || err));
    throw err;
  }
}

export async function testIndexedDB(): Promise<boolean> {
  try {
    const testKey = 'min_test_probe_' + Date.now();
    const testBlob = new Blob(['test-data'], { type: 'text/plain' });
    console.log("-> Début sauvegarde IndexedDB", testBlob);
    await set(testKey, testBlob);
    console.log("-> Fin sauvegarde réussie");
    const retrieved = await get(testKey);
    await del(testKey);
    if (retrieved) {
      alert("Test IndexedDB réussi ! Le stockage binaire est pleinement opérationnel.");
      return true;
    } else {
      throw new Error("Impossible de relire la clé testée.");
    }
  } catch (err: any) {
    console.error("[IndexedDB] Test failed:", err);
    alert("Erreur IndexedDB : " + (err?.message || err));
    return false;
  }
}


export async function getFileFromIDB(id: string): Promise<string | undefined> {
  try {
    console.log(`[IndexedDB] Retrieving file for ID: ${id}`);
    let data = await get(`file_${id}`);
    if (!data) {
      data = await get(`min_file_${id}`);
    }
    if (data) {
      if (data instanceof Blob) {
        const url = URL.createObjectURL(data);
        console.log(`[IndexedDB] Successfully retrieved Blob for ID: ${id}, generated ObjectURL: ${url}`);
        return url;
      } else if (typeof data === 'string') {
        console.log(`[IndexedDB] Retrieved legacy string data for ID: ${id}`);
        return data;
      }
    }
    console.warn(`[IndexedDB] No file found in IDB for ID: ${id}`);
    return undefined;
  } catch (err) {
    console.error(`[IndexedDB] Error getting file for ID ${id}:`, err);
    return undefined;
  }
}

export async function removeFileFromIDB(id: string): Promise<void> {
  try {
    console.log(`[IndexedDB] Removing file for ID: ${id}`);
    await del(`file_${id}`);
    await del(`min_file_${id}`);
    console.log(`[IndexedDB] Successfully removed file for ID: ${id}`);
  } catch (err) {
    console.error(`[IndexedDB] Error removing file for ID ${id}:`, err);
  }
}
