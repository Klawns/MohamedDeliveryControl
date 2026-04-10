import assert from "node:assert/strict";
import test from "node:test";
import {
  getInitialClientFormValues,
  hasClientFormName,
  toClientFormPayload,
} from "./client-form.mapper";

test("builds client form values with empty string fallbacks", () => {
  assert.deepEqual(getInitialClientFormValues(), {
    name: "",
    phone: "",
    address: "",
  });

  assert.deepEqual(
    getInitialClientFormValues({
      id: "client-1",
      name: "Maria",
      phone: null,
      address: "Rua A",
    }),
    {
      name: "Maria",
      phone: "",
      address: "Rua A",
    },
  );
});

test("normalizes the client form payload before persistence", () => {
  assert.equal(
    hasClientFormName({
      name: "   ",
      phone: "",
      address: "",
    }),
    false,
  );

  assert.deepEqual(
    toClientFormPayload({
      name: "  Maria  ",
      phone: "  ",
      address: " Rua B ",
    }),
    {
      name: "Maria",
      phone: null,
      address: "Rua B",
    },
  );
});
