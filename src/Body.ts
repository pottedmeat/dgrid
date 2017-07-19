import global from '@dojo/core/global';
import { from, includes } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import { v, w } from '@dojo/widget-core/d';
import { shallow } from '@dojo/widget-core/diff';
import { DNode } from '@dojo/widget-core/interfaces';
import { Dimensions } from '@dojo/widget-core/meta/Dimensions';
import { Intersection, IntersectionMetaCallback, IntersectionMetaObserver, IntersectionMetaEntry } from '@dojo/widget-core/meta/Intersection';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase, { diffProperty } from '@dojo/widget-core/WidgetBase';
import { HasBufferRows, HasColumns, HasData, HasScrollTo, HasScrollToEvent, HasSliceEvent, ItemProperties } from './interfaces';
import Row from './Row';

import * as css from './styles/body.m.css';

export const BodyBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface BodyProperties extends ThemeableProperties, HasBufferRows, HasColumns, HasData, HasScrollTo, HasScrollToEvent, HasSliceEvent, RegistryMixinProperties {}

interface RenderedDetails {
	add: boolean;
	height?: number;
	index: number;
	invalidating: boolean;
	key: string;
	node: DNode;
	remove: boolean;
}

@theme(css)
class Body extends BodyBase<BodyProperties> {
	private _firstVisibleKey: string;
	private _itemElementMap = new Map<string, RenderedDetails>();
	private _intersectionObserver: IntersectionMetaObserver;
	private _scrollTop = 0;

	private _onIntersection(entries: IntersectionMetaEntry[], observer: IntersectionMetaObserver) {
		const {
			_intersectionObserver: intersectionObserver,
			_itemElementMap: itemElementMap,
			properties: {
				data: {
					items,
					size: {
						dataLength
					},
					slice: {
						start = 0,
						count = 0
					} = {}
				},
				onScrollToRequest
			}
		} = this;

		let invalidating = false;
		for (const entry of entries) {
			if (entry.intersectionRatio > 0) {
				const details = this._itemElementMap.get(entry.key);
				if (details && details.invalidating) {
					invalidating = true;
					break;
				}
			}
		}
		if (invalidating) {
			let sliced = false;
			const dimensions = this.meta(Dimensions);
			const visibleKeys = this.visibleKeys();
			if (visibleKeys.length) {
				for (const item of items) {
					if (includes(visibleKeys, item.id)) {
						console.log('Body._onIntersection visible', item.id);
						this._slice(item.index);
						sliced = true;
						break;
					}
				}
			}
			if (!sliced) {
				// TODO: Use intersectionRatio with a large number of thresholds to find the offset
				for (const key of visibleKeys) {
					const match = key.match(/^margin([+\-])(\d+)$/);
					if (match) {
						const offset = Math.round((parseInt(match[2], 10) * 100) / this.estimatedRowHeight());
						if (match[1] === '-') {
							console.log('Body._onIntersection margin', match[1] + match[2], start - offset);
							onScrollToRequest && onScrollToRequest({ index: (start - offset) });
						}
						else if (match[1] === '+') {
							console.log('Body._onIntersection margin', match[1] + match[2], start + count + offset);
							onScrollToRequest && onScrollToRequest({ index: (start + count + offset) });
						}
						sliced = true;
						break;
					}
				}
			}
			if (!sliced) {
				console.log('Body._onIntersection not sliced');
			}
		}
	}

	private _slice(start: number) {
		const {
			properties: {
				bufferRows = 10,
				data: {
					size: {
						dataLength
					}
				},
				onSliceRequest
			}
		} = this;
		const count = this.estimatedRowCount();

		// Use the index of the first row as a starting point
		// as well as moving back a few rows so there's
		// additional data above the scroll area
		const sliceStart = Math.max(0, start - bufferRows);
		const sliceCount = (Math.min(start, bufferRows) + count + bufferRows);
		// Use the start value we found and request an amount of data
		// equal to the additional data above the scroll area, the number
		// of visible rows and the additional data below the scroll area
		if (sliceCount > 100) {
			debugger;
		}
		console.log('_slice(' + start + ', ' + count + ') => onSliceRequest(' + sliceStart + ', ' + sliceCount + ')');
		onSliceRequest && onSliceRequest({ start: sliceStart, count: sliceCount });
	}

