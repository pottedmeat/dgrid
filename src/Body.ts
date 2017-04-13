import { from } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import Set from '@dojo/shim/Set';
import { registry as dRegistry, v, w } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import 'intersection-observer';
import { diff } from './compare';
import { HasColumns, HasItems, HasSliceEvent, HasOffset, HasTotalLength, ItemProperties, HasScrollTo, HasEstimatedRowHeight } from './interfaces';
import { RowProperties } from './Row';
import { ThemeableMixin, theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';

import * as bodyClasses from './styles/body.m.css';

interface RenderedDetails {
	add: boolean;
	delete: boolean;
	element?: HTMLElement;
	index: number;
	height?: number;
}

export const BodyBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface BodyProperties extends ThemeableProperties, HasColumns, HasEstimatedRowHeight, HasItems, HasOffset, HasTotalLength, HasScrollTo, HasSliceEvent, RegistryMixinProperties {}

const preload = 100;
const drift = 10;

@theme(bodyClasses)
class Body extends BodyBase<BodyProperties> {
	private itemElementMap = new Map<string, RenderedDetails>();
	private scroller: HTMLElement;
	private scrollTop = 0;
	private firstVisibleKey: string;
	private observer: IntersectionObserver;
	private visibleKeys: string[] = [];
	private visibleElementSet = new Set<Element>();
	private expectScroll: number;

	/**
	 * A utility function to force the IntersectionObserver polyfill
	 * to notify us of intersections immediately
	 */
	private updateIntersectionObserver(): void {
		const _checkForIntersections: Function = (<any> IntersectionObserver.prototype)._checkForIntersections;
		if (_checkForIntersections) {
			_checkForIntersections.call(this.observer);
		}
	}

	protected onScroll() {
		// Chrome may call onScroll before notifying us of new intersections
		// so the intersection handler sets a callback that we can clear.
		clearTimeout(this.expectScroll);
		// The polyfill is debounced, but we need to know the intersection right now
		this.updateIntersectionObserver();

		this.scrollTop = this.scroller.scrollTop;
		this.firstVisibleKey = this.visibleKeys[0];
		const renderedDetails = this.itemElementMap.get(this.firstVisibleKey);
		if (renderedDetails) {
			// Use the index of the first row as a starting point
			// as well as moving back a few rows so there's
			// additional data above the scroll area
			const start = Math.max(0, renderedDetails.index - preload);
			let count = (Math.min(renderedDetails.index, preload) + this.visibleKeys.length + preload);
			// Use the start value we found and request an amount of data
			// equal to the additional data above the scroll area, the number
			// of visible rows and the additional data below the scroll area
			if (start + count > this.properties.totalLength) {
				// If we've reached the data limit
				// only ask for as many rows as are left
				count = (this.properties.totalLength - start);
			}

			// Limit data requests so that we only ever ask for
			// a. start/count combinations that differ from what we already have (see c.)
			// b. a start or end index that exceeds a limit we're comfortable with
			// c. the very start or very end of the data even if that limit is not reached
			if ((start !== this.properties.offset || count !== this.properties.items.length) && (start === 0 || Math.abs(start - this.properties.offset) > drift || Math.abs(count - this.properties.items.length) > drift || (start + count) === this.properties.totalLength)) {
				this.properties.onSliceRequest && this.properties.onSliceRequest({ start, count });
			}
		}
	}

	protected onElementChange(element: HTMLElement, key: string): void {
		if (key === 'scroller') {
			this.scroller = element;

			if (this.properties.items.length === 0) {
				// If there has been no data passed (e.g. during initialization)
				// wait until the scroll area appears to get a more accurate
				// estimate of how many rows to ask for initially
				this.properties.onSliceRequest && this.properties.onSliceRequest({ start: this.properties.offset, count: 25 });
			}
			else {
				// We hit this when the children of the scroll area change
				// e.g. after we guess how many rows we'll need. The onScroll
				// method will take this information and add additional rows
				// before and after this content as padding.
				this.onScroll();
			}

			return;
		}

		const renderedDetails = this.itemElementMap.get(key);
		if (renderedDetails) {
			// store the DOM node so that it corresponds with the item ID
			renderedDetails.element = element;
		}
	}

	onIntersection(entries: IntersectionObserverEntry[]) {
		const visibleElementSet = this.visibleElementSet;
		for (const entry of entries) {
			if (entry.intersectionRatio > 0) {
				// add elements that intersect
				visibleElementSet.add(entry.target);
			}
			else {
				// remove elements that no longer intersect
				visibleElementSet.delete(entry.target);
			}
		}

		const itemElementMap = this.itemElementMap;
		const visibleKeys: string[] = [];
		for (const [ itemKey, renderedDetails ] of from(itemElementMap.entries())) {
			if (renderedDetails.element && visibleElementSet.has(renderedDetails.element)) {
				// use the stored item IDs and DOM nodes
				// to map the DOM nodes that intersect the scroll area
				// with item IDs
				visibleKeys.push(itemKey);
			}
		}
		this.visibleKeys = visibleKeys;

		// Chrome may call onScroll before notifying us of new intersections
		// so the intersection handler sets a callback that we can clear.
		clearTimeout(this.expectScroll);
		this.expectScroll = setTimeout(this.onScroll.bind(this), 10);
	}

	protected onElementCreated(element: HTMLElement, key: string): void {
		if (key === 'scroller') {
			// When the scroll area node is created
			// create the IntersectionObserver, using
			// it as the root element
			this.observer = new IntersectionObserver(this.onIntersection.bind(this), {
				root: element
			});
		}
		else {
			// Observe each item row, as it's created
			this.observer.observe(element);
		}

		this.onElementChange(element, key);
	}

	protected onElementUpdated(element: HTMLElement, key: 'scroller'): void {
		if (key === 'scroller') {
			let cleared = true;
			for (const renderedDetails of from(this.itemElementMap.values())) {
				if (!renderedDetails.add) {
					cleared = false;
					break;
				}
			}

			let scrollTop = this.scrollTop;

			if (cleared) {
				// If all item rows are new,
				// reset the scroll bar
				scrollTop = 0;

				// mark nodes as having been factored into scroll calculations
				for (const renderedDetails of from(this.itemElementMap.values())) {
					renderedDetails.add = false;
				}
			}
			else {
				// keep track of everything before the first visible key
				let beforeVisible = true;
				for (const [ itemKey, renderedDetails ] of from(this.itemElementMap.entries())) {
					if (itemKey === this.firstVisibleKey) {
						beforeVisible = false;
					}

					if (beforeVisible) {
						if (renderedDetails.add && renderedDetails.element) {
							// added items increase scrollTop
							scrollTop += renderedDetails.element.offsetHeight;
						}
						if (renderedDetails.delete) {
							// removed items decrase scrollTop
							scrollTop -= (renderedDetails.height || 0);
						}
					}

					// mark nodes as having been factored into scroll calculations
					renderedDetails.add = false;
					if (renderedDetails.delete) {
						this.itemElementMap.delete(itemKey);
					}
				}
			}

			if (this.scroller.scrollTop !== scrollTop) {
				// The scroll event handler will adjust the slice
				this.scroller.scrollTop = scrollTop;
				return;
			}

			// Let the onElementChange method handle the slice
		}

		this.onElementChange(element, key);
	}

	createNodeFromItem(item: ItemProperties<any>, index: number) {
		const key = item.id;
		let renderedDetails = this.itemElementMap.get(key);
		if (!renderedDetails) {
			renderedDetails = {
				add: true,
				delete: false,
				index: index
			};
			this.itemElementMap.set(key, renderedDetails);
		}
		else {
			renderedDetails.index = index;
		}

		return v('div', {
			key,
			role: 'row',
			classes: this.classes(bodyClasses.row)
		}, [
			w<RowProperties>('row', {
				key,
				item,
				columns: this.properties.columns,
				registry: this.registry || dRegistry,
				theme: this.properties.theme
			})
		]);
	}

	render(): DNode {
		const children: DNode[] = [];

		const previousKeys = from(this.itemElementMap.keys());
		if (previousKeys.length === 0) {
			// There were no item rows the last time render was called
			// so every row is added
			for (let i = 0, item; (item = this.properties.items[i]); i++) {
				children.push(this.createNodeFromItem(item, (this.properties.offset + i)));
			}
		}
		else {
			// Create a new map so that the items will be ordered correctly
			const updatedItemElementMap = new Map<string, RenderedDetails>();

			// Keep a map of current keys (item IDs) and items
			const itemsByKey: { [key: string]: DNode } = {};
			const currentKeys: string[] = this.properties.items.map((item, index) => {
				const key = item.id;
				// createNodeFromItem marks this item as having been added
				// automatically if it didn't have a mapping already
				itemsByKey[key] = this.createNodeFromItem(item, (this.properties.offset + index));
				return key;
			});

			// Find the difference between the keys during
			// the last render and those now
			const keyPatches = diff(currentKeys, previousKeys);
			const keyPatch = keyPatches[0];
			if (keyPatch && keyPatch.removed && keyPatch.removed.length === previousKeys.length) {
				// If everything was removed, we can start from scratch
				this.itemElementMap.clear();
				return this.render();
			}

			for (let i = 0, il = previousKeys.length; i <= il; i++) {
				const key = previousKeys[i];

				const keyPatch = keyPatches[i];
				if (keyPatch) {
					if (keyPatch.added) {
						for (const added of keyPatch.added) {
							// Insert any newly introduced items
							// that were added at this index
							//
							const addedKey = currentKeys[added.to];
							children.push(itemsByKey[addedKey]);

							const updatedMeasured = this.itemElementMap.get(addedKey);
							if (updatedMeasured) {
								updatedItemElementMap.set(addedKey, updatedMeasured);
							}
						}
					}
				}

				if (i < il) {
					const item = itemsByKey[key];
					const renderedDetails = this.itemElementMap.get(key);
					if (item) {
						// This item is consistent between the previous
						// render call and this one
						children.push(item);

						const updatedMeasured = this.itemElementMap.get(key);
						if (updatedMeasured) {
							updatedItemElementMap.set(key, updatedMeasured);
						}
					}
					else {
						// This item was deleted since the last
						// render call
						if (renderedDetails) {
							if (!renderedDetails.delete && renderedDetails.element) {
								// Store its rendered height as it will be removed from DOM
								// once this render call completes
								renderedDetails.height = renderedDetails.element.offsetHeight;
							}
							// Mark this item as having been deleted
							renderedDetails.delete = true;

							// It still appears in the item mapping but not in the children
							const updatedMeasured = this.itemElementMap.get(key);
							if (updatedMeasured) {
								updatedItemElementMap.set(key, updatedMeasured);
							}
						}
					}
				}
			}

			// Store the updated item map
			this.itemElementMap = updatedItemElementMap;
		}

		return v('div', {
				key: 'scroller',
				classes: this.classes(bodyClasses.scroller),
				onscroll: this.onScroll
			},
			children
		);
	}
}

export default Body;
