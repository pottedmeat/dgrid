import { from, includes } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import { registry as dRegistry, v, w } from '@dojo/widget-core/d';
import diffProperties, { DiffType } from '@dojo/widget-core/diff';
import { DNode, PropertiesChangeEvent } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import WidgetBase, { diffProperty, onPropertiesChanged } from '@dojo/widget-core/WidgetBase';
import { diff } from './compare';
import {
	HasColumns, HasItems, HasSliceEvent, HasOffset, HasTotalLength, ItemProperties,
	HasScrolledTo, HasEstimatedRowHeight
} from './interfaces';
import { ScrolledTo } from './Grid';
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

export function diffPropertyScrolledTo(previousProperty: ScrolledTo, newProperty: ScrolledTo) {
	if (newProperty) {
		return diffProperties('scrolledTo', DiffType.SHALLOW, previousProperty, newProperty);
	}
	return {
		changed: Boolean(previousProperty),
		value: undefined
	};
}

export const BodyBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface BodyProperties extends ThemeableProperties, HasColumns, HasEstimatedRowHeight, HasItems, HasOffset, HasTotalLength, HasScrolledTo, HasSliceEvent, RegistryMixinProperties { }

const margin = 10000;
const preload = 10;
const drift = 2;

@theme(bodyClasses)
@diffProperty('scrolledTo', DiffType.CUSTOM, diffPropertyScrolledTo)
class Body extends BodyBase<BodyProperties> {
	private itemElementMap = new Map<string, RenderedDetails>();
	private scroller: HTMLElement;
	private scrollTop = 0;
	private marginTop: RenderedDetails;
	private firstVisibleKey: string;

	@onPropertiesChanged()
	onPropertiesChanged(evt: PropertiesChangeEvent<this, BodyProperties>) {
		const {
			scrolledTo
		} = evt.properties;
		const {
			itemElementMap,
			properties: {
				items,
				onSliceRequest
			},
			scroller
		} = this;

		if (includes(evt.changedPropertyKeys, 'scrolledTo') && scrolledTo) {
			// TODO: clear this value somehow

			const index = scrolledTo.index;
			for (const item of items) {
				if (item.index === index) {
					const renderedDetails = itemElementMap.get(item.id);
					if (renderedDetails && renderedDetails.element) {
						scroller.scrollTop = renderedDetails.element.offsetTop;
						return;
					}
					break;
				}
			}

			console.log('scrolledTo slice', index, this.estimatedRowCount());
			onSliceRequest && onSliceRequest({ start: index, count: this.estimatedRowCount() });
		}
	}

	private estimatedRowCount() {
		const {
			properties: {
				estimatedRowHeight
			},
			scroller
		} = this;

		const height = scroller.offsetHeight;
		if (height) {
			return Math.round(height / this.estimatedRowHeight());
		}
		return estimatedRowHeight;
	}

	private estimatedRowHeight() {
		const {
			itemElementMap,
			properties: {
				estimatedRowHeight
			}
		} = this;

		let rowHeight = 0;
		for (let renderedDetails of from(itemElementMap.values())) {
			if (renderedDetails.element) {
				rowHeight += renderedDetails.element.offsetHeight;
			}
		}

		return Math.round(rowHeight) || estimatedRowHeight;
	}

	private visibleKeys() {
		// TODO: Use the intersection observer API
		const {
			itemElementMap,
			scroller
		} = this;
		const scroll = scroller.scrollTop;
		const contentHeight = scroller.offsetHeight;
		const visible: string[] = [];
		for (const [ key, renderedDetails ] of from(itemElementMap.entries())) {
			const element = renderedDetails.element;
			if (element) {
				const top = element.offsetTop;
				const height = element.offsetHeight;
				if ((top + height) >= scroll && top < (scroll + contentHeight)) {
					visible.push(key);
				}
				else if (visible.length) {
					break;
				}
			}
		}
		return visible;
	}

