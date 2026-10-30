/** Unit tests for the crop box sizes (photo ratios step 4, same math as goutsyde.com). Run: npx tsx tests/crop-math.test.ts */
import { CROP_PRESETS, clampArea, outputSizeFor, ratioPair } from "../lib/crop/cropMath";

let passed = 0, failed = 0;
function eq(actual: unknown, expected: unknown, name: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { passed++; console.log(`  ok  ${name}`); } else { failed++; console.error(`  FAIL ${name}`, JSON.stringify(actual), "expected", JSON.stringify(expected)); }
}

console.log("presets: the decided shapes");
eq([CROP_PRESETS.service.aspect, CROP_PRESETS.service.shape, CROP_PRESETS.service.maxLong], [1, "rect", 1080], "service photo: 1:1 rect, 1080");
eq([CROP_PRESETS.cover.aspect, CROP_PRESETS.cover.shape, CROP_PRESETS.cover.maxLong], [16 / 9, "rect", 1920], "cover photo: 16:9 rect, 1920");
eq([CROP_PRESETS.stylist.aspect, CROP_PRESETS.stylist.shape, CROP_PRESETS.stylist.maxLong], [4 / 5, "rect", 1350], "stylist photo: 4:5 rect, 1350");
eq([CROP_PRESETS.gallery.aspect, CROP_PRESETS.gallery.shape, CROP_PRESETS.gallery.maxLong], [1, "rect", 1080], "gallery photo: 1:1 rect, 1080");
eq([CROP_PRESETS.profile.aspect, CROP_PRESETS.profile.shape, CROP_PRESETS.profile.maxLong], [1, "round", 512], "profile photo: 1:1 round, 512");

console.log("ratioPair");
eq(ratioPair(4 / 5), [4, 5], "4:5");
eq(ratioPair(16 / 9), [16, 9], "16:9");
eq(ratioPair(1), [1, 1], "1:1");
eq(ratioPair(Math.PI), null, "no simple pair");

console.log("outputSizeFor");
eq(outputSizeFor({ width: 2419.2, height: 3024 }, 4 / 5, 1350), { width: 1080, height: 1350 }, "big 4:5 crop: 1080 x 1350 (half pixel slack)");
eq(outputSizeFor({ width: 4032, height: 2268 }, 16 / 9, 1920), { width: 1920, height: 1080 }, "big 16:9 crop: 1920 x 1080");
eq(outputSizeFor({ width: 3024, height: 3024 }, 1, 1080), { width: 1080, height: 1080 }, "big square: 1080");
eq(outputSizeFor({ width: 3024, height: 3024 }, 1, 512), { width: 512, height: 512 }, "profile: 512");
eq(outputSizeFor({ width: 400, height: 500 }, 4 / 5, 1350), { width: 400, height: 500 }, "small crop: never upscaled");
eq(outputSizeFor({ width: 401, height: 501 }, 4 / 5, 1350), { width: 400, height: 500 }, "exact ratio kept");
eq(outputSizeFor({ width: 1, height: 1 }, 16 / 9, 1920), { width: 16, height: 9 }, "tiny crop: at least one unit");

console.log("clampArea");
eq(clampArea({ x: -3.2, y: 10.6, width: 500.4, height: 625.2 }, { width: 400, height: 2000 }), { x: 0, y: 11, width: 400, height: 625 }, "inside the photo, whole pixels");
eq(clampArea({ x: 390, y: 0, width: 50, height: 0.2 }, { width: 400, height: 300 }), { x: 390, y: 0, width: 10, height: 1 }, "at least 1 pixel");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
