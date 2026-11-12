import type { Loader } from 'astro/loaders';
import ical, { type ParameterValue, type VEvent } from 'node-ical';

interface IcsLoaderOptions {
	/** Published calendar URL (Outlook: Settings → Calendar → Shared calendars → Publish → ICS link). */
	url: string | undefined;
	/** How far ahead to include events, in days. */
	daysAhead?: number;
}

/** node-ical returns either a plain string or `{ val, params }` for text properties. */
function text(value: ParameterValue | undefined): string | undefined {
	if (value == null) return undefined;
	const str = typeof value === 'string' ? value : value.val;
	return str?.trim() || undefined;
}

/**
 * node-ical represents all-day dates as local midnight on the build machine.
 * Normalize to UTC midnight so they render the same regardless of where the build runs.
 */
function toUtcDate(date: Date): Date {
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * Loads upcoming events from an .ics feed at build time.
 * Recurring events are expanded into individual occurrences.
 */
export function icsLoader({ url, daysAhead = 90 }: IcsLoaderOptions): Loader {
	return {
		name: 'ics-loader',
		load: async ({ store, logger, parseData }) => {
			store.clear();

			if (!url) {
				logger.warn('EVENTS_ICS_URL is not set; the events list will be empty.');
				return;
			}

			const res = await fetch(url.replace(/^webcal:/, 'https:'));
			if (!res.ok) {
				throw new Error(`Failed to fetch calendar (${res.status} ${res.statusText})`);
			}
			const calendar = ical.sync.parseICS(await res.text());

			const now = new Date();
			const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
			let count = 0;

			for (const component of Object.values(calendar)) {
				if (component?.type !== 'VEVENT') continue;
				const event = component as VEvent;
				if (event.status === 'CANCELLED') continue;

				const instances = ical.expandRecurringEvent(event, {
					from: now,
					to: until,
					expandOngoing: true,
				});

				for (const instance of instances) {
					if (instance.event.status === 'CANCELLED') continue;
					const id = `${event.uid}-${instance.start.toISOString()}`;
					const data = await parseData({
						id,
						data: {
							title: text(instance.summary) ?? 'Untitled event',
							start: instance.isFullDay ? toUtcDate(instance.start) : instance.start,
							end: instance.isFullDay ? toUtcDate(instance.end) : instance.end,
							allDay: instance.isFullDay,
							location: text(instance.event.location),
							description: text(instance.event.description),
						},
					});
					store.set({ id, data });
					count++;
				}
			}

			logger.info(`Loaded ${count} upcoming events.`);
		},
	};
}
