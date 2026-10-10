import { Injectable } from '@angular/core';
import {
  collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where, writeBatch,
  CollectionReference, DocumentData, DocumentReference, DocumentSnapshot, OrderByDirection, Query, QueryConstraint,
  QuerySnapshot, SetOptions, WhereFilterOp, WriteBatch,
} from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { db } from './firebase';

export class DocSnap {
  constructor(private snap: DocumentSnapshot<DocumentData>) {}
  get id() { return this.snap.id; }
  get ref() { return this.snap.ref; }
  get exists() { return this.snap.exists(); }
  data(): any { return this.snap.data(); }
  get(field: string): any { return this.snap.get(field); }
}

export class QuerySnap {
  readonly docs: DocSnap[];
  constructor(snap: QuerySnapshot<DocumentData>) {
    this.docs = snap.docs.map((d) => new DocSnap(d));
  }
  get size() { return this.docs.length; }
  get empty() { return this.docs.length === 0; }
  forEach(fn: (doc: DocSnap) => void) { this.docs.forEach(fn); }
}

export class QueryBuilder {
  readonly constraints: QueryConstraint[] = [];
  where(field: string, op: WhereFilterOp, value: unknown) { this.constraints.push(where(field, op, value)); return this; }
  orderBy(field: string, dir: OrderByDirection = 'asc') { this.constraints.push(orderBy(field, dir)); return this; }
  limit(n: number) { this.constraints.push(limit(n)); return this; }
}

export class DocRef {
  constructor(readonly ref: DocumentReference<DocumentData>) {}
  get(): Observable<DocSnap> { return from(getDoc(this.ref).then((s) => new DocSnap(s))); }
  set(data: any, options?: SetOptions): Promise<void> { return options ? setDoc(this.ref, data, options) : setDoc(this.ref, data); }
  update(data: any): Promise<void> { return updateDoc(this.ref, data); }
  delete(): Promise<void> { return deleteDoc(this.ref); }
}

export class CollectionRef {
  constructor(private q: Query<DocumentData>) {}
  get(): Observable<QuerySnap> { return from(getDocs(this.q).then((s) => new QuerySnap(s))); }
}

// 旧 AngularFirestore と同じ呼び出し形を modular SDK の上で提供する薄いラッパー
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  doc(path: string): DocRef {
    return new DocRef(doc(db, path));
  }

  collection(path: string, fn?: (q: QueryBuilder) => QueryBuilder): CollectionRef {
    const col: CollectionReference<DocumentData> = collection(db, path);
    if (!fn) return new CollectionRef(col);
    return new CollectionRef(query(col, ...fn(new QueryBuilder()).constraints));
  }

  collectionGroup(id: string): CollectionRef {
    return new CollectionRef(collectionGroup(db, id));
  }

  createId(): string {
    return doc(collection(db, '_')).id;
  }

  get firestore(): { batch: () => WriteBatch } {
    return { batch: () => writeBatch(db) };
  }
}
