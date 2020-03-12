import PouchDBClient from "../pouchdb.client";

test("pouchClient init", () => {
  const PouchClient = new PouchDBClient();
  expect(PouchClient.db.name.includes("moons_db")).toEqual(true);
});
