import { Suspense } from "react";
import EventDetails from "@/components/EventDetails";

export default async function EventDetailsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const slug = params.then((param) => param.slug);

	return (
		<main>
			<Suspense fallback={<div>Loading...</div>}>
				<EventDetails params={slug} />
			</Suspense>
		</main>
	);
}
