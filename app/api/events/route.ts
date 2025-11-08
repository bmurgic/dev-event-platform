import { v2 as cloudinary } from "cloudinary";
import { type NextRequest, NextResponse } from "next/server";
import { Event } from "@/database";
import connectDB from "@/lib/mongodb";

export async function POST(req: NextRequest) {
	try {
		await connectDB();

		const formData = await req.formData();

		let event;

		try {
			event = Object.fromEntries(formData.entries());
		} catch (e) {
			return NextResponse.json(
				{
					message: "Invalid JSON data format",
				},
				{ status: 400 },
			);
		}

		// Confirm the image is uploaded
		const file = formData.get("image") as File;
		if (!file) {
			return NextResponse.json(
				{
					message: "Image file is required",
				},
				{ status: 400 },
			);
		}

		// Convert the file into a buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload image to Cloudinary
		const uploadResult = await new Promise((resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{ resource_type: "image", asset_folder: "DevEvent" },
					(error, results) => {
						if (error) return reject(error);
						resolve(results);
					},
				)
				.end(buffer);
		});

		const tags = JSON.parse(formData.get("tags") as string);
		const agenda = JSON.parse(formData.get("agenda") as string);
		const secureURL = (uploadResult as { secure_url: string }).secure_url;

		const createdEvent = await Event.create({
			...event,
			image: secureURL,
			tags: tags,
			agenda: agenda,
		});

		return NextResponse.json(
			{
				message: "Event created successfully",
				event: createdEvent,
			},
			{ status: 201 },
		);
	} catch (e) {
		console.error(e);
		return NextResponse.json(
			{
				message: "Event creation failed",
				error: e instanceof Error ? e.message : "Unknown",
			},
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		await connectDB();

		const events = await Event.find().sort({ createdAt: -1 }); // From newest to oldest

		return NextResponse.json(
			{ message: "Events fetched successfully", events },
			{ status: 200 },
		);
	} catch (e) {
		console.error(e);
		return NextResponse.json(
			{
				message: "Event fetching failed",
				error: e instanceof Error ? e.message : "Unknown",
			},
			{ status: 500 },
		);
	}
}
