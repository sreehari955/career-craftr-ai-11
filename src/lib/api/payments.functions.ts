import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => {
  const id = process.env.RAZORPAY_KEY_ID ?? "";
  return { keyId: id };
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        plan: z.string().min(1).max(60),
        amount_paise: z.number().int().min(100).max(100_000_00),
        currency: z.string().min(3).max(3).optional().default("INR"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured");

    const Razorpay = (await import("razorpay")).default;
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await rzp.orders.create({
      amount: data.amount_paise,
      currency: data.currency,
      receipt: `jt_${Date.now()}`,
      notes: { user_id: context.userId, plan: data.plan },
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      razorpay_order_id: order.id,
      amount_paise: data.amount_paise,
      currency: data.currency,
      plan: data.plan,
      status: "created",
    });

    return { orderId: order.id, amount: data.amount_paise, currency: data.currency, keyId };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        razorpay_order_id: z.string().min(1).max(120),
        razorpay_payment_id: z.string().min(1).max(120),
        razorpay_signature: z.string().min(1).max(256),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");

    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpay_signature);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    if (!ok) throw new Error("Invalid payment signature");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .update({
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        status: "paid",
      })
      .eq("razorpay_order_id", data.razorpay_order_id)
      .eq("user_id", context.userId)
      .select("plan")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!payment) throw new Error("Order not found");

    await supabaseAdmin.from("profiles").update({ is_premium: true }).eq("id", context.userId);
    return { ok: true, plan: payment.plan };
  });
