export type MockFirestoreDoc<T = unknown> = {
  id: string;
  data: () => T;
};

export function makeFirestoreDoc(id: string, data: any): MockFirestoreDoc<any> {
  return {
    id,
    data: () => data,
  };
}

export function makeFirestoreSnapshot(docs: Array<MockFirestoreDoc<any>>) {
  return { docs } as any;
}