import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
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
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "No token" }, { status: 400 });
    const db = getDatabase();
    await db.ref(`fcmTokens/${token.slice(-20)}`).set({
      token,
      savedAt: Date.now(),
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
