/**
 * Verifies Google reCAPTCHA v3 token.
 * @param token - The token received from the frontend.
 * @returns boolean - true if verification succeeds, false otherwise.
 */
export const verifyCaptchaToken = async (token: string): Promise<boolean> => {
  try {
    console.log("[Captcha] Starting reCAPTCHA verification");

    if (!process.env.RECAPTCHA_SECRET_KEY) {
      console.error("[Captcha] RECAPTCHA_SECRET_KEY not set");
      throw new Error(
        "RECAPTCHA_SECRET_KEY is not set in environment variables."
      );
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    console.log("[Captcha] Using secret from environment");

    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    console.log(
      "[Captcha] Sending request to Google reCAPTCHA API with token:",
      token
    );

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params,
      }
    );
    const data = await response.json();

    console.log("[Captcha] reCAPTCHA API response:", data);

    if (data.success) {
      console.log("[Captcha] Verification success");
      if (data.score !== undefined) {
        console.log("[Captcha] reCAPTCHA v3 score:", data.score);
      }
    } else {
      console.warn(
        "[Captcha] Verification failed:",
        data["error-codes"] || "Unknown error"
      );
    }

    // For reCAPTCHA v3, consider score >= 0.5 as human
    const isHuman = data.success && data.score && data.score >= 0.5;
    console.log("[Captcha] Is human:", isHuman);

    return isHuman;
  } catch (error: any) {
    console.error(
      "[Captcha] Error during verification:",
      error.message,
      error.stack
    );
    return false;
  }
};