	private _scrollTopCallback(): number {
		const {
			_firstVisibleKey: firstVisibleKey,
			_itemElementMap: itemElementMap,
			properties: {
				onScrollToComplete,
				scrollTo
			}
		} = this;
		const detailsEntries = from(itemElementMap.entries());
		const dimensions = this.meta(Dimensions);
		let foundScrollTo = false;

		let scrollTop = this._scrollTop;

		// Check to see if all items are new
		let cleared = true;
		for (const [ itemKey, details] of detailsEntries) {
			if (!details.add) {
				cleared = false;
			}
			if (scrollTo && details.index === scrollTo.index && dimensions.has(itemKey)) {
				foundScrollTo = true;
				scrollTop = dimensions.get(itemKey).offset.top;
			}
		}

		if (cleared) {
			console.log('Body._scrollTopCallback cleared');
			if (!scrollTo) {
				scrollTop = dimensions.has('marginTop') ? dimensions.get('marginTop').size.height : 0;
			}

			// mark nodes as having been factored into scroll calculations
			for (const [ , details ] of detailsEntries) {
				details.add = false;
			}
		}
		else if (scrollTo && foundScrollTo) {
			console.log('Body._scrollTo', scrollTop);
			// mark nodes as having been factored into scroll calculations
			for (const [ , details ] of detailsEntries) {
				details.add = false;
			}
		}
		else {
			const dimensions = this.meta(Dimensions);
			let beforeVisible = true;
			for (const [ itemKey, details ] of detailsEntries) {
				if (itemKey === firstVisibleKey) {
					beforeVisible = false;
				}

				if (beforeVisible) {
					// Track size changed of rows before the first visible row
					if (details.add && dimensions.has(itemKey)) {
						// added items increase scrollTop
						scrollTop += dimensions.get(itemKey).size.height;
					}
					if (details.remove) {
						// removed items decrease scrollTop
						scrollTop -= (details.height || 0);
					}
				}

				// mark nodes as having been factored into scroll calculations
				details.add = false;
				if (details.remove) {
					itemElementMap.delete(itemKey);
				}
			}
		}

		if (onScrollToComplete && scrollTo) {
			onScrollToComplete(foundScrollTo ? scrollTo : undefined);
		}

		console.log('Body._onScrollTopCallback', scrollTop);

		return scrollTop;
	}

	private _margin(type: '-' | '+', exists: boolean): RenderedDetails[] {
		const {
			_intersectionObserver: intersectionObserver,
			_itemElementMap: itemElementMap
		} = this;

		const rows: RenderedDetails[] = [];

		const reversed = (type === '-');
		for (let i = 1; i <= 100; i++) {
			const key = `margin${type}${reversed ? (101 - i) : i}`;
			const node = v('div', {
				key,
				styles: {
					height: '100px'
				}
			});
			let details = itemElementMap.get(key);
			if (exists) {
				if (!details) {
					details = {
						add: true,
						height: 100,
						index: -1,
						invalidating: true,
						key,
						node,
						remove: false
					};
					intersectionObserver.subscribe(key);
				}
				rows.push(details);
			}
			else if (details) {
				delete details.node;
				if (!details.remove) {
					details.remove = true;
					intersectionObserver.unsubscribe(key);
				}
				rows.push(details);
			}
		}

		return rows;
	}

