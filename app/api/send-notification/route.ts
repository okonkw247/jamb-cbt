import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getDatabase } from "firebase-admin/database";

const initAdmin = () => {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: "https://jamb-cbt-8fa5d-default-rtdb.firebaseio.com",
    });
  }
};

export async function POST(req: NextRequest) {
  try {
    initAdmin();
    const { version, changelog, size, adminKey } = await req.json();

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDatabase();
    const messaging = getMessaging();

    const snapshot = await db.ref("fcmTokens").get();
    const tokensData = snapshot.val() || {};
    const tokens = Object.values(tokensData).map((t: any) => t.token);

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No tokens saved yet" });
    }

    const message = {
      notification: {
        title: "🎉 JAMB CBT Update Available!",
        body: `Version ${version} is ready — ${changelog[0]}`,
      },
      data: {
        type: "update",
        version,
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message as any);

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
