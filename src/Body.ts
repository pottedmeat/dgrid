import { from } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import { v, w } from '@dojo/widget-core/d';
import { shallow } from '@dojo/widget-core/diff';
import { DNode } from '@dojo/widget-core/interfaces';
import { Dimensions } from '@dojo/widget-core/meta/Dimensions';
import { Intersection } from '@dojo/widget-core/meta/Intersection';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase, { diffProperty, onMetaInvalidate } from '@dojo/widget-core/WidgetBase';
import { HasBufferRows, HasColumns, HasItems, HasScrollTo, HasScrollToEvent, HasSize, HasSlice, HasSliceEvent, ItemProperties } from './interfaces';
import Row from './Row';

import * as css from './styles/body.m.css';

export const BodyBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface BodyProperties extends ThemeableProperties, HasBufferRows, HasColumns, HasItems, HasScrollTo, HasScrollToEvent, HasSize, HasSlice, HasSliceEvent, RegistryMixinProperties {}

interface RenderedDetails {
	add: boolean;
	index: number;
	height?: number;
	remove: boolean;
}

@theme(css)
class Body extends BodyBase<BodyProperties> {
	private _firstVisibleKey: string;
	private static _intersectionOptions = {
		root: 'scroller'
	};
	private _itemElementMap = new Map<string, RenderedDetails>();
	private static _marginIntersectionOptions = {
		root: 'scroller',
		threshold: from(new Array(101), (value, index) => {
			return (index / 100);
		})
	};
	private _marginTop?: RenderedDetails;
	private _scrollTop = 0;

	@onMetaInvalidate(Intersection)
	protected onIntersectionInvalidate(MetaType: Dimensions | Intersection): void {
		console.log('onIntersectionInvalidate');
		const {
			_itemElementMap: itemElementMap,
			properties: {
				items,
				slice: {
					start = 0
				} = {},
				size: {
					dataLength
				},
				onScrollToRequest
			}
		} = this;
		const dimensions = this.meta(Dimensions);
		const intersections = this.meta(Intersection);
		const max = (dataLength > 0 ? dataLength - 1 : 0);
		const visibleKeys = this.visibleKeys();

		// On a very rapid scroll, the grid may have reached
		// an area with no rendered rows
		if (
			visibleKeys.length === 0 &&
			(
				(intersections.has('marginTop') && intersections.get('marginTop', Body._marginIntersectionOptions)) > 0 ||
				(intersections.has('marginBottom') && intersections.get('marginBottom', Body._marginIntersectionOptions)) > 0
			)
		) {
			const scroll = dimensions.get('scroller').scroll.top;
			console.log('out of bounds', scroll);
			const detailsEntries = from(itemElementMap.entries());
			for (const [ itemKey, details ] of detailsEntries) {
				const offsetTop = dimensions.has(itemKey) ? dimensions.get(itemKey).offset.top : 0;
				console.log('top', itemKey, offsetTop);
				if (offsetTop) {
					const delta = (offsetTop - scroll);
					if (delta > 0) {
						// The top of the rendered data is below the current viewport
						// so we try to guess how many rows were skipped and jump
						// down to that area
						const estimatedRowHeight = this.estimatedRowHeight();
						const index = Math.max(0, (start - Math.round(delta / estimatedRowHeight)));
						console.log('scrolled down', delta, 'to', index);
						onScrollToRequest && onScrollToRequest({ index });
						return;
					}
					break;
				}
			}
			for (const [ itemKey, renderedDetails ] of detailsEntries.reverse()) {
				const itemDimensions = dimensions.has(itemKey) ? dimensions.get(itemKey) : undefined;
				if (itemDimensions) {
					console.log('bottom', itemKey, itemDimensions.offset.top + itemDimensions.size.height);
				}
				if (itemDimensions && itemDimensions.offset.top && itemDimensions.size.height) {
					const delta = (scroll - itemDimensions.offset.top - itemDimensions.size.height);
					if (delta > 0) {
						// The bottom of the rendered data is above the current viewport
						// so we try to guess how many rows were skipped and jump
						// down to that area
						const estimatedRowHeight = this.estimatedRowHeight();
						const index = Math.min(max, (start + items.length + Math.round(delta / estimatedRowHeight)));
						console.log('scrolled up', delta, 'to', index);
						onScrollToRequest && onScrollToRequest({ index });
						return;
					}
					break;
				}
			}
		}
		else {
			// This is the typical path the code will take
			this._scrollTop = dimensions.get('scroller').scroll.top;
			this._firstVisibleKey = visibleKeys[0];
			const details = itemElementMap.get(this._firstVisibleKey);
			if (details) {
				const intersections = this.meta(Intersection);
				if (
					(intersections.has('marginTop') && intersections.get('marginTop', Body._marginIntersectionOptions) > 0) ||
					(intersections.has('marginBottom') && intersections.get('marginBottom', Body._marginIntersectionOptions) > 0)
				) {
					// we don't know the exact number of visible rows
					console.log('onIntersect w/margin', this._firstVisibleKey, details.index, this.estimatedRowCount());
					this._slice(details.index, this.estimatedRowCount());
				}
				else {
					// we know exactly how many rows need to be displayed
					console.log('onIntersect absolute', this._firstVisibleKey, details.index, visibleKeys.length);
					this._slice(details.index, visibleKeys.length);
				}
			}
		}
	}