	/**
	 * Creates a DNode for the passed item and either
	 * creates or updates an associated entry in
	 * the item element map.
	 */
	protected createNodeFromItem(item: ItemProperties): RenderedDetails {
		const {
			_intersectionObserver: intersectionObserver,
			_itemElementMap: itemElementMap,
			properties: {
				columns,
				theme,
				registry
			}
		} = this;

		const {
			id: key,
			index
		} = item;
		const node = v('div', {
			key
		}, [
			w<Row>('row', {
				columns,
				item,
				key,
				registry,
				theme
			})
		]);
		let details = itemElementMap.get(key);
		if (!details) {
			details = {
				add: true,
				index: index,
				invalidating: false,
				key,
				node,
				remove: false
			};
			intersectionObserver.subscribe(key);
		}
		else {
			details.node = node;
			details.index = index;
		}

		return details;
	}

	/**
	 * Uses the exact number of rows if the viewport is full
	 * or the height of the scroll area and the estimated row height
	 * to estimate the number of rows that will fill it
	 */
	protected estimatedRowCount(): number {
		let margins = false;
		for (const key in this.visibleKeys()) {
			if (key.indexOf('margin') === 0) {
				margins = true;
				break;
			}
		}
		if (margins) {
			// we don't know the exact number of visible rows
			const height = this.meta(Dimensions).get('scroller').size.height;
			if (height > 0) {
				return Math.round(height / this.estimatedRowHeight());
			}
		}
		else {
			// we know exactly how many rows need to be displayed
			const visible = this.visibleKeys().length;
			if (visible > 0) {
				return visible;
			}
		}
		return 30;
	}

	/**
	 * Based on what is currently rendered, find the average height
	 * of each row and, if nothing is rendered, return 20.
	 */
	protected estimatedRowHeight(): number {
		const {
			_itemElementMap: itemElementMap
		} = this;

		const dimensions = this.meta(Dimensions);
		let rowHeight = 0;
		let rowCount = 0;
		for (const [ key, details ] of from(itemElementMap.entries())) {
			if (dimensions.has(key)) {
				rowHeight += dimensions.get(key).size.height;
				rowCount++;
			}
		}

		return Math.round(rowHeight / rowCount) || 20;
	}

	@diffProperty('scrollTo', shallow)
	protected diffScrollTo({ scrollTo: previousScrollTo }: BodyProperties, { scrollTo }: BodyProperties) {
		if (scrollTo) {
			this._slice(scrollTo.index);
		}
	}