	protected onScroll() {
		const {
			itemElementMap,
			properties: {
				items,
				totalLength,
				offset,
				onSliceRequest
			},
			scroller
		} = this;

		const visibleKeys = this.visibleKeys();
		if (visibleKeys.length === 0) {
			// scrolled real fast
			const scroll = scroller.scrollTop;
			const allDetails = from(itemElementMap.values());
			for (const renderedDetails of allDetails) {
				if (renderedDetails.element && renderedDetails.element.offsetTop) {
					const delta = (renderedDetails.element.offsetTop - scroll);
					if (delta > 0) {
						// content is below the viewport and we need to move back through the data set
						itemElementMap.clear();
						const estimatedRowHeight = this.estimatedRowHeight();
						const start = (offset - Math.round(delta / estimatedRowHeight));
						const count = this.estimatedRowCount();
						onSliceRequest && onSliceRequest({ start, count });
						return;
					}
					break;
				}
			}
			for (const renderedDetails of allDetails.reverse()) {
				if (renderedDetails.element && renderedDetails.element.offsetTop && renderedDetails.element.offsetHeight) {
					const delta = (scroll - (renderedDetails.element.offsetTop + renderedDetails.element.offsetHeight));
					if (delta > 0) {
						// content is above the viewport and we need to move down through the data set
						itemElementMap.clear();
						const estimatedRowHeight = this.estimatedRowHeight();
						const start = (offset + items.length + Math.round(delta / estimatedRowHeight));
						const count = this.estimatedRowCount();
						onSliceRequest && onSliceRequest({ start, count });
						return;
					}
					break;
				}
			}
		}
		else {
			// Remember the scroll position and first visible key
			this.scrollTop = scroller.scrollTop;
			this.firstVisibleKey = visibleKeys[ 0 ];
			const renderedDetails = itemElementMap.get(this.firstVisibleKey);
			if (renderedDetails) {
				// Request new content
				// preload before and after
				const start = Math.max(0, renderedDetails.index - preload);
				let count = (Math.min(renderedDetails.index, preload) + visibleKeys.length + preload);
				if (start + count > totalLength) {
					count = (totalLength - start);
				}

				// check to see if the data we need to load is
				// different enough from what we already have
				if ((start !== offset || count !== items.length) && (start === 0 || Math.abs(start - offset) > drift || Math.abs(count - items.length) > drift || (start + count) === totalLength)) {
					// TODO: Throttle?
					console.log('onScroll slice', start, count);
					onSliceRequest && onSliceRequest({ start, count });
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
			const {
				properties: {
					items,
					offset,
					onSliceRequest
				}
			} = this;

			this.scroller = element;

			if (items.length === 0) {
				console.log('empty items slice', offset, this.estimatedRowCount());
				onSliceRequest && onSliceRequest({ start: offset, count: this.estimatedRowCount() });
			}
			else {
				this.onScroll();
			}

			return;
		}

		const renderedDetails = this.itemElementMap.get(key);
		if (renderedDetails) {
			renderedDetails.element = element;
		}
	}

	protected onElementCreated(element: HTMLElement, key: string): void {
		this.onElementChange(element, key);
	}

	protected onElementUpdated(element: HTMLElement, key: 'scroller'): void {
		if (key === 'scroller') {
			const {
				firstVisibleKey,
				itemElementMap,
				scroller
			} = this;

			let scrollTop = this.scrollTop;
			let beforeVisible = true;
			for (const [ itemKey, renderedDetails ] of from(itemElementMap.entries())) {
				if (itemKey === firstVisibleKey) {
					beforeVisible = false;
				}

				if (beforeVisible) {
					if (renderedDetails.add && renderedDetails.element) {
						scrollTop += renderedDetails.element.offsetHeight;
					}
					if (renderedDetails.delete) {
						scrollTop -= (renderedDetails.height || 0);
					}
				}

				renderedDetails.add = false;
				if (renderedDetails.delete) {
					itemElementMap.delete(itemKey);
				}
			}

			const marginTop = this.marginTop;
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

			if (scroller.scrollTop !== scrollTop) {
				scroller.scrollTop = scrollTop;
				return;
			}

			// fall through
		}

		this.onElementChange(element, key);
	}

	createNodeFromItem(item: ItemProperties<any>, index: number, add: boolean = true) {
		const {
			itemElementMap,
			properties: {
				columns,
				theme
			},
			registry = dRegistry
		} = this;

		const key = item.id;
		let renderedDetails = itemElementMap.get(key);
		if (!renderedDetails) {
			renderedDetails = {
				add: add,
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
			w<RowProperties>('row', {
				key,
				item,
				columns,
				registry,
				theme
			})
		]);
	}

	render(): DNode {
		const {
			itemElementMap,
			properties: {
				items,
				offset,
				totalLength
			}
		} = this;

		const children: DNode[] = [];

		const previousKeys = from(itemElementMap.keys());
		if (previousKeys.length === 0) {
			// TODO: Split when properties contain an offset
			for (let i = 0, item; (item = items[i]); i++) {
				children.push(this.createNodeFromItem(item, (offset + i), false));
			}
		}
		else {
			const updatedItemElementMap = new Map<string, RenderedDetails>();

			const itemsByKey: { [key: string]: DNode } = {};
			const currentKeys: string[] = items.map((item, index) => {
				const key = item.id;
				itemsByKey[key] = this.createNodeFromItem(item, (offset + index));
				return key;
			});

			const keyPatches = diff(currentKeys, previousKeys);
			const keyPatch = keyPatches[0];
			if (keyPatch && keyPatch.removed && keyPatch.removed.length === previousKeys.length) {
				itemElementMap.clear();
				return this.render();
			}

			for (let i = 0, il = previousKeys.length; i <= il; i++) {
				const key = previousKeys[i];

				const keyPatch = keyPatches[i];
				if (keyPatch) {
					if (keyPatch.added) {
						for (const added of keyPatch.added) {
							const addedKey = currentKeys[added.to];
							children.push(itemsByKey[addedKey]);

							const updatedMeasured = itemElementMap.get(addedKey);
							if (updatedMeasured) {
								updatedItemElementMap.set(addedKey, updatedMeasured);
							}
						}
					}
				}

				if (i < il) {
					const item = itemsByKey[key];
					const renderedDetails = itemElementMap.get(key);
					if (item) {
						children.push(item);

						const updatedMeasured = itemElementMap.get(key);
						if (updatedMeasured) {
							updatedItemElementMap.set(key, updatedMeasured);
						}
					}
					else {
						// this item no longer appears in current data
						if (renderedDetails) {
							if (!renderedDetails.delete && renderedDetails.element) {
								renderedDetails.height = renderedDetails.element.offsetHeight;
							}
							renderedDetails.delete = true;

							const updatedMeasured = itemElementMap.get(key);
							if (updatedMeasured) {
								updatedItemElementMap.set(key, updatedMeasured);
							}
						}
					}
				}
			}

			this.itemElementMap = updatedItemElementMap;
		}

		let marginTop = this.marginTop;
		if (offset > 0) {
			if (!marginTop) {
				marginTop = this.marginTop = {
					add: true,
					delete: false,
					index: -1
				};
			}
			children.unshift(v('div', {
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

		if (offset + items.length + 1 < totalLength) {
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
