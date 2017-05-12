import { from, includes } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import Set from '@dojo/shim/Set';
import { registry as dRegistry, v, w } from '@dojo/widget-core/d';
import { DNode, PropertiesChangeEvent } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import WidgetBase, { onPropertiesChanged } from '@dojo/widget-core/WidgetBase';
import 'intersection-observer';
import {
	HasColumns, HasItems, HasSliceEvent, HasSize, ItemProperties,
	HasScrollTo, HasEstimatedRowHeight
} from './interfaces';
import { ScrollTo } from './Grid';
import Row from './Row';
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

export interface BodyProperties extends ThemeableProperties, HasColumns, HasEstimatedRowHeight, HasItems, HasSize, HasScrollTo, HasSliceEvent, RegistryMixinProperties {
	onScrollToRequest(scrollTo: ScrollTo): void;
}

const margin = 10000;
const preload = 25;
const drift = 5;

@theme(bodyClasses)
class Body extends BodyBase<BodyProperties> {
	private itemElementMap = new Map<string, RenderedDetails>();
	private scroller: HTMLElement;
	private scrollTop = 0;
	private marginTop: RenderedDetails;
	private firstVisibleKey: string;
	private observer: IntersectionObserver;
	private visibleKeys: string[] = [];
	private visibleElementSet = new Set<Element>();
	private expectScroll: number;

	@onPropertiesChanged()
	onPropertiesChanged(evt: PropertiesChangeEvent<this, BodyProperties>) {
		const {
			scrollTo
		} = evt.properties;
		const {
			itemElementMap,
			properties: {
				items,
				onScrollToComplete,
				onSliceRequest
			},
			scroller
		} = this;

		if (includes(evt.changedPropertyKeys, 'scrollTo') && scrollTo) {
			// the scrollTo property was passed either by the user
			// or by the grid after a call to onScrollToRequest
			const index = scrollTo.index;
			for (const item of items) {
				// we saved the "true" index on all details
				// objects so we can just directly compare
				if (item.index === index) {
					const renderedDetails = itemElementMap.get(item.id);
					if (renderedDetails && renderedDetails.element) {
						// if this exists within the grid, just scroll to it
						// and allow the event handler to fill in any missing data
						scroller.scrollTop = renderedDetails.element.offsetTop;
						// notify the property listener that this is done
						// to allow it to clear this property
						onScrollToComplete();
						return;
					}
					break;
				}
			}

			// this index is not currently rendered so we request a slice
			// of the data with a number of rows to hopefully fill in the scroll area
			onSliceRequest && onSliceRequest({ start: index, count: this.estimatedRowCount() });
		}
	}

	/**
	 * Uses the height of the scroll area and the estimated row height
	 * to estimate the number of rows that will fill it
	 *
	 * @returns {number}
	 */
	private estimatedRowCount(): number {
		const height = this.scroller.offsetHeight;
		if (height) {
			return Math.round(height / this.estimatedRowHeight());
		}
		return 100;
	}

	/**
	 * Based on what is currently rendered, find the average height
	 * of each row and, if nothing is rendered, use
	 * properties.estimatedRowHiehgt which has a default of 20
	 *
	 * @returns {number}
	 */
	private estimatedRowHeight(): number {
		const {
			itemElementMap,
			properties: {
				estimatedRowHeight
			}
		} = this;

		let rowHeight = 0;
		let rowCount = 0;
		for (let renderedDetails of from(itemElementMap.values())) {
			if (renderedDetails.element) {
				rowHeight += renderedDetails.element.offsetHeight;
				rowCount++;
			}
		}

		return Math.round(rowHeight / rowCount) || estimatedRowHeight;
	}

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
		this.updateIntersectionObserver();

		const items = this.properties.items;
		const {
			itemElementMap,
			properties: {
				size: {
					start = 0,
					min = 0,
					max = Infinity
				} = {},
				onScrollToRequest,
				onSliceRequest
			},
			scroller,
			visibleKeys
		} = this;

