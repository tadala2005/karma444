import {
  NextResponse
} from "next/server";

import {
  validWebhookSignature,
  reconcileOrder
} from "@/lib/paychangu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const size =
    Number(req.headers.get("content-length"));

  if (
    Number.isFinite(size) &&
    size > 100000
  ) {
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413 }
    );
  }

  let raw: string;

  try {
    raw = await req.text();
  } catch {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  if (raw.length > 100000) {
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413 }
    );
  }

  if (
    !validWebhookSignature(
      raw,
      req.headers.get("signature")
    )
  ) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  let payload: any;

  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const reference =
    payload?.tx_ref ||
    payload?.data?.tx_ref ||
    payload?.data?.data?.tx_ref;

  if (
    typeof reference !== "string" ||
    !/^KARMA-[a-f0-9-]{36}$/i.test(
      reference
    )
  ) {
    // Valid signed event, but not
    // a Karma checkout reference.
    return NextResponse.json({
      ok: true
    });
  }

  try {
    // The signed webhook is only
    // a notification. Actual payment
    // is verified with PayChangu.
    await reconcileOrder(reference);

    return NextResponse.json({
      ok: true
    });

  } catch (error) {
    console.error(
      "[KARMA] Webhook reconciliation failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Payment reconciliation unavailable"
      },
      { status: 503 }
    );
  }
}
