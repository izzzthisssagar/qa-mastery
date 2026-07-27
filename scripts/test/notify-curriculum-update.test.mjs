import test from "node:test";
import assert from "node:assert/strict";

import { notifyCurriculumUpdate } from "../notify-curriculum-update.mjs";

test("fails closed when url is missing", async () => {
  await assert.rejects(() => notifyCurriculumUpdate({ secret: "s3cret" }), /must both be set/);
});

test("fails closed when secret is missing", async () => {
  await assert.rejects(
    () => notifyCurriculumUpdate({ url: "http://platform.test/api/revalidate-curriculum" }),
    /must both be set/,
  );
});

test("fails closed when both url and secret are missing", async () => {
  await assert.rejects(() => notifyCurriculumUpdate({}), /must both be set/);
});

test("throws when the endpoint responds non-ok", async () => {
  const fetchImpl = async () => new Response("nope", { status: 401, statusText: "Unauthorized" });
  await assert.rejects(
    () =>
      notifyCurriculumUpdate({
        url: "http://platform.test/api/revalidate-curriculum",
        secret: "s3cret",
        fetchImpl,
      }),
    /401/,
  );
});

test("posts a bearer-authorized request and resolves on success", async () => {
  let calledWith = null;
  const fetchImpl = async (url, init) => {
    calledWith = { url, init };
    return new Response(null, { status: 200 });
  };

  await notifyCurriculumUpdate({
    url: "http://platform.test/api/revalidate-curriculum",
    secret: "s3cret",
    fetchImpl,
  });

  assert.equal(calledWith.url, "http://platform.test/api/revalidate-curriculum");
  assert.equal(calledWith.init.method, "POST");
  assert.equal(calledWith.init.headers.authorization, "Bearer s3cret");
});
