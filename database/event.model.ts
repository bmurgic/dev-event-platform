import { type Document, type Model, model, models, Schema } from "mongoose";

export interface IEvent extends Document {
	title: string;
	slug: string;
	description: string;
	overview: string;
	image: string;
	venue: string;
	location: string;
	date: string;
	time: string;
	mode: string;
	audience: string;
	agenda: string[];
	organizer: string;
	tags: string[];
	createdAt: Date;
	updatedAt: Date;
}

export type EventModel = Model<IEvent>;

const nonEmptyString = (value: string): boolean => value.trim().length > 0;

const createSlug = (input: string): string => {
	const slug = input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	if (!slug) {
		throw new Error("Event title cannot produce a valid slug");
	}

	return slug;
};

const normalizeDate = (value: string): string => {
	const normalized = new Date(value);
	if (Number.isNaN(normalized.getTime())) {
		throw new Error("Invalid event date");
	}

	return normalized.toISOString().split("T")[0];
};

const normalizeTime = (value: string): string => {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new Error("Event time is required");
	}

	const twentyFourHourMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
	if (twentyFourHourMatch) {
		const [, hours, minutes] = twentyFourHourMatch;
		return `${hours.padStart(2, "0")}:${minutes}`;
	}

	const twelveHourMatch = trimmed.match(/^(\d{1,2}):([0-5]\d)\s?(AM|PM)$/i);
	if (twelveHourMatch) {
		let hours = parseInt(twelveHourMatch[1], 10);
		const minutes = twelveHourMatch[2];
		const period = twelveHourMatch[3].toUpperCase();

		if (hours === 12) {
			hours = 0;
		}

		if (period === "PM") {
			hours += 12;
		}

		return `${hours.toString().padStart(2, "0")}:${minutes}`;
	}

	throw new Error("Invalid event time");
};

const EventSchema = new Schema<IEvent>(
	{
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Title cannot be empty",
			},
		},
		slug: {
			type: String,
			unique: true,
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Slug cannot be empty",
			},
		},
		description: {
			type: String,
			required: [true, "Description is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Description cannot be empty",
			},
			maxLength: [1000, "Over cannot exceed 1000 characters"],
		},
		overview: {
			type: String,
			required: [true, "Overview is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Overview cannot be empty",
			},
			maxLength: [500, "Over cannot exceed 500 characters"],
		},
		image: {
			type: String,
			required: [true, "Image URL is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Image cannot be empty",
			},
		},
		venue: {
			type: String,
			required: [true, "Venue is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Venue cannot be empty",
			},
		},
		location: {
			type: String,
			required: [true, "Location is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Location cannot be empty",
			},
		},
		date: {
			type: String,
			required: [true, "Date is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Date cannot be empty",
			},
		},
		time: {
			type: String,
			required: [true, "Time is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Time cannot be empty",
			},
		},
		mode: {
			type: String,
			required: [true, "Mode is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Mode cannot be empty",
			},
			enum: {
				values: ["online", "offline", "hybrid"],
				message: "Mode must either online, offline, or hybrid.",
			},
		},
		audience: {
			type: String,
			required: [true, "Audience is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Audience cannot be empty",
			},
		},
		agenda: {
			type: [String],
			required: [true, "Agenda is required"],
			validate: {
				validator: (items: string[]) =>
					Array.isArray(items) &&
					items.length > 0 &&
					items.every(nonEmptyString),
				message: "Agenda must contain at least one item",
			},
		},
		organizer: {
			type: String,
			required: [true, "Organizer is required"],
			trim: true,
			validate: {
				validator: nonEmptyString,
				message: "Organizer cannot be empty",
			},
		},
		tags: {
			type: [String],
			required: [true, "Tags are required"],
			validate: {
				validator: (items: string[]) =>
					Array.isArray(items) &&
					items.length > 0 &&
					items.every(nonEmptyString),
				message: "Tags must contain at least one item",
			},
		},
	},
	{
		timestamps: true,
		strict: true,
	},
);

EventSchema.index({ slug: 1 }, { unique: true });

EventSchema.pre<IEvent>("save", function preSave(next) {
	try {
		if (this.isModified("title") || !this.slug) {
			// Normalize the slug whenever the title changes.
			this.slug = createSlug(this.title);
		}

		// Keep date and time in consistent, parseable formats.
		this.date = normalizeDate(this.date);
		this.time = normalizeTime(this.time);

		next();
	} catch (error) {
		next(error as Error);
	}
});

export const Event =
	(models.Event as EventModel) ||
	model<IEvent, EventModel>("Event", EventSchema);
