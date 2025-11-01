import {
	type Document,
	type Model,
	model,
	models,
	Schema,
	Types,
} from "mongoose";

import { Event } from "./event.model";

export interface BookingDocument extends Document {
	eventId: Types.ObjectId;
	email: string;
	createdAt: Date;
	updatedAt: Date;
}

export type BookingModel = Model<BookingDocument>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<BookingDocument>(
	{
		eventId: {
			type: Schema.Types.ObjectId,
			ref: "Event",
			required: [true, "Event reference is required"],
			index: true,
			validate: {
				validator: (value: unknown) =>
					Types.ObjectId.isValid(value as Types.ObjectId),
				message: "Invalid event reference",
			},
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			trim: true,
			lowercase: true,
			validate: {
				validator: (value: string) => emailPattern.test(value),
				message: "Email must be valid",
			},
		},
	},
	{
		timestamps: true,
		strict: true,
	},
);

BookingSchema.index({ eventId: 1 });

BookingSchema.pre<BookingDocument>(
	"save",
	async function validateEventReference(next) {
		try {
			if (this.isModified("eventId") || this.isNew) {
				// Confirm the referenced event exists before saving a booking.
				const eventExists = await Event.exists({ _id: this.eventId });
				if (!eventExists) {
					throw new Error("Referenced event does not exist");
				}
			}

			next();
		} catch (error) {
			next(error as Error);
		}
	},
);

export const Booking =
	(models.Booking as BookingModel) ||
	model<BookingDocument, BookingModel>("Booking", BookingSchema);
