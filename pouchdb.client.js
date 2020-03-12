// PouchDB Client
// Defaults to local database: IndexedDB in most browsers,
// WebSQL in older browsers, and LevelDB in Node.js
// Supports remote approach: CouchDB, Cloudant, Couchbase,
// other PouchDB instances (or pouchdb-server) etc.

import PouchDB from "pouchdb";
import * as upsertPlugin from "pouchdb-upsert";
import * as settings from './config';
import findPlugin from "pouchdb-find";
import store from "./hover.store";

export default class PouchDBClient {
  replace(doc) {
    const newDoc = Object.assign(doc, this.upsertData);
    this.upsertData = {};
    return newDoc;
  }

  hydrate() {
    this.db.createIndex({
      index: {
        fields: ["type"],
      },
    }).then(() => this.db.find({
      selector: {
        type: { $eq: "user" },
      },
    }).then((users) => {
      store.setData("users", users);
    }).catch((err) => err)).catch((err) => err);
  }

  constructor() {
    PouchDB.plugin(upsertPlugin);
    PouchDB.plugin(findPlugin);
    this.db = new PouchDB(`${settings.service_cloudant_uri}/${settings.service_db_name}`, { auto_compaction: true });
    this.upsertData = {};
    this.hydrate();
  }

  query() {
    return this.db.allDocs({ include_docs: true });
  }

  get(id) {
    return this.db.get(id);
  }

  create(id, payload) {
    const doc = Object.assign(payload, { _id: id });
    return this.db.put(doc).then(() => {
      this.hydrate();
    }).catch((err) => err);
  }

  update(doc, payload) {
    const updated = Object.assign(doc, payload);
    return this.db.put(updated).then(() => {
      this.hydrate();
    }).catch((err) => err);
  }

  upsert(id, payload) {
    this.upsertData = payload;
    return this.db.upsert(id, this.replace.bind(this));
  }

  destroy(doc) {
    return this.db.remove(doc);
  }
}
