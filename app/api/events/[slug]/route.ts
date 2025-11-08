import { type NextRequest, NextResponse } from "next/server";
import { Event } from "@/database";
import connectDB from "@/lib/mongodb";

type RouteParams = {
	params: Promise<{
		slug: string;
	}>;
};

// Must include the NextRequest to get the parameters
export async function GET(req: NextRequest, { params }: RouteParams) {
	try {
		const { slug } = await params;
		if (!slug || typeof slug !== "string" || slug.trim() === "") {
			return NextResponse.json(
				{ error: "Invalid or missing slug" },
				{ status: 400 },
			);
		}

		const sanitizedSlug = slug.trim().toLowerCase();

		await connectDB();

		const event = await Event.findOne({
			slug: sanitizedSlug,
		}).lean();

		if (!event) {
			return NextResponse.json({ error: "Event not found" }, { status: 404 });
		}

		return NextResponse.json(
			{ message: "Event fetched successfully", event },
			{ status: 200 },
		);
	} catch (e) {
		console.error(e);
		return NextResponse.json(
			{
				message: "Unable to fetch event",
				error: e instanceof Error ? e.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
