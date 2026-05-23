import { NextResponse } from "next/server";
import connectDB from "@/DB/connectDB";

export async function GET() {
  try {
    // Test MongoDB connection
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully",
    });
  } catch (error: any) {
    console.log("FULL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        fullError: JSON.stringify(error, null, 2),
      },
      {
        status: 500,
      }
    );
  }
}