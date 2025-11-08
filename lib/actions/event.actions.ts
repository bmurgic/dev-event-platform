"use server";
import { Event } from "@/database";
import connectDB from "@/lib/mongodb";

export async function getSimilarEventsBySlug(slug: string) {
	try {
		await connectDB();

		const event = await Event.findOne({ slug });
		if (!event) {
			return [];
		}

		return await Event.find({
			_id: { $ne: event._id },
			tags: { $in: event.tags },
		}).lean();
	} catch (e) {
		return [];
	}
}