		if (visibleKeys.length === 0) {
			// This happens during a very rapid scroll
			// the grid hasn't received data from the data provider
			// that has filled in the current view port
			const scroll = scroller.scrollTop;
			const allDetails = from(itemElementMap.values());
			for (const renderedDetails of allDetails) {
				if (renderedDetails.element && renderedDetails.element.offsetTop) {
					const delta = (renderedDetails.element.offsetTop - scroll);
					if (delta > 0) {
						// The top of the rendered data is below the current viewport
						// so we try to guess how many rows were skipped and jump
						// down to that area
						const estimatedRowHeight = this.estimatedRowHeight();
						const scrollTo = Math.max(min, Math.min(max, (start - Math.round(delta / estimatedRowHeight))));
						console.log('out of bounds scrollTo', scrollTo);
						onScrollToRequest({ index: scrollTo });
						return;
					}
					break;
				}
			}
			for (const renderedDetails of allDetails.reverse()) {
				if (renderedDetails.element && renderedDetails.element.offsetTop && renderedDetails.element.offsetHeight) {
					const delta = (scroll - (renderedDetails.element.offsetTop + renderedDetails.element.offsetHeight));
					if (delta > 0) {
						// The bottom of the rendered data is below the current viewport
						// so we try to guess how many rows were skipped and jump
						// down to that area
						const estimatedRowHeight = this.estimatedRowHeight();
						const scrollTo = Math.max(min, Math.min(max, (start + items.length + Math.round(delta / estimatedRowHeight))));
						console.log('out of bounds scrollTo', scrollTo);
						onScrollToRequest({ index: scrollTo });
						return;
					}
					break;
				}
			}
		}
		else {
			// This is the typical path the code will take
			this.scrollTop = scroller.scrollTop;
			this.firstVisibleKey = visibleKeys[0];
			const renderedDetails = itemElementMap.get(this.firstVisibleKey);
			if (renderedDetails) {
				// Use the index of the first row as a starting point
				// as well as moving back a few rows so there's
				// additional data above the scroll area
				const sliceStart = Math.max(min, renderedDetails.index - preload);
				let sliceCount = (Math.min(renderedDetails.index, preload) + visibleKeys.length + preload);
				// Use the start value we found and request an amount of data
				// equal to the additional data above the scroll area, the number
				// of visible rows and the additional data below the scroll area
				if (sliceStart + sliceCount - 1 > max) {
					// If we've reached the data limit
					// only ask for as many rows as are left
					sliceCount = (max - sliceStart + 1);
				}

				// Limit data requests so that we only ever ask for
				// a. start/count combinations that differ from what we already have (see c.)
				// b. a start or end index that exceeds a limit we're comfortable with
				// c. the very start or very end of the data even if that limit is not reached
				if ((sliceStart !== start || sliceCount !== items.length) && (sliceStart === min || Math.abs(sliceStart - start) > drift || Math.abs(sliceCount - items.length) > drift || (sliceStart + sliceCount) === max)) {
					// TODO: Throttle?
					console.log('onScroll slice', sliceStart, sliceCount);
					onSliceRequest && onSliceRequest({ start: sliceStart, count: sliceCount });
				}
			}
		}
	}

	protected onElementChange(element: HTMLElement, key: string): void {
		if (key === 'marginTop') {
			if (this.marginTop) {
				this.marginTop.element = element;
			}
			return;
		}
		if (key === 'marginBottom') {
			return;
		}
		if (key === 'scroller') {
			const items = this.properties.items;
			const {
				properties: {
					size: {
						start = 0,
						max: _max = -1
					} = {},
					onSliceRequest
				}
			} = this;
			const max = (_max !== -1) ? _max : Infinity;

			this.scroller = element;

			if (items.length === 0) {
				// If there has been no data passed (e.g. during initialization)
				// wait until the scroll area appears to get a more accurate
				// estimate of how many rows to ask for initially
				const sliceStart = start;
				let sliceCount = this.estimatedRowCount();
				// Use the start value we found and request an amount of data
				// equal to the additional data above the scroll area, the number
				// of visible rows and the additional data below the scroll area
				if (sliceStart + sliceCount - 1 > max) {
					// If we've reached the data limit
					// only ask for as many rows as are left
					sliceCount = (max - sliceStart + 1);
				}
				console.log('empty items slice', sliceStart, sliceCount);
				onSliceRequest && onSliceRequest({ start: sliceStart, count: sliceCount });
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
		else if (key !== 'marginTop' && key !== 'marginBottom') {
			// Observe each item row, as it's created
			this.observer.observe(element);
		}

		this.onElementChange(element, key);
	}

	protected onElementUpdated(element: HTMLElement, key: 'scroller'): void {
		if (key === 'scroller') {
			const {
				firstVisibleKey,
				itemElementMap,
				marginTop,
				properties: {
					onScrollToComplete,
					scrollTo
				},
				scroller
			} = this;

			const itemElementMapEntries = from(itemElementMap.entries());

			let cleared = true;
			for (const [ itemKey, renderedDetails] of itemElementMapEntries) {
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
				if (marginTop && marginTop.element) {
					scrollTop = marginTop.element.offsetHeight;
				}

				if (scrollTo) {
					onScrollToComplete();
				}

				// mark nodes as having been factored into scroll calculations
				for (const [ itemKey, renderedDetails] of itemElementMapEntries) {
					renderedDetails.add = false;
				}
				if (marginTop) {
					marginTop.add = false;
				}
			}
			else {
				// keep track of everything before the first visible key
				let beforeVisible = true;
				for (const [ itemKey, renderedDetails ] of itemElementMapEntries) {
					if (itemKey === firstVisibleKey) {
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
						itemElementMap.delete(itemKey);
					}
				}

				// factor in the addition or removal of the top margin
				if (marginTop) {
					if (marginTop.add && marginTop.element) {
						scrollTop += marginTop.element.offsetHeight;
						marginTop.add = false;
					}
					if (marginTop.delete) {
						scrollTop -= (marginTop.height || 0);
						delete this.marginTop;
					}
				}
			}

			if (scroller.scrollTop !== scrollTop) {
				// The scroll event handler will adjust the slice
				scroller.scrollTop = scrollTop;
				return;
			}

			// Let the onElementChange method handle the slice
		}

		this.onElementChange(element, key);
	}

	createNodeFromItem(item: ItemProperties<any>, index: number) {
		const {
			itemElementMap,
			properties: {
				columns,
				theme,
				registry = dRegistry
			}
		} = this;

		const key = item.id;
		let renderedDetails = itemElementMap.get(key);
		if (!renderedDetails) {
			renderedDetails = {
				add: true,
				delete: false,
				index: index
			};
			itemElementMap.set(key, renderedDetails);
		}
		else {
			renderedDetails.index = index;
		}

		return v('div', {
			key,
			role: 'row',
			classes: this.classes(bodyClasses.row)
		}, [
			w<Row>('row', {
				key,
				item,
				columns,
				registry,
				theme
			})
		]);
	}

	render(): DNode {
		const items = this.properties.items;
		const {
			itemElementMap,
			properties: {
				size: {
					start = 0,
					totalLength = items.length,
					min = 0,
					max = Infinity
				} = {}
			}
		} = this;

		const children: DNode[] = [];

		// Create a top margin if the data has any offset at all
		let marginTop = this.marginTop;
		if (start > min) {
			if (!marginTop) {
				marginTop = this.marginTop = {
					add: true,
					delete: false,
					index: -1
				};
			}
			children.push(v('div', {
				key: 'marginTop',
				styles: {
					height: (margin + 'px')
				}
			}));
		}
		else if (marginTop) {
			if (marginTop.element) {
				marginTop.height = marginTop.element.offsetHeight;
			}
			marginTop.delete = true;
		}

		const previousKeys = from(itemElementMap.keys());
		if (previousKeys.length === 0) {
			// There were no item rows the last time render was called
			// so every row is added
			for (let i = 0, item; (item = items[i]); i++) {
				children.push(this.createNodeFromItem(item, (start + i)));
			}
		}
		else {
			// Create a new map so that the items will be ordered correctly
			const updatedItemElementMap = new Map<string, RenderedDetails>();

			// Keep a map of current keys (item IDs) and items
			const itemsByKey: { [key: string]: DNode } = {};
			const currentKeys: string[] = items.map((item, index) => {
				const key = item.id;
				// createNodeFromItem marks this item as having been added
				// automatically if it didn't have a mapping already
				itemsByKey[key] = this.createNodeFromItem(item, (start + index));
				return key;
			});

			// find which keys are new and at what index they will appear
			let cleared = true;
			let addedKeys: string[] = [];
			const keyPatches: { [ index: number]: string[] } = {};
			let previousKeyIndex = 0;
			for (const currentKey of currentKeys) {
				const foundAtIndex = previousKeys.indexOf(currentKey, previousKeyIndex);
				if (foundAtIndex === -1) {
					addedKeys.push(currentKey);
				}
				else {
					if (addedKeys.length) {
						keyPatches[previousKeyIndex] = addedKeys;
						addedKeys = [];
					}

					cleared = false;
					previousKeyIndex = (foundAtIndex + 1);
				}
			}
			if (addedKeys.length) {
				keyPatches[previousKeys.length] = addedKeys;
			}

			if (cleared) {
				// If all keys are new, we can start from scratch
				itemElementMap.clear();
				return this.render();
			}

			for (let i = 0, il = previousKeys.length; i <= il; i++) {
				const key = previousKeys[i];

				const keyPatch = keyPatches[i];
				if (keyPatch) {
					for (const addedKey of keyPatch) {
						// Insert any newly introduced items
						// that were added at this index
						children.push(itemsByKey[addedKey]);

						const updatedMeasured = itemElementMap.get(addedKey);
						if (updatedMeasured) {
							updatedItemElementMap.set(addedKey, updatedMeasured);
						}
					}
				}

				if (i < il) {
					const item = itemsByKey[key];
					const renderedDetails = itemElementMap.get(key);
					if (item) {
						// This item is consistent between the previous
						// render call and this one
						children.push(item);

						const updatedMeasured = itemElementMap.get(key);
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
							const updatedMeasured = itemElementMap.get(key);
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

		// Create a bottom margin if the data doesn't extend all the way to the end
		if (start + items.length < max) {
			children.push(v('div', {
				key: 'marginBottom',
				styles: {
					height: (margin + 'px')
				}
			}));
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
