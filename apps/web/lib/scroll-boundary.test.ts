import assert from "node:assert/strict";
import test from "node:test";
import {
  hasScrollableOverflow,
  isScrollAtBottom,
  isScrollAtTop,
  shouldHandoffScroll,
} from "./scroll-boundary";

test("detects the top boundary with a small tolerance", () => {
  assert.equal(isScrollAtTop({ scrollTop: 0.5 }), true);
  assert.equal(isScrollAtTop({ scrollTop: 2 }), false);
});

test("detects the bottom boundary with a small tolerance", () => {
  assert.equal(
    isScrollAtBottom({
      scrollTop: 399.5,
      clientHeight: 400,
      scrollHeight: 800,
    }),
    true,
  );
  assert.equal(
    isScrollAtBottom({
      scrollTop: 398,
      clientHeight: 400,
      scrollHeight: 800,
    }),
    false,
  );
});

test("recognizes when the container still has internal overflow", () => {
  assert.equal(
    hasScrollableOverflow({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 800,
    }),
    true,
  );
  assert.equal(
    hasScrollableOverflow({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 400.5,
    }),
    false,
  );
});

test("only hands off upward scroll at the top boundary", () => {
  const metrics = {
    scrollTop: 0,
    clientHeight: 400,
    scrollHeight: 900,
  };

  assert.equal(shouldHandoffScroll(metrics, -32), true);
  assert.equal(shouldHandoffScroll(metrics, 32), false);
});

test("only hands off downward scroll at the bottom boundary", () => {
  const metrics = {
    scrollTop: 500,
    clientHeight: 400,
    scrollHeight: 900,
  };

  assert.equal(shouldHandoffScroll(metrics, 24), true);
  assert.equal(shouldHandoffScroll(metrics, -24), false);
});

test("hands off immediately when the container cannot scroll internally", () => {
  const metrics = {
    scrollTop: 0,
    clientHeight: 400,
    scrollHeight: 400,
  };

  assert.equal(shouldHandoffScroll(metrics, 18), true);
  assert.equal(shouldHandoffScroll(metrics, -18), true);
});