	private _slice(start: number, count: number) {
		const {
			properties: {
				bufferRows = 10,
				items,
				rowDrift = 5,
				size: {
					dataLength
				},
				slice = { start: 0, count: 0 },
				onSliceRequest
			}
		} = this;
		const max = (dataLength > 0 ? dataLength - 1 : 0);

		// Use the index of the first row as a starting point
		// as well as moving back a few rows so there's
		// additional data above the scroll area
		const sliceStart = Math.max(0, start - bufferRows);
		let sliceCount = (Math.min(start, bufferRows) + count + bufferRows);
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
		const atEnd = (start + count) === max;
		console.log('_slice deltas', startDelta, countDelta);
		if ((startDelta || countDelta) && (atStart || atEnd || startDelta > rowDrift || countDelta > rowDrift)) {
			onSliceRequest && onSliceRequest({ start: sliceStart, count: sliceCount });
		}
	}

	private _scrollTopCallback(): number {
		const {
			_firstVisibleKey: firstVisibleKey,
			_itemElementMap: itemElementMap,
			_marginTop: marginTop,
			properties: {
				onScrollToComplete,
				scrollTo
			}
		} = this;
		let scrollTop = this._scrollTop;
		console.log('_scrollTopCallback', scrollTop);

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
			console.log('all new');
			scrollTop = dimensions.has('marginTop') ? dimensions.get('marginTop').size.height : 0;

			// mark nodes as having been factored into scroll calculations
			for (const [ , details ] of detailsEntries) {
				details.add = false;
			}
			marginTop && (marginTop.add = false);
		}
		else {
			// Track size changed of rows before the first visible row
			let beforeVisible = true;
			for (const [ itemKey, details ] of detailsEntries) {
				if (itemKey === firstVisibleKey) {
					beforeVisible = false;
				}

				if (beforeVisible) {
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

		console.log('_scrollTopCallback calculated', scrollTop);

		return scrollTop;
	}

	/**
	 * Creates a DNode for the passed item and either
	 * creates or updates an associated entry in
	 * the item element map.
	 */
	protected createNodeFromItem(item: ItemProperties, index: number): DNode {
		const {
			_itemElementMap: itemElementMap,
			properties: {
				columns,
				theme,
				registry
			}
		} = this;

		const key = item.id;
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

		this.meta(Intersection).get(key, Body._intersectionOptions);

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
	 * Uses the height of the scroll area and the estimated row height
	 * to estimate the number of rows that will fill it
	 */
	protected estimatedRowCount(): number {
		const height = this.meta(Dimensions).get('scroller').size.height;
		if (height) {
			return Math.round(height / this.estimatedRowHeight());
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
				items,
				onScrollToComplete
			}
		} = this;

		if (scrollTo && items) {
			// the scrollTo property was passed either by the user
			// or by the grid after a call to onScrollToRequest
			const dimensions = this.meta(Dimensions);
			const index = scrollTo.index;
			for (const item of items) {
				// we have the "true" index on all details
				// objects so we can just directly compare
				if (item.index === index) {
					if (dimensions.has(item.id)) {
						// if this exists within the grid, just scroll to it
						// and allow the event handler to fill in any missing data
						this._scrollTop = dimensions.get(item.id).offset.top;
						console.log('get', item.id, this._scrollTop);
						this.invalidate();
						// notify the property listener that this is done
						// to allow it to clear this property
						onScrollToComplete && onScrollToComplete(scrollTo);
						return;
					}
					break;
				}
			}

			// this index is not currently rendered so we request a slice
			// of the data with a number of rows to hopefully fill in the scroll area
			console.log('scrollTo', index, this.estimatedRowCount());
			this._slice(index, this.estimatedRowCount());
		}
	}

	render(): DNode {
		console.log('Body.render');
		const {
			_itemElementMap: itemElementMap,
			properties: {
				items,
				onSliceRequest,
				size: {
					dataLength
				},
				slice: {
					start = 0
				} = {}
			}
		} = this;
		const max = (dataLength > 0 ? dataLength - 1 : 0);
		const dimensions = this.meta(Dimensions);
		const intersections = this.meta(Intersection);

		const children: DNode[] = [];

		if (items.length === 0) {
			// If there has been no data passed (e.g. during initialization),
			// we wait until the scroll area appears to get a more accurate
			// estimate of how many rows to ask for initially

			// Use the start value we found and request an amount of data
			// equal to the additional data above the scroll area, the number
			// of visible rows and the additional data below the scroll area
			console.log('render (items.length === 0)', start, this.estimatedRowCount());
			onSliceRequest && onSliceRequest({ start, count: this.estimatedRowCount() });
		}
		else {
			// Step 1: Add a margin to the top (immediately below)
			// or bottom (after Step 2)

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
				intersections.get('marginTop', Body._marginIntersectionOptions);
			}
			else if (marginTop) {
				if (dimensions.has('marginTop')) {
					marginTop.height = dimensions.get('marginTop').size.height;
				}
				marginTop.remove = true;
			}

			// Step 2: Detect changes between renders

			const previousKeys = from(itemElementMap.keys());
			if (previousKeys.length === 0) {
				// There were no item rows the last time render was called
				// so every row is added
				for (let i = 0, item; (item = items[ i ]); i++) {
					children.push(this.createNodeFromItem(item, (start + i)));
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
					itemsByKey[key] = this.createNodeFromItem(item, (start + index));
					return key;
				});

				// find which keys are new and at what index they will appear
				let cleared = true;
				let addedKeys: string[] = [];
				const keyPatches: { [ index: number]: string[] } = {};
				let previousKeyIndex = 0;
				console.log('previous', previousKeys.join(','));
				console.log('current', currentKeys.join(','));
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
					console.log('cleared');
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

			// Create a bottom margin if the data doesn't extend all the way to the end
			if (start + items.length < max) {
				children.push(v('div', {
					key: 'marginBottom',
					styles: {
						height: ('10000px')
					}
				}));
				intersections.get('marginBottom', Body._marginIntersectionOptions);
			}
		}

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
			if (intersections.has(key) && intersections.get(key, Body._intersectionOptions) > 0) {
				visible.push(key);
			}
		}
		return visible;
	}
}

export default Body;
