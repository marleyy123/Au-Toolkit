import { test } from "@playwright/test";

test("iOS Safari Google Login", async ({ page }) => {
  page.on("console", (msg) => {
    console.log("[BROWSER]", msg.type(), msg.text());
  });

  page.on("pageerror", (error) => {
    console.log("[PAGE ERROR]", error.message);
  });

  page.on("request", (request) => {
    if (
      request.url().includes("auth") ||
      request.url().includes("google") ||
      request.url().includes("ios-auth-debug")
    ) {
      console.log("[REQUEST]", request.method(), request.url());
    }
  });

  page.on("response", (response) => {
    if (
      response.url().includes("ios-auth-debug") ||
      response.url().includes("__/auth/handler")
    ) {
      console.log("[RESPONSE]", response.status(), response.url());
    }
  });

  page.on("response", async (response) => {
    if (response.url().includes("/api/ios-auth-debug")) {
      console.log("[DEBUG API STATUS]", response.status());

      try {
        console.log("[DEBUG API BODY]", await response.text());
      } catch {
        console.log("[DEBUG API BODY] Cannot read");
      }
    }
  });

  await page.goto("/");

  console.log("[INITIAL URL]", page.url());

  // Ganti selector ini sesuai tombol login sebenarnya.
  await page
    .getByRole("button", {
      name: /google/i,
    })
    .click();

  await page.waitForTimeout(15000);

  console.log("[FINAL URL]", page.url());

  await page.screenshot({
    path: "tests/ios/login-result.png",
    fullPage: true,
  });
});
