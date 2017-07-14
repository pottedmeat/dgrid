import { from, includes } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import { v, w } from '@dojo/widget-core/d';
import { shallow } from '@dojo/widget-core/diff';
import { DNode } from '@dojo/widget-core/interfaces';
import { Dimensions } from '@dojo/widget-core/meta/Dimensions';
import { Intersection, IntersectionWatchType } from '@dojo/widget-core/meta/Intersection';
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
	index: number;
	height?: number;
	remove: boolean;
}

@theme(css)
class Body extends BodyBase<BodyProperties> {
	private _firstVisibleKey: string;
	private _itemElementMap = new Map<string, RenderedDetails>();
	private _marginTop?: RenderedDetails;
	private _scrollTop = 0;

	private _slice(start: number) {
		const {
			properties: {
				bufferRows = 10,
				data: {
					items,
					size: {
						dataLength
					},
					slice = { start: 0, count: 0 }
				},
				rowDrift = 5,
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

		// Limit data requests so that we only ever ask for
		// a. start/count combinations that differ from what we already have (see c.)
		// b. a start or end index change that exceeds a limit we're comfortable with
		// c. the very start or very end of the data even if that limit is not reached
		const startDelta = Math.abs(sliceStart - slice.start);
		const countDelta = Math.abs(sliceCount - items.length);
		const atStart = (start === 0);
		const atEnd = (start + count) === Math.max(0, dataLength - 1);
		onSliceRequest && onSliceRequest({ start: sliceStart, count: sliceCount });
	}

	private _scrollTopCallback(): number {
		const {
			_firstVisibleKey: firstVisibleKey,
			_itemElementMap: itemElementMap,
			_marginTop: marginTop,
			properties: {
				data: {
					items = undefined
				} = {},
				onScrollToComplete,
				scrollTo
			}
		} = this;
		let scrollTop = this._scrollTop;

		const detailsEntries = from(itemElementMap.entries());
		const dimensions = this.meta(Dimensions);

		// Check to see if all items are new
		let cleared = true;
		for (const [ , details] of detailsEntries) {
			if (!details.add) {
				cleared = false;
				break;
			}
		}
		if (cleared) {
			scrollTop = dimensions.has('marginTop') ? dimensions.get('marginTop').size.height : 0;

			// mark nodes as having been factored into scroll calculations
			for (const [ , details ] of detailsEntries) {
				details.add = false;
			}
			marginTop && (marginTop.add = false);
		}
		else {
			const dimensions = this.meta(Dimensions);
			let beforeVisible = true;
			let resolved = false;
			for (const [ itemKey, details ] of detailsEntries) {
				if (itemKey === firstVisibleKey) {
					beforeVisible = false;
				}

				if (!resolved) {
					if (scrollTo) {
						// scrollTo was passed either by the user
						// or by the grid after a call to onScrollToRequest
						// and should be scrolled to if it exists in DOM
						if (details.index === scrollTo.index && dimensions.has(itemKey)) {
							this._scrollTop = dimensions.get(itemKey).offset.top;
							onScrollToComplete && onScrollToComplete(scrollTo);
							scrollTop = dimensions.get(itemKey).offset.top;
							console.log('scrollTo', scrollTop);
							resolved = true;
						}
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
				}

				// mark nodes as having been factored into scroll calculations
				details.add = false;
				if (details.remove) {
					itemElementMap.delete(itemKey);
				}
			}

			// factor in the addition or removal of the top margin
			if (marginTop) {
				if (marginTop.add) {
					scrollTop += dimensions.has('marginTop') ? dimensions.get('marginTop').size.height : 0;
					marginTop.add = false;
				}
				if (marginTop.remove) {
					scrollTop -= (marginTop.height || 0);
					delete this._marginTop;
				}
			}
		}

		if (onScrollToComplete && scrollTo) {
			onScrollToComplete(scrollTo);
		}

		return scrollTop;
	}

	/**
	 * Creates a DNode for the passed item and either
	 * creates or updates an associated entry in
	 * the item element map.
	 */
	protected createNodeFromItem(item: ItemProperties): DNode {
		const {
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
		let details = itemElementMap.get(key);
		if (!details) {
			details = {
				add: true,
				remove: false,
				index: index
			};
			itemElementMap.set(key, details);
		}
		else {
			details.index = index;
		}

		return v('div', {
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
	}

	/**
	 * Uses the exact number of rows if the viewport is full
	 * or the height of the scroll area and the estimated row height
	 * to estimate the number of rows that will fill it
	 */
	protected estimatedRowCount(): number {
		const intersections = this.meta(Intersection);
		if (
			(intersections.has('marginTop') && intersections.get('marginTop', 'scroller') > 0) ||
			(intersections.has('marginBottom') && intersections.get('marginBottom', 'scroller') > 0)
		) {
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
		const {
			_itemElementMap: itemElementMap,
			properties: {
				data: {
					items = undefined
				} = {}
			}
		} = this;

		if (scrollTo) {
			this._slice(scrollTo.index);
		}
	}

	render(): DNode {
		const {
			_itemElementMap: itemElementMap,
			properties: {
				bufferRows = 10,
				data,
				onScrollToRequest,
				onSliceRequest,
				rowDrift = 5
			}
		} = this;
		let {
			items,
			size: {
				dataLength
			},
			slice: {
				start = 0,
				count = 0
			} = {}
		} = data;
		const dimensions = this.meta(Dimensions);
		const intersections = this.meta(Intersection);

		// If among the visible rows there is a row that should be in the margins
		// find the first common visible row and use that as a reference
		// to make a new slice

		const previousKeys = from(itemElementMap.keys());
		const visibleKeys = this.visibleKeys();
		const firstVisibleKey = this._firstVisibleKey = (visibleKeys.length ? visibleKeys[0] : '');
		const lastVisibleKey = (visibleKeys.length ? visibleKeys[visibleKeys.length - 1] : '');
		if (items.length === 0) {
			this._slice(0);
		}
		else if (visibleKeys.length) {
			let slice = false;
			if (previousKeys.indexOf(firstVisibleKey) < rowDrift && start > 0) {
				slice = true;
			}
			if (previousKeys.indexOf(lastVisibleKey) > (items.length - rowDrift) && (start + count) < dataLength) {
				slice = true;
			}
			if (slice) {
				for (const item of items) {
					if (includes(visibleKeys, item.id)) {
						this._slice(item.index);
						break;
					}
				}
			}
		}
		else if (
			dimensions.has('scroller') &&
			(
				(intersections.has('marginTop') && intersections.get('marginTop', 'scroller')) > 0 ||
				(intersections.has('marginBottom') && intersections.get('marginBottom', 'scroller')) > 0
			)
		) {
			const scroll = dimensions.get('scroller').scroll.top;
			const detailsEntries = from(itemElementMap.entries());
			let scrollTo = false;
			for (const [ itemKey, details ] of detailsEntries) {
				const offsetTop = dimensions.has(itemKey) ? dimensions.get(itemKey).offset.top : 0;
				if (offsetTop) {
					const delta = (offsetTop - scroll);
					if (delta > 0) {
						// The top of the rendered data is below the current viewport
						// so we try to guess how many rows were skipped and jump
						// down to that area
						const estimatedRowHeight = this.estimatedRowHeight();
						const index = Math.max(0, (start - Math.round(delta / estimatedRowHeight)));
						onScrollToRequest && onScrollToRequest({ index });
						scrollTo = true;
					}
					break;
				}
			}
			if (!scrollTo) {
				for (const [ itemKey, renderedDetails ] of detailsEntries.reverse()) {
					const itemDimensions = dimensions.has(itemKey) ? dimensions.get(itemKey) : undefined;
					if (itemDimensions && itemDimensions.offset.top && itemDimensions.size.height) {
						const delta = (scroll - itemDimensions.offset.top - itemDimensions.size.height);
						if (delta > 0) {
							// The bottom of the rendered data is above the current viewport
							// so we try to guess how many rows were skipped and jump
							// down to that area
							const estimatedRowHeight = this.estimatedRowHeight();
							const index = Math.min(Math.max(0, dataLength - 1), (start + items.length + Math.round(delta / estimatedRowHeight)));
							onScrollToRequest && onScrollToRequest({ index });
						}
						break;
					}
				}
			}
		}

		// Reload data properties
		({
			items,
			size: {
				dataLength
			}
		} = data);
		if (data.slice) {
			({
				start,
				count
			} = data.slice);
		}
		const children: DNode[] = [];

		// Create a top margin if the data has any offset at all
		let marginTop = this._marginTop;
		if (start > 0) {
			if (!marginTop) {
				marginTop = this._marginTop = {
					add: true,
					remove: false,
					index: -1
				};
			}
			children.push(v('div', {
				key: 'marginTop',
				styles: {
					height: '10000px'
				}
			}));
			// encountering a margin always triggers an invalidation
			intersections.watch('marginTop', IntersectionWatchType.WITHIN, 'scroller');
		}
		else if (marginTop) {
			if (dimensions.has('marginTop')) {
				marginTop.height = dimensions.get('marginTop').size.height;
			}
			marginTop.remove = true;
		}

		// Detect changes between what we have now and what we will have
		if (previousKeys.length === 0) {
			// There were no item rows the last time render was called
			// so every row is added
			for (const item of items) {
				children.push(this.createNodeFromItem(item));
			}
		}
		else {
			// Create a new map so that the items will be ordered correctly
			const updatedElementMap = new Map<string, RenderedDetails>();

			// Keep a map of current keys (item IDs) and items
			const itemsByKey: { [key: string]: DNode } = {};
			const currentKeys: string[] = items.map((item, index) => {
				const key = item.id;
				// createNodeFromItem marks this item as having been added
				// automatically if it didn't exist in the mapping (is new)
				itemsByKey[key] = this.createNodeFromItem(item);
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

			// If all keys are new, we can start from scratch
			if (cleared) {
				itemElementMap.clear();
				return this.render();
			}

			// Use previous keys to watch for deleted items
			// and insert new keys at the indexes detected above
			for (let i = 0, il = previousKeys.length; i <= il; i++) {
				const key = previousKeys[ i ];

				const keyPatch = keyPatches[ i ];
				if (keyPatch) {
					for (const addedKey of keyPatch) {
						// Insert any newly introduced items
						// that were added at this index
						children.push(itemsByKey[ addedKey ]);

						// Add to the updated element map
						const update = itemElementMap.get(addedKey);
						if (update) {
							updatedElementMap.set(addedKey, update);
						}
					}
				}

				if (i < il) {
					const item = itemsByKey[ key ];
					const details = itemElementMap.get(key);
					if (item) {
						// This item has neither been added nor removed
						// since the last render
						children.push(item);

						// Add to the updated element map
						const update = itemElementMap.get(key);
						if (update) {
							updatedElementMap.set(key, update);
						}
					}
					else if (details) {
						// This item was deleted since the last render
						if (!details.remove && dimensions.has(key)) {
							// Store its rendered height before it is removed from DOM
							// as it will not be added as a row in the next render
							details.height = dimensions.get(key).size.height;
						}
						// Mark this item as having been deleted
						details.remove = true;

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

			// Store the updated item map
			this._itemElementMap = updatedElementMap;
		}

		// If start is 0 (we're at the beginning of the data set)
		// then our minimum index doesn't need to be triggered.
		// If start + count is dataLength (we're at the end of the data set)
		// then our maximum index doesn't need to be triggered.
		const minIndex = (start === 0 ? 0 : bufferRows - rowDrift);
		const maxIndex = (start + count === dataLength ? dataLength : items.length - bufferRows + rowDrift);
		for (let i = 0, item; (item = items[i]); i++) {
			if (i < minIndex || i > maxIndex) {
				// Mark all rows that are [bufferRows] outside the
				// visible area as invalidating as soon as they are within it
				intersections.watch(item.id, IntersectionWatchType.WITHIN, 'scroller');
			}
			else {
				// Rows within boundaries
				// never trigger an invalidation
				intersections.watch(item.id, IntersectionWatchType.NEVER, 'scroller');
			}
		}

		// Create a bottom margin if the data doesn't extend all the way to the end
		if (start + items.length < (dataLength - 1)) {
			children.push(v('div', {
				key: 'marginBottom',
				styles: {
					height: ('10000px')
				}
			}));
			// encountering a margin always triggers an invalidation
			intersections.watch('marginBottom', IntersectionWatchType.WITHIN, 'scroller');
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
			_itemElementMap: itemElementMap
		} = this;

		const intersections = this.meta(Intersection);
		const visible: string[] = [];
		for (const [ key, details ] of from(itemElementMap.entries())) {
			if (intersections.has(key) && intersections.get(key, 'scroller') > 0) {
				visible.push(key);
			}
		}
		return visible;
	}
}

export default Body;
