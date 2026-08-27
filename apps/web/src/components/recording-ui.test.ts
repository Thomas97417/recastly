import { expect, test } from "bun:test";

import { formatDuration } from "./recording-ui";

test("formats recording part durations", () => {
  expect(formatDuration(90 * 60)).toBe("1 h 30");
  expect(formatDuration(25 * 60)).toBe("25 min");
  expect(formatDuration()).toBe("—");
});