	render(): DNode {
		console.log('Body.render');
		const {
			_itemElementMap: itemElementMap,
			properties: {
				bufferRows = 10,
				data,
				rowDrift = 5
			}
		} = this;
		const intersections = this.meta(Intersection);

		let intersectionObserver = this._intersectionObserver;
		if (!intersectionObserver) {
			intersectionObserver = this._intersectionObserver = intersections.observe(this._onIntersection.bind(this), {
				root: 'scroller'
			});
		}

		if (data.items && data.items.length === 0) {
			this._slice(0);
		}

		const {
			items,
			size: {
				dataLength
			},
			slice: {
				start = 0
			} = {}
		} = data;
		const dimensions = this.meta(Dimensions);
		const previousKeys = from(itemElementMap.keys());
		const visibleKeys = this.visibleKeys();
		const firstVisibleKey = this._firstVisibleKey = (visibleKeys.length ? visibleKeys[0] : '');
		const lastVisibleKey = (visibleKeys.length ? visibleKeys[visibleKeys.length - 1] : '');
		const updatedElementMap = new Map<string, RenderedDetails>(); // Create a new map so that the items will be ordered correctly

		const children: DNode[] = [];

		// Create a top margin if the data has any offset at all
		for (const details of this._margin('-', start > 0)) {
			updatedElementMap.set(details.key, details);
			children.push(details.node);
		}

		// Keep a map of current keys (item IDs) and items
		const itemsByKey: { [key: string]: RenderedDetails } = {};
		const currentKeys: string[] = items.map((item, index) => {
			const key = item.id;
			// createNodeFromItem marks this item as having been added
			// automatically if it didn't exist in the mapping (is new)
			itemsByKey[key] = this.createNodeFromItem(item);
			return key;
		});

		// Detect changes between what we have now and what we will have
		if (previousKeys.length === 0) {
			// There were no item rows the last time render was called
			// so every row is added
			for (const item of items) {
				const details = this.createNodeFromItem(item);
				children.push(details.node);
				details && updatedElementMap.set(item.id, details);
			}
		}
		else {
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

			// If all keys are new, we can start from scratch
			if (cleared) {
				console.log('Body.render cleared');
				for (const [ itemKey, details ] of from(itemElementMap.entries())) {
					if (!details.remove) {
						intersectionObserver.unsubscribe(itemKey);
					}
				}
				itemElementMap.clear();
				return this.render();
			}

			// Use previous keys to watch for deleted items
			// and insert new keys at the indexes detected above
			for (let i = 0, il = previousKeys.length; i <= il; i++) {
				const key = previousKeys[i];

				const keyPatch = keyPatches[i];
				if (keyPatch) {
					for (const addedKey of keyPatch) {
						// Insert any newly introduced items
						// that were added at this index
						const details = itemsByKey[addedKey];
						children.push(details.node);
						updatedElementMap.set(addedKey, details);
					}
				}

				if (i < il) {
					if (key.indexOf('margin') === 0) {
						continue;
					}

					let details = itemsByKey[key];
					if (details) {
						// This item has neither been added nor removed
						// since the last render
						children.push(details.node);

						// Add to the updated element map
						updatedElementMap.set(key, details);
					}
					else if (itemElementMap.has(key)) {
						details = itemElementMap.get(key)!;
						// This item was deleted since the last render
						if (!details.remove && dimensions.has(key)) {
							// Store its rendered height before it is removed from DOM
							// as it will not be added as a row in the next render
							details.height = dimensions.get(key).size.height;
						}

						// Mark this item as having been removed
						if (!details.remove) {
							intersectionObserver.unsubscribe(key);
							details.remove = true;
						}

						// Add to the updated element map.
						// This entry will be deleted once its size
						// is taken into account in onElementUpdated
						const updated = itemElementMap.get(key);
						if (updated) {
							updatedElementMap.set(key, updated);
						}
					}
				}
			}
		}

		// Create a bottom margin if the data doesn't extend all the way to the end
		for (const details of this._margin('+', (start + items.length) < (dataLength - 1))) {
			updatedElementMap.set(details.key, details);
			children.push(details.node);
		}

		// Store the updated item map
		this._itemElementMap = updatedElementMap;

		// If start is 0 (we're at the beginning of the data set)
		// then our minimum index doesn't need to be triggered.
		// If start + count is dataLength (we're at the end of the data set)
		// then our maximum index doesn't need to be triggered.
		const minIndex = (bufferRows - rowDrift);
		const maxIndex = (currentKeys.length - bufferRows + rowDrift);
		console.log('Body.render visible', visibleKeys.length, visibleKeys.join(','));
		console.log('Body.render previous sentinel', currentKeys[minIndex - 1]);
		console.log('Body.render next sentinel', currentKeys[maxIndex + 1]);
		for (const [ itemKey, details ] of from(this._itemElementMap.entries())) {
			if (itemKey.indexOf('margin') === 0) {
				continue;
			}
			const index = currentKeys.indexOf(itemKey);
			details.invalidating = (index < minIndex || index > maxIndex);
		}

		this._scrollTop = dimensions.has('scroller') ? dimensions.get('scroller').scroll.top : 0;

		return v('div', {
			classes: this.classes(css.scroller),
			key: 'scroller',
			scrollTop: this._scrollTopCallback
		}, children);
	}

	protected visibleKeys() {
		const {
			_intersectionObserver: intersectionObserver,
			_itemElementMap: itemElementMap
		} = this;

		const intersections = this.meta(Intersection);
		const visible: string[] = [];
		for (const [ key, details ] of from(itemElementMap.entries())) {
			if (intersections.has(key, intersectionObserver) && intersections.get(key, intersectionObserver) > 0) {
				visible.push(key);
			}
		}
		return visible;
	}
}

export default Body;
